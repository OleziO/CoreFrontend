# Plan: Verification scheduling + Player tags

> Source: v2 backend endpoints committed in `/dota-core-be` (verification slots/requests + moderation tags). Frontend types already generated into `src/api/types/schema-v2.d.ts` via `api:prod-v2`. Admin verification is a calendar-driven tab in the admin panel; captains book slots from their team page; admins tag players from the admin player view.

## Architectural decisions

These are durable and apply to every phase. They reflect the **living `finance-monitor` convention**, not `architecture.md` literally — see the compliance note at the bottom.

### Backend contract (already shipped, do not change)

- **Base:** v2 backend (`VITE_API_PUBLIC_URL_V2`). All endpoints below are v2.
- **Slot** = a 30-min window. Status: `free` | `booked` | `cancelled`. View shape: `{ id, startsAt, endsAt, status }` (ISO UTC timestamps).
- **Request** (a booking). Status: `pending` → `processing` → `completed`, or → `cancelled`. Type: `FIRST` | `MMR_UPDATE` (BE-derived, FE never sends it). View shape: `{ id, teamId, teamName, type, status, createdByPlayerId, createdAt, slot, players: [{ id, playerId, resultMmr }] }`.
- **Endpoints:**
  - `GET /verification/slots?date=YYYY-MM-DD` — **free** slots for a UTC day (captain + admin).
  - `POST /verification/slots` — body `CreateSlotsDto { from, to }` (ISO date-time, same calendar day) → generates 30-min `free` slots (admin).
  - `DELETE /verification/slots/{id}` — delete a free slot, or cancel a booked slot + its request; `204` (admin).
  - `GET /verification/requests?date=YYYY-MM-DD` — that day's bookings, each with its `slot` (admin).
  - `POST /verification/requests` — body `CreateRequestDto { slotId, playerIds[] }` (captain).
  - `POST /verification/requests/{id}/process` — `pending` → `processing` (admin).
  - `POST /verification/requests/{id}/complete` — body `CompleteRequestDto { results: [{ playerId, mmr }] }`; writes per-player MMR, marks `completed` (admin).
  - `POST /verification/requests/{id}/cancel` — cancels, frees the slot (admin).
  - `GET /tags` — moderation tag catalog.
  - `GET /players/{playerId}/tags` — a player's tags.
  - `POST /players/{playerId}/tags/{tagId}` — assign (idempotent), returns updated list.
  - `DELETE /players/{playerId}/tags/{tagId}` — remove; `204`.
- **Business rules (BE-enforced, FE mirrors as guidance):**
  - First verification (team has `< 3` verified mains): captain must submit **≥ 3** players.
  - Established team (`≥ 3` verified mains): captain may submit as few as **1** player.
  - `FIRST` vs `MMR_UPDATE` is derived by BE from whether all submitted players are already verified.
  - Telegram notifications are BE-side only — **no FE work**.

### Frontend shape

