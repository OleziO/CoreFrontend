# Plan: MMR Request Flow

> Source: User conversation — verified players submit MMR update requests with proof screenshots; admins approve/reject from a dedicated admin panel tab.

## Architectural decisions

- **Service**: New `mmrRequestsService` at `src/views/players/mmr-requests.service.ts` — auto-imported by Vite. Uses `apiClientV2` (v2 endpoints, same pattern as verifications service).
- **Modal registry**: `PlayerRequestMmrModal` registered in `src/composables/use-app-modals.ts`. Old `ProfileRequestMmrModal` and `AdminUpdateMmrModal` stubs in the registry are superseded — leave them registered but do not wire new calls to them.
- **Image cropping**: `vue-advanced-cropper` package — interactive crop selection locked to **16:9** aspect ratio, up to 3 images per request.
- **Dropdown**: "Редагувати профіль" button in `PlayerProfileHeader` becomes a dropdown for users where `showAdditionalInfo` is true. Both options always visible; "Змінити MMR" only shown when: own profile page (`isProfilePage`) AND player is verified AND viewer is not admin/moderator.
- **Pending indicator**: `GET /mmr-requests/me` called on `/me` mount only. Result passed down as prop to `PlayerProfileHeader`. Indicator shown only when `status === 'pending'`.
- **Admin tab key**: `'mmr-requests'` added to `TAdminTabType` union in `AdminPanel.vue`.
- **API base types**: `TMmrUpdateRequest` derived from the `MmrUpdateRequestViewDto` response shape: `{ id, playerId, oldMmr, newMmr, status: 'pending'|'approved'|'rejected', createdAt, player, team, proofs }`.

---

## Phase 1: Service layer

**Scope**: Create `mmrRequestsService` with all user-facing and admin API methods.

### What to build

A singleton service class at `src/views/players/mmr-requests.service.ts` exposing:

- `createRequest(newMmr: number, proofs: File[]): Promise<TMmrUpdateRequest>` — `POST /mmr-requests` via multipart FormData (append `newMmr` as integer, append each file under `proofs`).
- `getMyRequest(): Promise<TMmrUpdateRequest | null>` — `GET /mmr-requests/me`; return `null` on 404, re-throw other errors.
- `listRequests(status?: 'pending' | 'approved' | 'rejected'): Promise<TMmrUpdateRequest[]>` — admin `GET /mmr-requests` with optional `status` query param.
- `approveRequest(id: string): Promise<TMmrUpdateRequest>` — admin `POST /mmr-requests/{id}/approve`.
- `rejectRequest(id: string): Promise<TMmrUpdateRequest>` — admin `POST /mmr-requests/{id}/reject`.

Define `TMmrUpdateRequest` and its nested types (`TMmrProof`) in the same file or a co-located `.d.ts`.

### Acceptance criteria

- [ ] `mmrRequestsService` is auto-imported (file follows service naming convention)
- [ ] `createRequest` correctly builds multipart FormData and sends to the right endpoint
- [ ] `getMyRequest` returns `null` on 404 instead of throwing
- [ ] All admin methods exist and compile without type errors
- [ ] `TMmrUpdateRequest` type covers all DTO fields

---

## Phase 2: PlayerRequestMmrModal

**Scope**: New modal for verified users to submit an MMR update request with cropped proof images.

### What to build

Create `src/views/players/modals/PlayerRequestMmrModal.vue` and register it in `use-app-modals.ts`.

**Modal content:**

1. **MMR input** — numeric field, range 0–22000, same validation pattern as `PlayerEditProfileModal`. Label: "Новий MMR".
2. **Proof upload zone** — "Завантажте до 3 скріншотів" UI:
   - Clicking/dropping a file opens `vue-advanced-cropper` in an overlay (within the modal or a nested dialog).
   - Cropper locked to 16:9 stencil; user drags to select region then confirms.
   - Confirmed crop is converted to a `File` (JPEG, reasonable quality).
   - Up to 3 images can be added; each shows a thumbnail with a remove button.
3. **Submit button** — calls `mmrRequestsService.createRequest(newMmr, proofs)`, shows loading state, on success shows `ElMessage.success('Запит надіслано')` and closes modal.
4. **Cancel button** — closes without submitting.

Props: none required (user is always the current player).

### Acceptance criteria

- [ ] Modal registered in `use-app-modals.ts` under key `PlayerRequestMmrModal`
- [ ] MMR input validates 0–22000, submit disabled when invalid
- [ ] Cropper opens on file select, locked to 16:9
- [ ] Up to 3 cropped images shown as thumbnails; each removable
- [ ] Submit calls `POST /mmr-requests` with multipart body
- [ ] Success closes modal and shows Ukrainian success toast
- [ ] Error shows Ukrainian error toast without closing modal

