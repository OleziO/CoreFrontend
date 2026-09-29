# Plan: 1v1 Solo Mid ladder (duels)

> Source: user conversation (2026-09-29/30). Port the Python host-bot (`kovastew/dotabot`) to Node inside `dota-core-be`, add a
> ranked 1v1 queue + rating + leaderboard to the backend, and build the queue / leaderboard / profile / admin UI in `CoreFrontend`.

## Decisions (confirmed by the user)

| # | Topic | Decision |
|---|-------|----------|
| A | Bot code | Port Python → Node/TypeScript. Duels only (no 5v5 `/matches`, no partner API, no OpenDota fallback, no webhooks). |
| B | Process model | Third process in `dota-core-be`: `entry-points/bot-worker/main.ts`, compose service `bot-worker`, shares the Postgres DB with api-v1. |
| C | GC library | `steam-user` (`sendToGC` / `receivedFromGC`) + Valve `.proto` files compiled at runtime with `protobufjs`. No `node-dota2`. |
| D | Domain placement | v1 feature-per-folder: `src/duels/` (API) + `src/dota-bot/` (bot). |
| 7 | Matching window | ±50 rating at join, widens by 50 every 30 s in queue, no cap. Both players' windows must accept the pair. |
| 8 | Max wait | None. Queue entry lives while the client keeps polling (heartbeat), or until the player leaves. |
| 9 | Eligibility | Linked Steam account required. Admin verification not required. |
| 10 | Ready check | None. Duel is created the moment two players are paired. |
| 11 | Region | Fixed EU West (Valve region 3). |
| 12 | No free bot | Duel stays `PENDING`; the worker claims it as soon as a bot is free. After 5 min still unclaimed → `CANCELLED` (`no_bots_available`), both players re-queued automatically. |
| 13 | Concurrency | One queue entry or active duel per player. |
| 14 | Rating floor | 0. Win +25, loss −25. Everyone starts at 0. |
| 15 | No-show | Absent player −25, present player unchanged. Both absent → no change. |
| 16 | Failed | No rating change, `adminReviewRequired = true`; admin resolves by picking a winner (applies ±25) or voids. |
| 17 | Banned heroes | None. |
| 18 | Winner verification | Bot's GC postgame result is authoritative. |
| 19 | Anti-abuse | 5-minute queue cooldown after a no-show. Max 3 rated duels per day (Kyiv day) against the same opponent; the matchmaker will not pair such a couple again that day. |
| 20 | Leaderboard | New "1v1" tab on the existing `/leaderboard` page. |
| 21 | Columns | position, player, rating, wins, losses, winrate, streak. Min 1 played duel to appear. |
| 22 | Profile | 1v1 block on `/me` and `/players/:id`: rating, W/L, streak, last 10 duels. |
| 23 | Seasons | None, one lifetime ladder. |
| 24 | Route | `/1v1` (`routeNames.duels`), link in main navigation + mobile tab bar + user menu. |
| 25 | Realtime | Short polling `GET /duels/me` every 3 s while queued or in an active duel. No WebSockets. |
| 26 | Paired view | Opponent card, lobby name + password, join countdown (300 s), who has joined / picked a side. |
| 27 | Discord | No DM. |
| 28 | Language | All UI text Ukrainian. |
| 29 | Admin | Admin tab: active duels (cancel), failed duels (resolve winner / void), bot pool (add / remove / status), rating override. |
| 30 | Stats | Store live `GetRealtimeStats` snapshot (hero, K/D/A, last hits, level, net worth) and show hero + KDA in history. |

## Architecture

```
            api-v1 (NestJS, :3000)                    bot-worker (Nest app context)
 ┌────────────────────────────────────┐      ┌──────────────────────────────────────────┐
 │ DuelsModule                        │      │ DotaBotModule                            │
 │  • DuelsController  /duels/*       │      │  • HostBotPool  (loads host_bot rows,    │
 │  • DuelsAdminController /admin/…   │      │      1 HostBotWorker per Steam account)  │
 │  • DuelsService (queue, rating,    │ DB   │  • HostBotWorker (lobby state machine)   │
 │      results, leaderboard)         │◄────►│  • DotaGcClient (steam-user + protobuf)  │
 │  • DuelMatchmakerScheduler (3 s)   │      │  • RealtimeStatsService (Steam Web API)  │
 └────────────────────────────────────┘      │  • DuelsService (same code, applies ±25) │
                                             └──────────────────────────────────────────┘
 Frontend polls GET /duels/me every 3 s ──► reads duel state written by the worker.
```

