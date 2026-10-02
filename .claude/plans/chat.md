# Plan: Site-wide Real-time Chat

> Source: user request (2026-10-02) — floating bottom-right chat (~500px), non-blocking; tabs General / Captains / Duel / Admin / closable PMs; PM any player; realtime via sockets; weekly cleanup job (Sunday 23:59). Details resolved via grill session (below).

## Resolved requirements

| Topic | Decision |
| --- | --- |
| General | Read: everyone incl. logged-out guests. Write: logged-in, non-blocked |
| Captains | Captains of an **active team** (`team.captain`, `disbandedAt IS NULL`) + admins. CAP role alone does NOT grant access |
| Duel | One **global** duel channel; all logged-in players |
| Admin | One private thread per user; the user sees only their own; any admin (`admin` / `IT`, i.e. `isAdminRoleName`) reads/replies to all |
| PM | 1:1 with any player |
| Blocked role | Read-only everywhere |
| Guests | Read-only General; no other tabs; composer replaced by "log in" CTA |
| PM entry points | Player profile "Написати" button · click author name/avatar in chat · "+" search in tab bar · friends list action |
| Moderation | Admins delete any message in public channels (live removal). Server-side rate limit (~1 msg/s, burst ~5) + 1000-char cap |
| Content | Plain text (escaped), auto-linked URLs, native emoji. No attachments |
| Unread | Server-side read markers (survive reload/devices). Count badges for PM/Admin/mentions, dot for public channels; badges on launcher + tabs |
| Admin UX | Admin tab for admins = list of user threads sorted by latest message with unread marks → click opens thread |
| PM tabs persistence | Open PM tabs saved in localStorage; closed tab reopens on new incoming message. History always server-side |
| Extras | Online indicator, typing indicator (PM + Admin threads), `@nick` mentions |
| Desktop panel | Draggable + resizable (default 500×600, max 80vh, min ~360×400), position/size/open state persisted; minimize to launcher |
| Mobile (<768px) | Launcher above `MobileBottomTabBar`; opened chat = full-screen sheet with close button |
| Retention | Every Sunday 23:59 **Europe/Kyiv**; delete messages older than 7 days in General + Captains + Duel. PMs and Admin threads kept |

## Architectural decisions

- **Socket namespace**: `<api>/chat` (socket.io), hosted in the api-v1 process like `/duels` and `/notifications`. Handshake reuses `authenticateSocket` from `src/realtime/socket-auth.ts`, but **unauthenticated connections are allowed** and join only the General room read-only.
- **Rooms**: `chat:general`, `chat:captains`, `chat:duel`, `chat:admin:<playerId>` (owner + all admins), `chat:dm:<minId>:<maxId>`, plus the existing `player:<playerId>` room for per-user events (unread, PM tab reopen). Admins additionally join `chat:admins` for the thread list feed.
- **Channel key** (string, used in DB, REST, socket payloads): `general` | `captains` | `duel` | `admin:<playerId>` | `dm:<minPlayerId>:<maxPlayerId>` (sorted so both sides share one key). Access is always re-checked on the server per message/history request — never trusted from the client.
- **Schema** (new migration only — never edit existing ones):
  - `chat_message` — `id uuid`, `channelKey varchar(96)` (indexed with `createdAt`), `channelKind varchar(16)` (`general|captains|duel|admin|dm`), `authorId uuid → player`, `body text` (≤1000), `mentionedPlayerIds uuid[]`, `createdAt timestamptz`, `deletedAt timestamptz null`, `deletedById uuid null`.
  - `chat_read_marker` — PK (`playerId`, `channelKey`), `lastReadAt timestamptz`.