---

## Phase 3: Edit dropdown in PlayerProfileHeader

**Scope**: Replace the single "Редагувати профіль" button with a split-action dropdown; wire "Змінити MMR" to the new modal.

### What to build

In `PlayerProfileHeader.vue`:

- Replace the `el-button` that emits `editProfile` with an `el-dropdown` (or `el-button-group` + `el-dropdown`) that has two items:
  - **"Редагування основної інформації"** — always visible when `showAdditionalInfo`; emits `editProfile` (existing behavior, no change).
  - **"Змінити MMR"** — visible only when a new `canRequestMmr` prop is `true`.

Add `canRequestMmr: boolean` to `PlayerProfileHeader` props.

In `Player.vue`:
- Compute `canRequestMmr = isProfilePage && isVerified && !me.isAdmin.isAdmin && !me.isAdmin.isModerator`.
- Pass it to `PlayerProfileHeader`.
- Add handler `openRequestMmrModal` that calls `open('PlayerRequestMmrModal', {})`.
- Wire new `requestMmr` emit from `PlayerProfileHeader` to this handler.

### Acceptance criteria

- [ ] Verified non-admin on `/me` sees dropdown with both options
- [ ] Admin/moderator or unverified user sees dropdown with only "Редагування основної інформації" (or single button — keep existing shape)
- [ ] "Редагування основної інформації" still opens `PlayerEditProfileModal` unchanged
- [ ] "Змінити MMR" opens `PlayerRequestMmrModal`
- [ ] No TypeScript or lint errors

---

## Phase 4: Pending MMR indicator on own profile

**Scope**: Show an info icon with tooltip near the rating display in `PlayerProfileHeader` when the current user has a pending MMR request.

### What to build

In `Player.vue`:
- On mount (after `onOpen()`), if `isProfilePage`: call `mmrRequestsService.getMyRequest()` and store result in `pendingMmrRequest: TMmrUpdateRequest | null`.
- Pass `pendingMmrRequest` down to `PlayerProfileHeader` as a prop.

In `PlayerProfileHeader.vue`:
- Add `pendingMmrRequest: TMmrUpdateRequest | null` to props (optional, default `null`).
- In the rating/MMR display block (the `el-tooltip` wrapper around the rank image or numeric rating), add a `PhInfo` icon (Phosphor) immediately after the "Рейтинг" label when `pendingMmrRequest?.status === 'pending'`.
- Wrap the icon in its own `el-tooltip` with content: **"Запит на оновлення MMR обробляється"**.

### Acceptance criteria

- [ ] `GET /mmr-requests/me` called only on own profile page (`/me`)
- [ ] `PhInfo` icon appears next to the "Рейтинг" label only when status is `pending`
- [ ] Tooltip text is "Запит на оновлення MMR обробляється"
- [ ] Icon/tooltip not rendered when no pending request
- [ ] No extra network call on `/players/:id` (other players' profiles)

---

## Phase 5: Admin MMR requests tab

**Scope**: New "Запити MMR" tab in the admin panel with a filterable list and approve/reject actions, including proof image carousel.

### What to build

Create `src/views/admin-panel/components/tabs/MmrRequestsTab.vue`:

- On mount: fetch `mmrRequestsService.listRequests('pending')` (default to pending).
- **Status filter** — three buttons/tabs: "Очікують" / "Схвалені" / "Відхилені" — refetch on change.
- **Table/list** columns per request:
  - Player (avatar + discord name, linked to `/players/:id`)
  - Old MMR → New MMR (arrow between them)
  - Submitted date (formatted)
  - Proof thumbnails (click opens image carousel dialog showing full cropped images)
  - Actions: "Схвалити" (success button) + "Відхилити" (danger button) — only shown for `pending` items; both trigger the respective service method, then remove the row from the list optimistically.
- **Image carousel dialog**: `el-dialog` + `el-carousel` showing full-size proof images when thumbnails are clicked.

In `AdminPanel.vue`:
- Add `'mmr-requests'` to `TAdminTabType`.
- Add entry to `tabs` array: `{ value: 'mmr-requests', label: 'Запити MMR', icon: PhArrowsClockwise, component: MmrRequestsTab }`.

### Acceptance criteria

- [ ] Tab visible in admin panel nav
- [ ] Default view shows pending requests
- [ ] Status filter switches between pending/approved/rejected
- [ ] Each row shows player info, MMR delta, date, and proof thumbnails
- [ ] Clicking thumbnails opens carousel with full images
- [ ] Approve/reject calls correct endpoint and removes row from list
- [ ] Empty state message shown when no requests match filter
- [ ] No TypeScript or lint errors