- **Hand-off API → worker** is the `duel` table: the matchmaker inserts `PENDING` rows; the pool claims them with
  `SELECT … FOR UPDATE SKIP LOCKED` and writes every state transition. No HTTP between the two processes.
- **Result application** (`DuelsService.applyResult / applyNoShow / fail`) runs in the worker in one DB transaction:
  duel row + both `duel_rating` rows.
- The worker re-adopts its own `WAITING_PLAYERS` / `LIVE` duel after a restart if the GC cache still shows the same
  lobby id; otherwise it marks the duel `FAILED` (`lobby_lost`).

## Backend — data model (migration `1791100000000-DuelLadder`)

`duel_rating` (1 row per player, created on first queue join)
- `playerId` uuid PK, FK player ON DELETE CASCADE
- `rating` int default 0, `wins` int, `losses` int, `streak` int (positive = win streak, negative = loss streak)
- `lastPlayedAt` timestamptz null, `cooldownUntil` timestamptz null, `updatedAt`

`duel_queue`
- `playerId` uuid PK, FK player ON DELETE CASCADE
- `joinedAt` timestamptz, `lastSeenAt` timestamptz (heartbeat), `rating` int (snapshot at join)

`duel`
- `id` uuid PK, `state` varchar(24): `PENDING | LOBBY_CREATING | WAITING_PLAYERS | LIVE | RESOLVED | CANCELLED | FAILED`
- `player1Id`, `player2Id` uuid FK player ON DELETE SET NULL (nullable), `player1Rating`, `player2Rating` int (at match time)
- `hostBotId` int null FK host_bot, `lobbyId` varchar null, `lobbyName` varchar, `lobbyPassword` varchar, `region` int
- `lobbyPlayers` jsonb null — `[{ playerId, steamId64, present, side }]`
- `radiantPlayerId`, `direPlayerId` uuid null
- `winnerId`, `loserId` uuid null, `dotaMatchId` varchar null, `matchOutcome` int null
- `ratingDelta` int null (25 when applied), `ratingAppliedAt` timestamptz null
- `stats` jsonb null (realtime summary), `error` text null, `cancelReason` varchar null, `failReason` varchar null
- `adminReviewRequired` bool default false, `resolvedByAdminId` uuid null
- `createdAt`, `updatedAt`, `lobbyReadyAt`, `liveAt`, `finishedAt` timestamptz
- indexes: `(state)`, `(player1Id)`, `(player2Id)`, `(createdAt)`

`host_bot`
- `id` serial PK, `accountName` varchar unique, `passwordEnc` text (AES-256-GCM, key `HOSTBOT_SECRET_KEY`)
- `steamId64` varchar null, `region` int default 3, `status` varchar(16) `OFFLINE | FREE | BUSY | BANNED`
- `currentDuelId` uuid null, `lastError` text null, `lastHeartbeatAt` timestamptz null, `enabled` bool default true, `updatedAt`

## Backend — HTTP contract (all JSON, Swagger-documented)

Shared DTOs
- `DuelPlayerDto` `{ id, discordName, discordUsername, avatarUrl, steamId, rating }` (rating = 1v1 rating)
- `DuelLobbyPlayerDto` `{ playerId, steamId64, present, side: 'radiant'|'dire'|'unassigned'|null }`
- `DuelDto` `{ id, state, createdAt, lobbyReadyAt, liveAt, finishedAt, player1: DuelPlayerDto|null, player2, lobbyName,
   lobbyPassword (only for participants while state ∈ WAITING_PLAYERS|LIVE, else null), joinDeadlineAt (lobbyReadyAt+300 s),
   lobbyPlayers, radiantPlayerId, direPlayerId, winnerId, loserId, dotaMatchId, ratingDelta, cancelReason, failReason,
   adminReviewRequired, stats: DuelStatsDto|null }`
- `DuelStatsDto` `{ durationSeconds, players: [{ playerId, steamId64, heroId, kills, deaths, assists, lastHits, denies, netWorth, level, isRadiant, win }] }`
- `DuelRatingDto` `{ playerId, rating, wins, losses, streak, winrate, lastPlayedAt, cooldownUntil }`

Player endpoints (`JwtAuthGuard`)
- `POST /duels/queue` → `DuelStatusDto`. 400 `steam_not_linked`, 409 `already_queued` / `active_duel`, 429 `cooldown` (body has `cooldownUntil`).
- `DELETE /duels/queue` → `DuelStatusDto`.
- `GET /duels/me` → `DuelStatusDto` `{ rating: DuelRatingDto, queue: { joinedAt, waitSeconds, window, playersInQueue } | null,
   activeDuel: DuelDto | null, lastFinishedDuel: DuelDto | null, canQueue: boolean, queueBlockedReason: string | null }`.
   Side effect: refreshes `duel_queue.lastSeenAt`.

