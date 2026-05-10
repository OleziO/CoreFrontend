# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server (`--host`, `--mode dev`). Reads `.env.dev`.
- `npm run build` — runs `type-check` then `build-only` (vite build).
- `npm run type-check` — `vue-tsc --build --force` (project references in [tsconfig.json](tsconfig.json) point at `tsconfig.app.json` and `tsconfig.node.json`).
- `npm run lint` — ESLint over `.vue,.js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts` with `--fix`, respects `.gitignore`.
- `npm run api` — regenerates [src/api/types/schema.d.ts](src/api/types/schema.d.ts) from the live backend (`https://api.core-league-dota2.org/api-json`). `npm run api:local` uses `http://localhost:3000`. Run after backend OpenAPI changes — the rest of the type system is built on this file.
- The [scripts/pre-commit](scripts/pre-commit) hook runs `lint` + `type-check`; install it manually if you want pre-commit gating (it is not auto-wired).
- Deploy is automatic on push to `master` via [.github/workflows/deploy.yml](.github/workflows/deploy.yml) (rsync over SSH from a CI build).

## Environment

`VITE_API_PUBLIC_URL` is the backend base URL used by axios and for resolving relative image paths in [src/core/helpers.ts](src/core/helpers.ts) (`resolvePublicOrApiUrl`). See [.env.example](.env.example) — Discord OAuth requires the backend's `DISCORD_REDIRECT_URI` to point at `<frontend-origin>/auth/callback`, and the frontend never holds the Discord client secret.

## Architecture

### Auto-imports (read this before adding imports)

Two unplugin configs make most Vue/Pinia/Vue Router/VueUse/i18n APIs available without explicit imports — do not add manual imports for things already auto-imported, ESLint will flag duplicates.

- [vite.config.imports.ts](vite.config.imports.ts) — `unplugin-auto-import` pulls APIs from `vue`, `vue-router`, `@vueuse/core`, `@vueuse/head`, `pinia`, `vue-i18n`, and auto-imports every file in `src/composables`, `src/composables/**/index.ts`, `src/api/*client.ts`, `src/store/modules`, `src/services`, `src/views/**/*.store.ts`, `src/views/**/*.service.ts`. Generated declarations live in [dts/auto-imports.d.ts](dts/) and [.eslintrc-auto-import.json](.eslintrc-auto-import.json). This is why files reference `defineStore`, `ref`, `computed`, `useAuthStore`, `playersService`, etc. with no import.
- [vite.config.components.ts](vite.config.components.ts) — `unplugin-vue-components` auto-registers everything under `src/components/**` plus any `src/views/**/components/**` directory. Element Plus components and icon components are also resolved here. Generated declarations: [src/vite-components.d.ts](src/vite-components.d.ts).
- [vite.config.icons.ts](vite.config.icons.ts) — custom SVGs in [src/assets/icons/](src/assets/icons/) are registered as the `icon` collection of `unplugin-icons`; use them as components (e.g. `<IconFoo />` resolves to `src/assets/icons/foo.svg`).

### Typed API client

[src/api/client.ts](src/api/client.ts) is a single shared axios instance. The interceptor reads `userToken` from `localStorage` and attaches `Authorization: Bearer …`; on 401 it clears the token and hard-redirects to `/`. Other components still see the rejection and can show their own messages.

The OpenAPI types form a chain you should respect:
1. `npm run api` writes [src/api/types/schema.d.ts](src/api/types/schema.d.ts).
2. [src/api/types/schema-helpers.d.ts](src/api/types/schema-helpers.d.ts) extracts `TResponse`, `TRequestBody`, `TRequestParameters`, `TRequestQuery` per path/method.
3. [src/api/types/axios.d.ts](src/api/types/axios.d.ts) augments axios so `apiClient.get('/players/{id}', { dynamicKeys: { id } })` is path-typed end-to-end and returns the response body directly (the success interceptor returns `response.data`).
4. [src/api/helpers.ts](src/api/helpers.ts) `parseDynamicKeys` substitutes `{id}` etc. in the URL using the `dynamicKeys` config field — call paths use the literal `{id}` placeholder, not string interpolation.
5. [src/api/types/api.types.ts](src/api/types/api.types.ts) re-exports common schema components as `TPlayer`, `TTeam`, etc.

