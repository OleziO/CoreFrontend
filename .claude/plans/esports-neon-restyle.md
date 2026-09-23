# Plan: Esports Neon restyle (reference: ardcoreesports.org)

> Builds on the in-progress `dota-core-redesign` foundation. Token-first so the change propagates.

## Decisions
- Surfaces deepen toward hue 240 near-black: `#07080f → #0d0f1c → #141729 → #1b1f36`.
- Primary cyan electrified `#43bfee → #2ee5ff` (same brand hue family, more saturated); gold stays `#e8b931`.
- New neon accents: `pink #ff2fd2` (hot accent / live / gradient end), `secondary #a855f7`.
- Hairlines are cyan-tinted (`rgba(46,229,255,.16)`), not white — the single biggest "neon" signal.
- Radii sharpen: Tailwind `lg 8 / xl 10 / 2xl 12 / 3xl 16`; controls 10px, small 6px.
- Fonts (Cyrillic-capable): display **Russo One**, body **Exo 2**, mono **JetBrains Mono**.
- Utilities in `src/assets/styles/_neon.scss`: `neon-text*`, `glass-neon`, `neon-card`, `clip-cyber`,
  `hud-corners`, `hud-line`, `sys-label`, `scanlines`.

## Phases
1. Tokens + fonts (`tailwind/*`, `_tokens.scss`, `_mixins.scss`, `_base.scss`, `index.html`).
2. `_neon.scss` utility layer.
3. Element Plus resets: button, input, select, tag, dialog, drawer, dropdown, popconfirm, message-box, table.
4. Chrome: PageLayout, Header, Footer, MobileBottomTabBar, MobileMenu.
5. Cards + headings: UserCard, PlayerCard, TeamCard, TournamentCard, PlayerProfileHeader,
   TeamProfileCard, list-page h1s, Main.vue hero.
6. Verify: lint, type-check, build, screenshot.