Public endpoints
- `GET /duels/leaderboard` → `DuelLeaderboardDto` `{ generatedAt, players: DuelLeaderboardRowDto[] }`, row = `{ position, player: DuelPlayerDto, rating, wins, losses, winrate, streak, lastPlayedAt }`.
- `GET /duels/players/:id` → `DuelPlayerProfileDto` `{ rating: DuelRatingDto | null, recent: DuelDto[] }` (last 10).
- `GET /duels/:id` → `DuelDto`.

Admin endpoints (`/admin/duels`, `JwtAuthGuard + AdminGuard`)
- `GET /admin/duels?state=&limit=` → `DuelDto[]`
- `POST /admin/duels/:id/cancel` → `DuelDto` (any non-terminal state; no rating change; bot leaves the lobby on its next tick)
- `POST /admin/duels/:id/resolve` body `{ winnerId | null }` → `DuelDto` (FAILED/CANCELLED only; winner → ±25; null → void)
- `GET /admin/duels/bots` → `HostBotDto[]` `{ id, accountName, steamId64, region, status, currentDuelId, lastError, lastHeartbeatAt, enabled }`
- `POST /admin/duels/bots` body `{ accountName, password, region? }` → `HostBotDto` (password stored encrypted; worker picks it up on next reload tick)
- `DELETE /admin/duels/bots/:id` (only when not BUSY)
- `PATCH /admin/duels/players/:id/rating` body `{ rating }` → `DuelRatingDto`

## Backend — matchmaker (`DuelMatchmakerScheduler`, api-v1, `@Interval(3000)`)

1. Prune queue rows with `lastSeenAt < now − 20 s`.
2. Cancel `PENDING` duels older than 5 min with no `hostBotId`: state `CANCELLED`, `cancelReason = no_bots_available`, re-insert both players into the queue.
3. Load queue ordered by `joinedAt`. For each unpaired player A, window `wA = 50 + 50·floor(wait/30 s)`. Pair with the first B where
   `|rA − rB| ≤ min(wA, wB)` and the pair has < 3 RESOLVED duels today. Insert `duel` (PENDING, lobby name `Core League 1v1 · <short id>`,
   random 8-char password), delete both queue rows, all in one transaction.
4. Guarded by an in-process `running` flag so ticks never overlap.

## Backend — bot worker (`src/dota-bot/`)

- `protobufs/` — vendored Valve files (transitive closure of what we use):
  `steammessages.proto, valveextensions.proto, steammessages_steamlearn.steamworkssdk.proto, steammessages_unified_base.steamworkssdk.proto,
  gcsystemmsgs.proto, gcsdk_gcmessages.proto, base_gcmessages.proto, dota_shared_enums.proto, events.proto, dota_client_enums.proto,
  dota_gcmessages_common_lobby.proto, dota_gcmessages_client_match_management.proto, dota_gcmessages_msgid.proto` +
  `google/protobuf/descriptor.proto`. Copied to `dist` via `nest-cli.json` assets.
- `dota-gc.protocol.ts` — loads the root once, exports message ids (`EGCBaseClientMsg`: hello 4006, welcome 4004, connectionStatus 4009;
  SO cache: subscribed 24, unsubscribed 25, single 21, multiple 26; `EDOTAGCMsg`: lobbyCreate 7038, leave 7040, launch 7041,
  setTeamSlot 7047, kick 7081, inviteToLobby 4512), enums (`DOTA_GC_TEAM`, lobby `State`, `EMatchOutcome`, visibility), and
  `encode(name, obj)` / `decode(name, buf)` helpers. Lobby SO type id = **2004** (constant `SO_TYPE_LOBBY`, unknown ids logged at debug).
- `dota-gc.client.ts` — one `steam-user` instance per bot: `logOn({accountName, password})` (Steam Guard must be off),
  `gamesPlayed([570])`, then `CMsgClientHello{engine: 1}` every 5 s until `CMsgClientWelcome`; `GCConnectionStatus ≠ HAVE_SESSION` → not ready.
  Keeps `lobby: CSODOTALobby | null` from the SO cache and emits `ready`, `notReady`, `lobbyNew`, `lobbyChanged`, `lobbyRemoved`, `disconnected`.
  Methods: `createPracticeLobby`, `setTeamSlot`, `inviteToLobby`, `kick`, `launchPracticeLobby`, `leaveLobby`, `logOff`.
