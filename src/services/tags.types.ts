import type { components } from '@/api/types/schema-v2'

/**
 * Moderation tags live on the v2 backend (`apiClientV2`), alongside verification.
 *
 * The view type is derived from the generated `schema-v2.d.ts` component so there is a
 * single source of truth. It uses the `T` prefix (not `I`): it is an indexed-access type
 * alias, not an `interface` declaration, so the ESLint `typeAlias` rule requires `T` —
 * matching the `verification.types.ts` / `finance.types.ts` convention.
 *
 * (The plan names this `ITag`; we follow the established `T`-for-aliases reality instead,
 * the same divergence already resolved in `verification.types.ts`.)
 */

/** A moderation tag (catalog entry or a player's assigned tag). */
export type TTag = components['schemas']['TagViewDto']
