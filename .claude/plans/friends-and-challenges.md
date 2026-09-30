# Plan: Friends, friend duel challenges, notification center

> Source: user request (2026-09-30). Backend in `e:/CoreLeagueFrontend/dota-core-be`, frontend in `CoreFrontend`.

## Decisions / assumptions

| # | Topic | Decision |
|---|-------|----------|
| 1 | "Players" nav dropdown | Desktop nav lives in `Footer.vue` (sticky bottom bar). "Гравці" becomes a hover dropdown (opens upward): "Гравці", "Друзі". Mobile tab bar unchanged; `MobileMenu.vue` gets "Друзі" right under "Профіль" (logged-in only). |
| 2 | Friendship model | One row per unordered pair: `friendship(requesterId, addresseeId, status PENDING/ACCEPTED/DECLINED)`. Declined rows are deleted (so a new request can be sent later). Unfriend deletes the row. |
| 3 | Challenge model | `duel_challenge(challengerId, challengedId, status PENDING/ACCEPTED/DECLINED/CANCELLED/EXPIRED, duelId, expiresAt = +5 min)`. One PENDING challenge per player at a time (as challenger). |
| 4 | Daily limit | Per player: max 3 ACCEPTED friend challenges per Europe/Kyiv day (counted for both sides). Checked at send time (challenger) and at accept time (both). |
| 5 | Rating | Friend duel = same 1v1 ladder rating, ±10 (`duel.kind = 'friend'`, `DUEL_FRIEND_RATING_DELTA`). Ranked stays ±25. No-show in a friend duel: −10. Cancel penalty stays −10. Friend duels do not count toward the ranked same-opponent limit. |
| 6 | Friend duel flow | Accepting the challenge creates the `duel` directly in PENDING (`acceptedPlayerIds` = both) with random heroes, same lobby/bot flow, same voice channel. Cancels never re-queue anyone. |
| 7 | Eligibility | Both friends, both with Steam linked, neither queued nor in an active duel, a host bot online. |
| 8 | Notifications | Persisted (`notification` table). Types: `friend_request`, `friend_request_accepted`, `duel_challenge`, `duel_challenge_accepted`, `duel_challenge_declined`, `duel_challenge_expired`. Actionable ones carry `status` mirroring the request/challenge. |
| 9 | Realtime | New socket.io namespace `/notifications` (same JWT handshake as `/duels`), pushes `notification:snapshot` `{ items, unreadCount }` on connect and after every change. Fed by the existing `duel_events` pg_notify bus with a new `{ scope: 'notification', playerIds }` event. App-wide while logged in. |
| 10 | DuelStatusDto | Gains `challenges: { incoming, outgoing, acceptedToday, dailyLimit }` and `DuelDto.kind` so the duels page reacts through the existing `/duels` socket. |
| 11 | FE placement | `src/views/friends/` (route-bound view). Notifications are global: `src/services/notifications*.service.ts`, `src/store/modules/notifications.ts`, `src/components/NotificationCenter.vue`. Follows the *codebase* conventions (`*.route.ts`, explicit query/composable imports) — `architecture.md` differs, flagged to the user. |
| 12 | Types | OpenAPI entries hand-written into `schema.d.ts` (same approach as duels); `npm run api` after deploy regenerates them. |

## Backend steps

1. Migration `1791550000000-FriendsAndChallenges`: `friendship`, `duel_challenge`, `notification`, `duel.kind` (default `ranked`).
2. `src/notifications/`: entity, DTOs, service, controller (`GET /notifications`, `POST /notifications/read`), gateway (`/notifications`), module. `duel-events.ts` gets the `notification` scope; `DuelEventsListener` forwards it.
3. `src/friends/`: entity, DTOs, service, controller (`/friends`), module (imports NotificationsModule).
4. `src/duels/`: `duel-challenge.entity.ts`, `duel-challenges.service.ts`, routes on `DuelsController` (`/duels/challenges…`), `kind` on `Duel`, `applyWinLoss`/`applyNoShow` use the duel's delta, requeue skipped for friend duels, `expireChallenges` in the matchmaker tick, `challenges` in `getStatus`.
5. Verify: `npx tsc --noEmit -p tsconfig.json`, `npm run lint`.

## Frontend steps

6. `schema.d.ts` + `api.types.ts` types.
7. `src/views/friends/` view (route `/friends`, `friends.service.ts`, `friends.store.ts`, `friends.d.ts`, components), `route-names.ts`, `dts/env.d.ts`.
8. `Footer.vue` hover dropdown, `MobileMenu.vue` entry.
9. `PlayerProfileHeader.vue` / `Player.vue`: friend + challenge buttons.
10. Duels: `duels.service.ts` challenge calls, `use-duel-status.ts` actions, `DuelChallengesPanel.vue`, `DuelChallengeFriendModal.vue`, copy updates (±10, daily counter, "Дружня" tag).
11. Notification center: services, store, `NotificationCenter.vue` in `Header.vue` (all breakpoints).
12. Verify: `npm run lint`, `npm run type-check`.