- **v2 client:** generalize the existing v2 axios instance into `src/api/client-v2.ts` exporting `apiClientV2` (named export, per the "no default export" rule). `src/api/finance-client.ts` re-exports it for back-compat — **no finance changes**. The v2 instance is generic-typed (`get<T>/post<T>/…`); response views are hand-typed (BE doesn't type response bodies). Request bodies reuse generated `CreateSlotsDto` / `CreateRequestDto` / `CompleteRequestDto` from `schema-v2.d.ts`.
- **Shared API layer (cross-view):** `src/services/verification.service.ts` and `src/services/tags.service.ts` (singletons, auto-imported by name, alongside `auth.service.ts`/`opendota.service.ts`). They own the raw v2 calls and `ElMessage`/`ElNotification` toasts. No store (mirrors `finance-monitor`; state is local to the consuming components).
- **Types:** colocated `src/services/verification.types.ts` and `src/services/tags.types.ts` (`*.types.ts`, mirroring `finance.types.ts`). Hand-typed views `IVerificationSlot`, `IVerificationRequest`, `ITag`; status/type aliases `EVerificationSlotStatus`, `EVerificationRequestStatus`, `EVerificationType` (string-literal unions matching BE). Follow ESLint `I`/`T`/`E` prefixes.
- **Timezone:** all display + entry in the admin's **local tz**, 24h. Convert to/from UTC at the API boundary with `dayjs` (`?date=` is the local day rendered as `YYYY-MM-DD` in UTC terms — see Phase 1 note). Slot `startsAt`/`endsAt` rendered `HH:mm`–`HH:mm` local.
- **Admin UI:** new `'verification'` entry in `AdminPanel.vue`'s component-based tab array (`VerificationTab.vue` under `src/views/admin-panel/components/tabs/`). No new route. Phosphor icon imported explicitly (e.g. `PhCalendarCheck`), matching how `AdminPanel.vue` already imports `Ph*`.
- **Calendar:** Element Plus `el-calendar` with a custom date-cell slot. Click a date → tabbed day-drawer (`el-drawer`, sectioned/styled like `CreateTournamentDrawer`) with two tabs: **Заявки** (requests) and **Слоти** (slots + generate form).
- **Modals:** captain booking and any popups end in `*Modal.vue`, registered in `src/composables/use-app-modals.ts`, opened via `useAppModals()`.
- **Styling:** Tailwind + the project's dark surface vibe (cyan primary `#43bfee`, `border-white/10`, `bg-white/5`, status greens/reds), copying drawer/section/button patterns from `CreateTournamentDrawer.vue` and the finance components.

### Compliance note (architecture.md vs reality)

`.claude/architecture.md` is an aspirational/copied doc. Confirmed divergences we deliberately do **not** follow (per `.claude/CLAUDE.md`, flagged and agreed with the user): no `src/features/` (use `src/views/` + `src/services/`), no `src/services/http/` (clients in `src/api/`), `*.route.ts` singular, and **no Pinia Colada `*.queries.ts` layer** (mirror `finance-monitor`'s service+`*.types.ts`). We **do** honor the enforceable rules: named exports only, `I`/`T`/`E` prefixes, Element Plus first, VueUse first, Tailwind first, Phosphor (explicit import), `<script setup lang="ts">`, `*Modal.vue` + `useAppModals()`.

---

## Phase 0: Scaffolding & empty Verification tab ✅ Done

**Scope**: v2 client + service/types skeletons + admin tab rendering an empty calendar.

### What to build

Generalize the v2 axios instance into `src/api/client-v2.ts` (`apiClientV2`), re-export from `finance-client.ts`. Create `verification.service.ts` + `verification.types.ts` (typed method stubs returning real shapes; calls wired but no consumers yet). Add a **"Верифікація"** tab to `AdminPanel.vue` that renders `VerificationTab.vue` containing an `el-calendar` for the current month with default cell rendering. Gate the tab behind admin role (the tab list is admin-only context already; verify `hasAdminRole`).

### Acceptance criteria

- [x] `npm run type-check` and `npm run lint` pass.
- [x] `apiClientV2` is a named export in `src/api/client-v2.ts`; `finance-client.ts` re-exports it; finance still works unchanged.
- [x] A "Верифікація" tab appears in the admin panel and renders an `el-calendar` showing the current month.
- [x] `verification.service.ts` / `verification.types.ts` exist, auto-imported, with view types matching the BE contract.

---

## Phase 1: Admin read view — slots & requests on the calendar ✅ Done

**Scope**: load real per-day data, show counts on calendar cells, open a read-only tabbed day-drawer.

### What to build

For the visible month, fetch each day's `free` slots (`GET /verification/slots?date=`) and bookings (`GET /verification/requests?date=`); cache by date. Render a badge on each calendar cell summarizing **booked** and **free** counts (color-coded). Clicking a date opens the tabbed day-drawer: **Заявки** lists that day's requests (team name, type, status pill, players, slot time in local 24h) read-only; **Слоти** lists the day's slots (free from `/slots`, booked derived from each request's `slot`) read-only, sorted by time. Times converted UTC→local via `dayjs`.

> Note: endpoints are per-day only. Month view fans out per-day fetches (acceptable for a low-traffic admin tool); flag a future BE date-range endpoint as a TODO. The `?date=` value is computed so the fetched UTC day aligns with the locally displayed calendar cell.

### Acceptance criteria

- [x] Calendar cells show booked/free counts for the visible month, refreshing on month navigation.
- [x] Clicking a date opens the drawer with **Заявки** and **Слоти** tabs populated from the API.
- [x] All times display in local tz, 24h, as `HH:mm–HH:mm`.
- [x] Statuses render as styled pills matching the design vibe; empty days show a tasteful empty state.

---

## Phase 2: Admin slot management — generate & delete ✅ Done

**Scope**: create 30-min slots from a working-hours range; delete free / cancel booked slots.

### What to build

In the **Слоти** tab, a "generate slots" form: two 24h time inputs (`from`/`to`) for the selected date (Element Plus time picker/select, local tz). On submit, build `CreateSlotsDto { from, to }` as same-day ISO UTC datetimes and `POST /verification/slots`; refresh the day. Each slot row gets a delete control → `DELETE /verification/slots/{id}`; for a booked slot, confirm first (it cancels the request too). Toasts via the service; optimistic-ish refresh of the affected day + calendar badge.

### Acceptance criteria

- [x] Admin multi-selects 30-min windows (24h, local) and generates `free` slots for the selected date; they appear immediately. (Changed from a from/to range to a multiselect per user request — one create call per window via `Promise.allSettled`; already-existing windows are disabled.)
- [x] Out-of-order / cross-midnight ranges are impossible by construction (discrete 30-min windows).
- [x] Deleting a free slot removes it; deleting a booked slot prompts confirmation and cancels its request, freeing the date's counts.
- [x] `204` responses are handled (no body) without errors; failures surface a toast.

---

## Phase 3: Admin request lifecycle — process, complete (inline MMR), cancel ✅ Done

**Scope**: full admin verification lifecycle from the **Заявки** tab.

### What to build

Each `pending` request shows **Взяти в обробку** → `POST …/process`. A `processing` request row **expands inline** to per-player MMR number inputs + **Завершити** → `POST …/complete` with `CompleteRequestDto { results: [{ playerId, mmr }] }` (one entry per request player, validated non-empty/≥0, all players covered). Any non-`completed` request shows **Скасувати** → `POST …/cancel` (confirm first). After each action, refresh the day + calendar badges. Status pills reflect the new state; `completed`/`cancelled` rows are read-only. `FIRST` vs `MMR_UPDATE` shown as a badge for admin context.

### Acceptance criteria

- [x] `pending → processing → completed` works end-to-end; inline MMR inputs submit correct per-player results.
- [x] Complete is blocked client-side until every request player has a valid MMR (`canComplete` — finite, ≥ 0 for every player).
- [x] Cancel (with confirm) moves the request to `cancelled` and frees its slot in the day/calendar counts (drawer emits `refresh` → `loadDay`).
- [x] Completed/cancelled requests can't be re-actioned; the actions footer renders only for `pending`/`processing`.

---

## Phase 4: Captain booking flow ✅ Done

**Scope**: captain books a free slot for selected players from their team page.

### What to build

A **"Верифікувати гравців"** button on the captain's own team management page (visible only to the captain, RoleGuard/captain check) opens a `VerificationBookingModal`. The modal: select players from the team roster (checkbox list), pick a date (`el-date-picker`), then pick a **free** slot for that date (`GET /verification/slots?date=`, rendered as local 24h windows). Submit → `POST /verification/requests { slotId, playerIds }`. Show the player-count rule as guidance (≥ 3 for first verification, 1 allowed if the team already has ≥ 3 verified) and let the BE be the source of truth — surface BE validation errors as toasts. On success, close + confirm; the booking then appears in the admin calendar.

### Acceptance criteria

- [x] Captain (and only captain) sees the entry point on their team page (`canVerifyPlayers = isTeamCaptain`).
- [x] Modal loads free slots for the chosen date and shows a "Немає вільних слотів" empty state when none exist.
- [x] Submitting books the slot via `POST /verification/requests`; the slot is consumed and the booking appears in the admin's day for that date (admin calendar derives booked from requests).
- [x] Player-count guidance is shown (≥3 first / ≥1 established); BE rule violations surface as toasts and keep the modal open.

---

## Phase 5: Player tags (admin)

**Scope**: assign/remove moderation tags on a player from the admin player view.

### What to build

`tags.service.ts` + `tags.types.ts` (`ITag`). In the admin player view (the existing player detail/row in the admin players area), render the player's tags as chips (`GET /players/{playerId}/tags`) with a remove (×) per chip (`DELETE …/{tagId}`, `204`) and an "add tag" control populated from the catalog (`GET /tags`, cached). Assign is idempotent and returns the updated list, which replaces local state. Toasts on add/remove failures.

### Acceptance criteria

- [ ] A player's current tags render as chips in the admin player view.
- [ ] Adding a tag from the catalog updates the chip list from the returned list; re-adding the same tag is a no-op.
- [ ] Removing a tag (`204`) drops the chip immediately.
- [ ] The tag catalog is fetched once and reused across players in the session.