- **Transport split**: sending, deleting, typing, read-marker updates = socket events with acks. History = REST `GET /chat/channels/:channelKey/messages?before=<iso>&limit=50` (cursor pagination, newest first). Admin thread list = REST `GET /chat/admin/threads`. Unread summary pushed on connect + after changes.
- **Cross-process**: chat writes happen in api-v1, but fan-out goes through the existing `pg_notify` event bus (new `scope: 'chat'`) so a future second instance / the cron stays consistent.
- **Server → client events** (mirrored by `IChatSocketServerEvents` on FE): `chat:message`, `chat:message-deleted`, `chat:unread`, `chat:typing`, `chat:presence`, `chat:admin-thread`, `chat:error`. **Client → server**: `chat:send`, `chat:delete`, `chat:typing`, `chat:read`.
- **Frontend location**: new `src/features/chat/` per `architecture.md` (service, store, composables, components, `chat.d.ts`, `chat.enums.ts`). Phase 1 adds `src/features/**` globs to `vite.config.imports.ts` and `vite.config.components.ts` (first feature module). Mounted once from the app shell (outside route views) so it survives navigation. New files imported explicitly the first time (running dev server won't see new auto-imports).
- **Cron**: `@Cron('59 23 * * 0', { timeZone: 'Europe/Kyiv' })` in a `chat-retention.scheduler.ts`, hard-delete `WHERE channelKind IN ('general','captains','duel') AND createdAt < now() - interval '7 days'`, then broadcast a channel-reset/refetch hint.
- **Verification**: FE `npm run lint` + `npm run type-check` + dev server (no vite build). BE `tsc` + eslint + ts-node smoke (no local DB). `npm run api` after BE OpenAPI changes are deployed (or `api:local`).

## Implementation notes (2026-10-02, all phases built)

Deviations from / refinements of the decisions above:

- **No pg_notify fan-out.** Chat writes and all `/chat` sockets live in api-v1, so the gateway emits directly to rooms. Access changes travel through a dependency-free in-process notifier `ChatAccessEvents` (`src/chat/chat-access.events.ts`), called by `TeamsService` (captain role grant / revoke) and `AdminService` (`setPlayerRoles`, `grantAdmin`, `revokeAdmin`).
- **No `chat:dm:*` / `chat:admin:*` rooms.** DMs and admin threads go to the participants' `player:<id>` rooms (+ `chat:admins` for admin threads).
- **Schema:** `chat_message.participantIds uuid[]` (GIN) replaces a separate recipient column; `createdAt` is `timestamptz(3)` — clients echo it back as the read marker / history cursor, and microseconds would leave the last message "unread" forever.
- **Unread summary** returns `adminUnreadThreadKeys: string[]` (not a count), so the admin badge stays exact between pushes.
- **Blocked users:** the role catalog has no "blocked" role (only a frontend label). `CHAT_READ_ONLY_ROLE_NAMES` matches `blocked` / `Заблокований`, so read-only mode starts working once such a role exists. Read-only players can still write in their own admin thread.
- **Rate limit:** token bucket 5 burst / 1 per second; rejected sends are refunded; buckets survive reconnects.
- **Frontend:** first module under `src/features/` (globs added to both vite configs). `ChatCommandError` lives in `chat.utils.ts` — a class exported from an auto-import-scanned `*.service.ts` gets re-injected into its own file and crashes at runtime.
- **Layout:** the launcher sits above the 56px footer strip (lg+) / 64px tab bar (< lg); the profile MMR toast moved up to `bottom-[152px]` so the launcher doesn't cover it.
- **API types:** the chat sections of `schema.d.ts` were generated with openapi-typescript from the backend DTOs (compiled with the swagger CLI plugin, merged into the prod spec) — `npm run api` after the backend deploy reproduces them.

Verification: BE tsc + eslint + jest (13 tests); a 72-check end-to-end smoke of the real ChatModule on PGlite (migration, access, fan-out, unread/read, typing, presence, delete, rate limit, live captain changes, retention purge); a 41-check headless-Chrome run of the real frontend against that backend (desktop, mobile, guest, admin). FE lint + vue-tsc clean.

---

## Phase 1: Tracer bullet — General channel end-to-end

**Scope**: Floating chat with one working General tab, realtime send/receive, history, guest read-only.

### What to build

BE `chat` module: `chat_message` entity + migration, `/chat` gateway with optional auth, `chat:send` with ack (validation, 1000-char cap, rate limit, blocked → reject), `chat:message` broadcast to `chat:general`, REST history with cursor pagination. FE `src/features/chat/`: vite globs, socket service (polling → websocket transports like notifications), store, launcher button (fixed bottom-right, above mobile tab bar, high z-index but panel is not a modal — no overlay, page stays interactive), desktop draggable/resizable panel with persisted geometry, mobile full-screen sheet, tab bar with General, message list (infinite scroll up, autolinks, escaped text, timestamps, author avatar/name), composer (Enter send, Shift+Enter newline, counter near limit). Guests see read-only General with a login CTA.

### Acceptance criteria

- [x] Two browsers logged in as different players see each other's General messages instantly
- [x] Logged-out visitor sees General live but cannot send; blocked player cannot send (server rejects even if UI bypassed)
- [x] >1000 chars or spam rejected server-side with a readable Ukrainian error
- [x] Panel drag/resize works, stays within viewport, geometry + open state survive reload; page behind remains clickable
- [x] Mobile: launcher above bottom tab bar; chat opens full-screen and closes cleanly
- [x] Scrolling up loads older history; URLs are clickable, HTML is not rendered
- [x] FE lint + type-check, BE tsc + eslint pass; new migration only

---

## Phase 2: Captains and Duel channels

**Scope**: Two more public channels with server-enforced access.

### What to build

Captains tab visible and joinable only for active-team captains and admins; Duel tab for all logged-in players. Access recomputed on connect and when captaincy changes (team created/disbanded/captain transferred → re-evaluate rooms or force reconnect for that player).

### Acceptance criteria

- [x] Non-captain cannot read history or send to `captains` (REST 403, socket ack error)
- [x] Player who becomes / stops being active captain gains / loses the tab live, without a reconnect
- [x] Duel tab works for any logged-in user, hidden for guests

---

## Phase 3: Private messages

**Scope**: 1:1 PMs with closable tabs and all four entry points.

### What to build

`dm:<min>:<max>` channels, access = the two participants only; cannot PM yourself. PM tabs show the partner's avatar + nick, close with ×; open tabs persisted in localStorage; an incoming PM reopens/creates the tab (via `player:<id>` room). Entry points: "Написати" on player profile, click author name/avatar in any channel, "+" in tab bar opening a player search, message action in the friends list. Opening the chat from an entry point opens the panel and focuses that tab. Tab overflow handled (horizontal scroll).

### Acceptance criteria

- [x] A third player cannot read a DM thread via REST or socket
- [x] Closed PM tab reappears when the partner sends a new message; open tabs restore after reload
- [x] All four entry points open the correct PM tab
- [x] Many PM tabs don't break the 500px layout

---

## Phase 4: Admin chat

**Scope**: Per-user admin support thread with admin-side thread list.

### What to build

Regular user: Admin tab = their own `admin:<selfId>` thread. Admin/IT: Admin tab = list of threads (latest message preview, user, time, unread mark) sorted by latest activity, live-updated via `chat:admin-thread`; click opens the thread with a back control. Admin replies show an "Адміністрація" badge. Admin access derived from `isAdminRoleName`.

### Acceptance criteria

- [x] User A cannot see user B's admin thread
- [x] Any admin sees every thread and new threads appear live; replies from one admin are visible to other admins
- [x] Losing the admin role removes access on reconnect

---

## Phase 5: Unread state and badges

**Scope**: Persisted read markers and badges on launcher and tabs.

### What to build

`chat_read_marker` table; `chat:read` when a tab is visible and scrolled to bottom; `chat:unread` summary on connect and on new messages. Counts for PM / Admin threads (and admin thread list), dot for public channels; launcher shows total of counted channels. Read on one device clears on others.

### Acceptance criteria

- [x] Unread counts survive reload and sync across tabs/devices
- [x] Viewing a channel clears its badge; own messages never count as unread
- [x] Launcher badge = sum of PM + Admin (+ mentions after phase 7)

---

## Phase 6: Presence and typing

**Scope**: Online dot and "Пише..." indicator.

### What to build

Presence from connected sockets per player (multi-tab aware, short grace period on disconnect), broadcast as `chat:presence` only to players who share a PM / admin thread or are visible in the list. Typing events throttled client-side, auto-expire server/client side after ~5s, only in DM and Admin threads.

### Acceptance criteria

- [x] Partner's dot turns on/off within a few seconds of connecting/closing all tabs
- [x] Typing indicator appears and disappears reliably; no event storm (throttled)

---

## Phase 7: Mentions

**Scope**: `@nick` mentions in public channels.

### What to build

Composer autocomplete for `@` (players searchable by nick; in Captains — captains only), server resolves mentions into `mentionedPlayerIds`, mentioned text highlighted, a mention counts toward the mentioned player's badge for that channel (count instead of dot).

### Acceptance criteria

- [x] Mentioned player gets a counted badge even if the channel is otherwise "dot" type
- [x] Mentions of players without channel access are not resolved
- [x] Highlight is applied without rendering raw HTML

---

## Phase 8: Admin message deletion

**Scope**: Admins remove messages in public channels.

### What to build

Hover/long-press action for admins on General / Captains / Duel messages → `chat:delete` → soft delete (`deletedAt`, `deletedById`) → `chat:message-deleted` removes it live for everyone; history excludes deleted messages.

### Acceptance criteria

- [x] Non-admin delete attempt rejected server-side
- [x] Deleted message disappears for all connected clients and from history

---

## Phase 9: Weekly retention job

**Scope**: Sunday 23:59 Europe/Kyiv cleanup of public channels.

### What to build

Scheduler with `@Cron('59 23 * * 0', { timeZone: 'Europe/Kyiv' })` hard-deleting General / Captains / Duel messages older than 7 days (including soft-deleted ones), logging the deleted count, then notifying clients to refetch loaded public channels. Read markers for public channels stay valid (timestamp-based).

### Acceptance criteria

- [x] Job registered in api-v1 only (not duplicated in api-v2 / bot-worker)
- [x] DM and Admin messages untouched
- [x] Manually invoking the job method in a smoke run deletes only eligible rows
