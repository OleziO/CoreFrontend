# PRD — Player Profile & Team Page Improvements

## Overview

Three improvements related to player management and team presentation:

1. Restore the missing roles multiselect in admin player profile editing.
2. Add favorite heroes block to player profile statistics using OpenDota API + Stratz CDN images.
3. Add coach section to the team roster block.

---

## 1. Restore Roles Multiselect in Admin Player Profile Edit

**Problem:** In the admin player profile editing form, the multiselect used for assigning player roles is missing. Admins cannot manage player roles from the profile edit page.

**Requirements:**
- Restore the roles multiselect component in the admin player profile edit form.
- Use the same component and behavior that existed previously or matches the current design system.
- Roles should: load correctly from backend data; display selected values; allow multi-selection; persist changes after save.
- Ensure validation and submission payload still work correctly.

**Expected behavior:** Admin can open player edit page, see current assigned roles, add/remove roles, save profile successfully.

**Technical notes:** Reuse existing role options source if already implemented elsewhere. Ensure backward compatibility with existing player data. Verify form state synchronization after save/reload.

---

## 2. Add Favorite Heroes Block to Player Profile

**Overview:** Add a "Favorite Heroes" section inside the lower statistics block on the player profile page. Heroes fetched dynamically from OpenDota API.

**Data source:** OpenDota API player heroes endpoint, e.g. `https://api.opendota.com/api/players/{account_id}/heroes`.

**Requirements:**
- Fetch favorite heroes for the player using their Dota account ID.
- Show top heroes sorted by usage/play count.
- Add loading and empty states.
- Display: hero image; hero name; matches played; winrate (if available).

**Hero images:** Stratz CDN hero icons, e.g. `https://cdn.stratz.com/images/dota2/heroes/spectre_icon.png`.

**UI requirements:** Integrate into existing lower statistics section; match existing profile visual style; responsive layout; hero cards visually align with current stat cards.

**Edge cases:** player without linked Dota account; failed API requests; empty OpenDota response; missing hero images.

**Performance:** Avoid unnecessary repeated requests; cache/memoize where appropriate; avoid aggressive UI shift during loading.

---

## 3. Add Coach Block to Team Page

**Overview:** Add coach information to the team roster section (currently main players + substitutes).

**Requirements:**
- Add coach display directly inside the existing roster block, immediately below substitute players.
- Coach UI should visually match existing player cards/rows.
- Option A (Preferred): Extend the existing roster block — Main roster / Substitutes / Coach.
- Option B: Replace substitutes block structure with a unified roster structure.

**Coach information:** avatar; nickname; full name (if available); country/flag if currently supported elsewhere. Click behavior matches existing player cards.

**Empty state:** If no coach exists, either hide the section or show a lightweight placeholder depending on current UX patterns.

**Technical notes:** Reuse existing player/team card components; avoid duplicating roster rendering logic; ensure coach data is included in API response or add backend support if missing.

---

## Acceptance Criteria

**Roles Multiselect:** visible again in admin player edit form; roles can be updated and saved successfully.

**Favorite Heroes:** block appears in player statistics section; data loads from OpenDota API correctly; hero icons load from Stratz CDN; empty/loading/error states work properly.

**Coach Block:** coach appears on team page roster section; layout matches existing team roster UI; no duplicated rendering logic introduced.