- `host-bot.worker.ts` — port of `BotWorker` for kind=duel: supervisor with reconnect backoff, `startDuel()`, `tick()` every 3 s
  (keep bot in `PLAYER_POOL`, kick uninvited, broadcast roster to `duel.lobbyPlayers`, launch when both invited players sit on opposite sides,
  no-show after 300 s, game timeout 90 min, POSTGAME → result). Live stats polled every 15 s via `RealtimeStatsService` while LIVE.
- `host-bot.pool.ts` — loads `host_bot` rows (enabled, not BANNED) every 30 s (new rows start, removed rows stop), claims PENDING duels
  for free bots every 3 s, writes `lastHeartbeatAt` every 10 s.
- `realtime-stats.service.ts` — `GET https://api.steampowered.com/IDOTA2MatchStats_570/GetRealtimeStats/v1/?key&server_steam_id`, summarizer.
- `host-bot.crypto.ts` — AES-256-GCM with `HOSTBOT_SECRET_KEY` (base64, 32 bytes). `npm run bot:keygen` prints a new key.
- `bot-worker.module.ts` + `entry-points/bot-worker/main.ts` (`NestFactory.createApplicationContext`, SIGTERM → pool.shutdown()).
- Env: `HOSTBOT_SECRET_KEY`, `HOSTBOT_LOBBY_NAME` (default `Core League 1v1`), `HOSTBOT_REGION` (3), `HOSTBOT_JOIN_TIMEOUT` (300),
  `HOSTBOT_GAME_TIMEOUT` (5400), `HOSTBOT_BOOTSTRAP_ACCOUNTS_JSON` (optional first-start seed), `STEAM_API_KEY` (already exists).
- Compose: service `bot-worker` (same image, `node dist/entry-points/bot-worker/main`), env names added to `x-common`; deploy.yml
  forwards the new secrets/vars and starts `api-v1 api-v2 bot-worker`. `package.json`: `start:dev:bot`, `start:prod:bot`, `bot:keygen`.

## Frontend

- `src/views/duels/` — `duels.route.ts` (`path: '1v1'`, name `duels`, `meta.public: true`, SEO), `duels.service.ts` (auto-imported),
  `duels.queries.ts`, `duels.d.ts` (+ reference in `dts/env.d.ts`), `duels.utils.ts` (state labels, countdown, side labels),
  `composables/use-duel-status.ts` (query + `useIntervalFn` 3 s while queued/active), `Duels.vue`,
  `components/DuelQueuePanel.vue`, `DuelActiveCard.vue`, `DuelHistoryList.vue`, `DuelRatingBadge.vue`, `DuelLeaderboardTable.vue`.
- `Leaderboard.vue` — segmented switch «Турнірний рейтинг» / «1v1» (query param `?board=1v1`), 1v1 board via `useGetDuelLeaderboard`.
- `Player.vue` — `PlayerDuelStats.vue` block (rating, W/L, streak, last 10 duels) via `usePlayerDuelProfile`.
- Navigation — `/1v1` in `MobileBottomTabBar`, `MobileMenu`, header user dropdown and wherever `routeNames.leaderboard` is linked.
- Admin — `AdminPanel.vue` tab `duels` → `components/tabs/DuelsTab.vue` (+ `duels-admin.store.ts`): active duels, failed duels, bots, rating override.
- Types — manual entries in `src/api/types/schema.d.ts` for every new path + schema (openapi-typescript format), re-exports in `api.types.ts`.

## Phases

1. **Backend core** — entities, migration, `DuelsService`, controllers, matchmaker, module wiring. `npm run lint && npm run build`.
2. **Bot worker** — protobufs, GC client, worker, pool, realtime stats, entry point, compose + deploy + env docs. `npm run build`.
3. **Frontend** — types, service, queries, `/1v1` page, leaderboard tab, profile block, navigation, admin tab. `npm run lint && npm run type-check`.
4. **Docs** — backend `CLAUDE.md` (third process, env), `.env.example`, this plan's acceptance checklist.

## Acceptance

- [ ] Player with a linked Steam account can join/leave the queue from `/1v1`; without Steam the button explains why.
- [ ] Two queued players within the rating window get a `duel` row within 3 s; both see the opponent card.
- [ ] Worker claims the duel, hosts an unlisted 1v1 Mid lobby (EU West), invites both; UI shows name/password/countdown/presence.
- [ ] After POSTGAME the winner is +25, loser −25 (floor 0), streaks updated, duel visible in history with hero + KDA when stats were captured.
- [ ] No-show → absent player −25 and 5-min cooldown; failed → admin review; admin can cancel / resolve / manage bots / override rating.
- [ ] `/leaderboard?board=1v1` lists everyone with ≥ 1 duel; profile shows the 1v1 block.
- [ ] Both repos pass lint + type-check/build. Backend `CLAUDE.md` documents the bot-worker process.
