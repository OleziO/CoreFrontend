# Plan: Add Promotional Banner to Tournament Page

> Source PRD: [PRD: Add Promotional Banner to Tournament Page](./tournament-promo-banner.prd.md)

## Architectural decisions

Durable decisions that apply across all phases:

- **Target page**: `src/views/tournaments/Tournament.vue` (single-tournament detail
  view), not the tournaments list.
- **Region**: upper-right of the page — inside the hero section's right column
  (`lg:col-span-5`), directly above the existing registration/info card, so it
  reuses that column's responsive grid (full width on mobile via `col-span-1`,
  right-aligned on desktop). No new layout grid or page-level wrapper is added.
- **Asset**: `@/assets/images/duelo_core.png` (1983×793, ~2.5:1). Imported as a
  static asset; rendered with preserved aspect ratio (`w-full h-auto`,
  `object-contain`) so it never stretches or breaks the layout.
- **Link**: a single `<a>` element wrapping the `<img>` is the only new element.
  - `href="https://duelo.gg/uk/join/oreleague?t=duelo-king-1-mox5htyp"`
  - `target="_blank"`
  - `rel="noopener noreferrer"`
- **Styling**: reuse existing card-adjacent conventions (rounded corners / spacing
  matching the neighboring info card, e.g. `rounded-2xl`); no duplicated style
  blocks, no `<style>` additions unless strictly required.

---

## Phase 1: Clickable promotional banner on the tournament detail page

**User stories**: Add the banner to the tournament page; make the entire banner a
secure new-tab link; keep it responsive and visually integrated with no regressions.

### What to build

A single vertical slice: import the `duelo_core.png` asset into
`Tournament.vue`, render it as an `<img>` wrapped in an external `<a>` link placed
at the top of the hero's right column (above the prize/date/participants +
registration card). The anchor opens the Duelo join URL in a new tab with the
required security attributes. The image scales by width with its natural aspect
ratio preserved on both desktop and mobile, inheriting the existing column's
responsive behavior so no horizontal scroll, stretching, or layout shift is
introduced.

### Acceptance criteria

- [ ] `duelo_core.png` renders in the upper-right region of the tournament detail
      page, undistorted (aspect ratio preserved, no stretching).
- [ ] The whole banner is a single clickable link to
      `https://duelo.gg/uk/join/oreleague?t=duelo-king-1-mox5htyp`.
- [ ] Link opens in a new tab and carries `target="_blank"` and
      `rel="noopener noreferrer"`.
- [ ] On mobile the banner stacks within the existing hero column with no overflow
      or layout break; on desktop it sits above the registration/info card without
      pushing it off-screen or overlapping other hero content.
- [ ] No new wrapper/grid beyond the single `<a>`; no duplicated styles; existing
      tournament hero/card layout is visually unchanged otherwise.
- [ ] `npm run lint` and `npm run type-check` pass.
