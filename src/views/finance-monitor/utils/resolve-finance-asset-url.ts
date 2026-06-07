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
