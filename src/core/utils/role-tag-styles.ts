/** Парсить #RGB, #RRGGBB (з # або без). */
export function parseHexColor (input: string | null | undefined): { r: number; g: number; b: number } | null {
  if (input == null || String(input).trim() === '') return null

  let s = String(input).trim()
  if (s.startsWith('#')) s = s.slice(1)
  if (s.length === 3) {
    s = s.split('').map(c => c + c).join('')
  }
  if (s.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(s)) return null

  return {
    r: parseInt(s.slice(0, 2), 16),
    g: parseInt(s.slice(2, 4), 16),
    b: parseInt(s.slice(4, 6), 16)
  }
}

/** Сірий нейтральний, якщо color немає і не admin. */
const FALLBACK_USER = { r: 163, g: 171, b: 185 } as const // ~ slate-400
/** Янтар, якщо color немає і admin-роль. */
const FALLBACK_ADMIN = { r: 245, g: 158, b: 11 } as const

export interface IRoleTagModel {
  isAdminRole: boolean
  color?: string | null
}

/**
 * CSS-змінні для «скляних» пілюль ролей: рамка/фон/hover/tінь з однієї бази RGB.
 */
export function getRoleTagCssVars (role: IRoleTagModel): Record<string, string> {
  const parsed = parseHexColor(role.color ?? undefined)
  const { r, g, b } = parsed ?? (role.isAdminRole ? FALLBACK_ADMIN : FALLBACK_USER)

  return {
    '--rt-r': String(r),
    '--rt-g': String(g),
    '--rt-b': String(b)
  }
}
