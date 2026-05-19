# PRD: Add Promotional Banner to Tournament Page

## Overview
Add a promotional banner to the tournament detail page using the provided banner
asset (`@/assets/images/duelo_core.png`). The banner acts as a clickable link and
redirects users to the specified URL.

## Requirements

### Banner Placement
- Add the banner to the tournament detail page (`src/views/tournaments/Tournament.vue`).
- Position it in the upper-right region of the page.
- Use the provided image asset without modifying its design.
- The banner should be visually integrated with the existing tournament page layout
  and remain responsive across desktop and mobile devices.

### Banner Behavior
- The entire banner must be clickable.
- On click, redirect the user to:
  `https://duelo.gg/uk/join/oreleague?t=duelo-king-1-mox5htyp`

### Link Behavior
- Open the link in a new browser tab.
- Add proper security attributes:
  - `target="_blank"`
  - `rel="noopener noreferrer"`

### Responsiveness
- Ensure the banner scales correctly on smaller screens.
- Prevent image stretching or layout breaking (preserve the asset's aspect ratio).

### Technical Notes
- Reuse existing UI/container styles where possible.
- Do not introduce unnecessary wrappers or duplicated styles.
- Keep implementation minimal and consistent with the current codebase structure.

## Acceptance Criteria
- Banner is visible in the upper-right region of the tournament detail page.
- Banner image matches the provided asset, undistorted.
- Clicking anywhere on the banner opens the specified URL in a new tab with
  `target="_blank"` and `rel="noopener noreferrer"`.
- Banner displays correctly on desktop and mobile.
- No layout regressions or visual issues appear on the tournament page.
