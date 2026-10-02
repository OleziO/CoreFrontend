# Пошук команди / гравця (`/find`)

Two-tab page: **Команди** (recruitment posts of teams, players apply) and **Гравці**
(players looking for a team, managers invite). Backend in `dota-core-be` (v1 module
`src/recruitment/`), frontend view `src/views/find/`.

## Decisions (owner answers + defaults chosen by Claude, marked *)

### Roles
- **Team manager** = captain, coach, or admin (admins for any team). Managers create /
  edit / close the team post, accept / decline applications, send invites.
- Managers of a team receive the team's application notifications (captain + coach).

### Team post (`team_recruitment_post`)
- One OPEN post per team. Fields: description (≤200, optional), positions (1–5, ≥1),
  playersNeeded (*1–5), mmrMin / mmrMax (each optional, at least one, min ≤ max, *0–22000),
  *formats ONLINE/LAN (optional, needed by the Teams-tab format filter; empty = any).
- Slot (main / reserved / coach) is chosen by the manager when accepting.
- Editable and closable manually; closes automatically when playersNeeded reaches 0.
- *Accepting an invite also decrements the team's open post.
- Admins can close (moderate) any post.

### Applying (`team_join_request`, kind APPLICATION)
- Eligibility (enforced server-side, shown client-side as disabled button + reason):
  verified, Steam linked, no team, positions set (else "заповніть профіль"),
  rating within the post's range, ≥1 player position among post positions.
- Player picks one of the matching positions; description optional ≤200.
- MMR/positions shown live from the profile (no snapshot).
- Limit: 5 applications per rolling 24 h (*withdrawn ones count); VIP unlimited.
- Withdraw allowed; re-apply to the same post after rejection/withdraw allowed.
- *Expires after 7 days. *One pending application per (team, player).
- Accept → player joins immediately in the chosen slot. Cascade: the player's other
  pending applications and invites are cancelled, their player listing is removed,
  the post's playersNeeded decrements (closes at 0 → its pending applications cancelled).
- Bell quick-accept picks *main if free (and not tournament-locked), else reserved.

### Player listing (`player_recruitment_post`)
- Creator must have no team, be verified, have Steam linked (*and positions set).
- Only the description (≤200, optional) is stored; MMR, positions, format, city are live
  from the profile. No expiry. Removed when the player joins a team (*accept cascade
  + 10-min sweep for joins via invite links / admin).

### Invites (`team_join_request`, kind INVITE)
- Any player without a team can be invited (Players tab or profile page), no post needed,
  post criteria not checked. Contains team, slot, message (≤200, optional).
- Limit: 5 invites per team per rolling 24 h; unlimited when the sender is VIP (*or admin).
- Expires after 1 week. Invitee must be verified + Steam + no team to accept.
- Accept → joins immediately; same cascade as applications.

### Tournament lock
- While `team.isPlayingTournament`, adding to the **main** slot is rejected (accept and
  invite send); reserved / coach are allowed.

### Notifications (all events, bell)
- `team_application` → managers (actionable), `team_application_accepted|declined` → player,
  `team_invite` → player (actionable), `team_invite_accepted|declined` → managers.
- Actionable entries get **Переглянути** (modal with all info + Прийняти / Відхилити),
  **Прийняти**, **Відхилити**. *Auto-cancel / expiry only updates the entry status.
- Payload gains a `team` card (id, name, logoUrl).

### Lists
- Server-side filtering, `limit=25&offset=N`, "Показати ще" button.
- Sort: VIP first (team post → captain's VIP; listing → player's VIP), then newest.
- Teams-tab filters: positions, MMR (post range includes value), only-eligible, verified,
  name search, format. Players-tab filters (*existing set minus team/verification/Steam/roles,
  which are implied): search, MMR range, rank tiers, positions, format, LAN cities.
- Tab and filters live in the route query (`?tab=players`).

### Out of scope
- Existing auth gaps on `POST /teams/:id/players`, `PATCH/DELETE /teams/:id` (separate task).
- Divisions.

## API (`/recruitment`, all JWT)
- `GET  /recruitment/me` — my listing, my pending application post ids, managed team + its post, limits left.
- `GET  /recruitment/teams` — posts (filters, limit, offset) → `{ items, total }`.
- `POST /recruitment/teams` · `PATCH /recruitment/teams/:id` · `DELETE /recruitment/teams/:id`.
- `POST /recruitment/teams/:id/applications` `{ position, message? }`.
- `GET  /recruitment/players` — listings (filters, limit, offset) → `{ items, total }`.
- `PUT  /recruitment/players/me` `{ description? }` · `DELETE /recruitment/players/me` · `DELETE /recruitment/players/:id` (admin).
- `POST /recruitment/invites` `{ teamId, playerId, slot, message? }`.
- `GET  /recruitment/requests/:id` — detail for the modal.
- `POST /recruitment/requests/:id/accept` `{ slot? }` · `POST /recruitment/requests/:id/decline` · `DELETE /recruitment/requests/:id` (withdraw / cancel).

## Phases
1. BE: entities, migration `1791900000000-Recruitment`, DTOs, service, controller, sweep scheduler,
   notification types + team payload, TeamsService `addMemberToTeam` (main/reserved/coach).
   Verify: `tsc --noEmit`, eslint.
2. Commit + push BE (auto-deploy + migration), then `npm run api` on the FE.
3. FE: `src/views/find/` (route, service, d.ts, Find.vue, tabs, cards, filter modals, post/listing/
   invite/apply/request modals), nav (header + mobile menu), bell actions, invite button on profile.
   Verify: lint + type-check + dev server. Commit + push.