### View module convention

Each top-level feature in [src/views/](src/views/) (players, teams, tournaments, profile, admin-panel, auth) ships a fixed set of files that the auto-import config relies on:

- `*.route.ts` — exports `xxxRouteNames` and `xxxRoutes: RouteRecordRaw[]`. Aggregated in [src/router/route-names.ts](src/router/route-names.ts).
- `*.service.ts` — a singleton class instance (e.g. `playersService`) handling network + `ElMessage` toasts. Auto-imported by name.
- `*.store.ts` — Pinia setup-store (e.g. `usePlayersStore`) that holds client-side cache and delegates network work to the service. Auto-imported by name.
- Optional `*.d.ts` for view-local types; `components/` and `modals/` subfolders register automatically.

Services often expose a top-level reactive ref (e.g. `userRolesCatalogRef` in [src/views/players/players.service.ts](src/views/players/players.service.ts)) that the matching store wraps in a `computed`. Mutations frequently merge the API response back into local state by hand (see `mergePlayerAfterVerifyMutation`) — backend can return partial payloads after admin actions, so don't replace state blindly.

### Routing & auth

[src/router/index.ts](src/router/index.ts) has a single `beforeEach` that:
- Catches Discord OAuth round-trips: any route with `?code` + `?state` is rewritten to `/auth/callback`.
- Catches Steam OpenID redirects (`?steam_linked` / `?steam_error`) and routes them to the profile page.
- Redirects unauthenticated users away from `name === 'me'`.
- Lazily calls `authStore.fetchUser()` when a token exists but `user` hasn't been hydrated.

Auth state ([src/store/modules/auth.ts](src/store/modules/auth.ts)) persists only the bearer token in `localStorage` under `userToken`; on logout it clears state and `router.push('/')`. The token attach + 401 handling already lives in the axios interceptor — don't duplicate it.

Role-gated UI uses [src/guards/RoleGuard.vue](src/guards/RoleGuard.vue) (`<RoleGuard :roles="[…]">slot</RoleGuard>`). Role identity is fuzzy: `role.name` from the API can match either the `ERole` slug ([src/types/general.types.ts](src/types/general.types.ts)) or the Ukrainian label in `roleLabelMap`; use `hasPlayerRole` from [src/core/helpers.ts](src/core/helpers.ts) instead of comparing strings directly.

### Query layer

`@pinia/colada` is wired through [src/core/use-query.utils.ts](src/core/use-query.utils.ts) (`useQueryWrapper`) and [src/core/query-cache-client.ts](src/core/query-cache-client.ts). Note that many of the per-view `composables/query/use-*.ts` files are currently commented out — feature views still call services directly through their Pinia store. When you add a new query, prefer `useQueryWrapper` so loading/placeholder handling stays consistent.

### Modals

Global modals are declared once in [src/composables/use-app-modals.ts](src/composables/use-app-modals.ts) as `defineAsyncComponent` entries and opened via `useAppModals().open('Name', props)`. The comment there is load-bearing: only one `useModals` call per module — the registry is module-level, multiple instances break async component identity.

### Styling

Tailwind config lives in [tailwind/tailwind.config.ts](tailwind/tailwind.config.ts); the alias `@colors` resolves to [tailwind/tailwind.colors.ts](tailwind/tailwind.colors.ts) for use from both Tailwind config and TS code. Global styles are imported once from [src/main.ts](src/main.ts) via `@/assets/styles/main.scss`. Element Plus is auto-imported with `importStyle: false` — its styles come from the global SCSS bundle, not from per-component imports.

## ESLint specifics

Custom `@typescript-eslint/naming-convention` enforces type-name prefixes: interfaces start with `I`, type aliases with `T`, enums with `E`. The existing codebase follows this; new types must too. `max-len` is 120 (comments/URLs/strings excluded). Indentation is enforced at 2 spaces via `@typescript-eslint/indent`.

## Domain notes

The project is a Dota 2 league management app (teams, players, tournaments, matches, admin panel). Many comments and user-facing strings are in Ukrainian / Russian — preserve language when editing user-facing text and surrounding comments. Backend integrations: Discord OAuth for login, Steam OpenID for account linking, OpenDota referenced as a TODO source for hero stats.
