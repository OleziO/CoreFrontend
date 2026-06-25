# Plan: Age Gate Modal (21+)

> Source: User request — block access to the entire site behind a "Are you at least 21?" gate.
> Reference screenshot provided ("TO ENTER, YOU MUST BE AT LEAST 21 YEARS OLD" with YES / NO buttons).
> Our gate must match Core's own designs and use Ukrainian copy.

## Architectural decisions

Durable decisions that apply across all phases:

- **Mounting**: A standalone, always-mounted overlay component rendered directly in
  [`src/App.vue`](../../src/App.vue) — **not** the on-demand `useAppModals` registry
  (that registry is for user-triggered modals; the gate must appear automatically before
  any content is visible). It sits as a sibling to `<router-view>` so it covers every route.
- **Persistence**: `localStorage` (explicitly requested). Per-tab; clears when the tab/session
  closes, so the gate re-prompts on a fresh session. Suggested key: `age-gate` with values
  `'confirmed'` (21+, access granted) / `'denied'` (under 21, blocked). Absence of the key =
  not yet answered → show the question.
- **Gate visibility logic**: Show the gate whenever `localStorage['age-gate'] !== 'confirmed'`.
  This means both the unanswered state and the `'denied'` state keep the site blocked.
- **Overlay style**: Opaque, full-screen layer that completely hides site content behind it
  (not a dimmed/blurred backdrop). "Blocks access entirely" — nothing readable leaks through.
- **Route scope**: No exemptions. The gate renders on top of every route, including OAuth
  callback redirects (Discord `?code&state`, Steam linking). Routing/auth logic continues to
  run underneath the opaque overlay and is revealed once 21+ is confirmed.
- **Denied state**: After "Ні", store `'denied'` and replace the question with a denial message
  and **no buttons**. The only way forward is a page refresh, which re-shows the question
  (because the key is `'denied'`, not `'confirmed'`).
- **Copy (Ukrainian, inline strings — matching existing modals like `DueloPromoModal`)**:
  - Heading: «Щоб увійти, вам має бути щонайменше 21 рік»
  - Yes button: «Так» — subtext: «Так, мені вже є 21»
  - No button: «Ні» — subtext: «Ні, мені ще немає 21»
  - Denial message: «Доступ заборонено. Цей сайт призначений для осіб віком від 21 року.»
- **Reference component**: [`src/views/tournaments/modals/DueloPromoModal.vue`](../../src/views/tournaments/modals/DueloPromoModal.vue)
  is the closest existing pattern (global, non-dismissible-while-locked dialog) for styling cues.

---

## Phase 1: Core age gate + session persistence

**Scope**: A working, always-mounted overlay that gates the whole site based on `localStorage`.

### What to build

A standalone overlay component mounted in `App.vue`. On app load it reads the `age-gate`
localStorage key:

- **Not confirmed** (key absent or `'denied'`) → an opaque full-screen overlay covers the
  entire site, blocking view and interaction with everything behind it.
- **Unanswered** → show the question «Щоб увійти, вам має бути щонайменше 21 рік» with two
  actions, «Так» and «Ні».
  - «Так» → write `'confirmed'` to localStorage and remove the overlay; the site becomes
    fully visible and interactive.
  - «Ні» → write `'denied'` to localStorage and replace the question with the denial
    message «Доступ заборонено. Цей сайт призначений для осіб віком від 21 року.» and no buttons.
- **Confirmed** → overlay never renders; site is fully accessible.
- A page refresh while the key is `'denied'` (or absent) re-shows the question.

Markup can be functional/unstyled at this phase — the focus is correct gating behavior and
persistence. The overlay must not be dismissible by ESC, clicking outside, or any means other
than answering «Так».

### Acceptance criteria

- [ ] On first load in a fresh tab, the opaque gate covers the entire site with the question and two buttons.
- [ ] Content behind the overlay is neither visible nor interactable while the gate is shown.
- [ ] Clicking «Так» stores `age-gate=confirmed` in localStorage and reveals the site.
- [ ] Reloading the tab after «Так» does NOT re-show the gate (stays confirmed within the session).
- [ ] Clicking «Ні» stores `age-gate=denied` and swaps to the denial message with no buttons.
- [ ] After «Ні», the site remains blocked; refreshing the page re-shows the original question.
- [ ] The gate cannot be closed via ESC, outside-click, or any path other than «Так».
- [ ] The gate appears on every route, including `/auth/callback` and Steam-link redirects.
- [ ] `npm run type-check` and `npm run lint` pass.

---

## Phase 2: Design polish

**Scope**: Style the gate to match Core's design language and ensure it's responsive.

### What to build

Apply brand styling so the gate reads as a Core-designed screen rather than a raw modal:

- Typography and layout matching the reference screenshot's intent (prominent heading, the two
  choices clearly presented with their subtext), adapted to Core's design system.
- Use Element Plus buttons (`el-button`, `type="primary"` for «Так») consistent with other
  modals; primary/secondary treatment for «Так» / «Ні».
- Brand colors from the Tailwind color tokens (`@colors`) and consistent spacing.
- Responsive/mobile layout — heading and buttons remain legible and well-spaced on small screens.
- Denial-state styling consistent with the question state (same opaque background, centered message).
- Preserve all Ukrainian copy exactly as specified in the architectural decisions.

### Acceptance criteria

- [ ] Gate visually matches Core's design language (not a default unstyled modal).
- [ ] «Так» / «Ні» buttons use Element Plus styling consistent with the rest of the app.
- [ ] Heading, buttons, and subtext are laid out cleanly per the reference screenshot's intent.
- [ ] Layout is responsive and legible on mobile and desktop widths.
- [ ] Denial-state screen is styled consistently with the question state.
- [ ] All Ukrainian copy is preserved exactly.
- [ ] `npm run type-check` and `npm run lint` pass.
