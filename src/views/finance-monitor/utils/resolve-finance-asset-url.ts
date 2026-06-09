/**
 * Resolve a (possibly relative) finance asset path against the v2 backend base.
 *
 * The finance feed returns icon/logo paths like `/uploads/teams/<id>.jpg` that are
 * served by the v2 service (`VITE_API_PUBLIC_URL_V2`). Absolute URLs are returned as-is.
 */
export function resolveFinanceAssetUrl (path: string | null | undefined): string {
  const raw = typeof path === 'string' ? path.trim() : ''
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return raw
  if (raw.startsWith('//')) return `https:${raw}`

  const base = String(import.meta.env.VITE_API_PUBLIC_URL_V2 ?? '').replace(/\/+$/, '')
  const p = raw.startsWith('/') ? raw : `/${raw}`

  return base ? `${base}${p}` : p
}

/**
 * Reverse-map a feed item's resolved `iconUrl` back to a managed asset id.
 *
 * The V2 feed only exposes a resolved `iconUrl`, never the underlying `iconAssetId`,
 * but `PATCH /operations/{id}` is a full replace and needs the id to keep a manual
 * icon when editing other fields. Matching the resolved URLs recovers it; a non-asset
 * icon (e.g. a team logo) has no managed id and correctly returns `null`.
 */
export function findAssetIdByResolvedUrl (
  assets: { id: string; url: string }[],
  iconUrl: string | null | undefined
): string | null {
  const target = resolveFinanceAssetUrl(iconUrl)
  if (!target) return null

  return assets.find(asset => resolveFinanceAssetUrl(asset.url) === target)?.id ?? null
}
