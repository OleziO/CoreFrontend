import { ERole } from '@/types/general.enums'
import { roleLabelMap } from '@/components/player-tags/player.enums'

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

type TRgb = { r: number; g: number; b: number }

/**
 * Кольори відомих ролей задає фронт — вони мають пріоритет над `color` з API,
 * щоб палітра збігалася з брендовими токенами (tailwind.colors.ts) і ролі
 * поруч у картці не зливалися. Фінальні світлота/насиченість нормалізуються
 * в OKLCH у PlayerRoleTag, тож тут важливий насамперед hue.
 */
export const ROLE_COLORS: Record<ERole, string> = {
  [ERole.ADMIN]: '#e8b931', // gold
  [ERole.DEV]: '#a3abb9', // slate-400 — IT без власного акценту, як DEFAULT
  [ERole.MODERATOR]: '#a855f7', // violet
  [ERole.MEDIA]: '#ff2fd2', // hot pink
  [ERole.CAP]: '#22c55e', // green
  [ERole.PLAYER]: '#2ee5ff', // brand cyan
  [ERole.GUEST]: '#64748b', // slate
  [ERole.BLOCKED]: '#ef4444', // red
  [ERole.DEFAULT]: '#a3abb9' // slate-400
}

/** Сірий нейтральний, якщо color немає і не admin. */
const FALLBACK_USER: TRgb = { r: 163, g: 171, b: 185 } // ~ slate-400
/** Золото, якщо color немає і admin-роль. */
const FALLBACK_ADMIN: TRgb = { r: 232, g: 185, b: 49 }

export interface IRoleTagModel {
  name?: string
  isAdminRole: boolean
  color?: string | null
}

/** Зводить ім'я ролі з API (slug або українська назва) до `ERole`. */
function resolveKnownRole (name: string | undefined): ERole | null {
  if (!name) return null
  for (const er of Object.values(ERole)) {
    if (er === name || roleLabelMap[er] === name) return er
  }
  return null
}

/**
 * Для невідомих (кастомних) ролей без `color` — стабільний відтінок з хешу
 * імені, щоб дві різні ролі не були однаково сірими.
 */
function hashNameToRgb (name: string): TRgb {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0
  }
  const hue = ((hash % 360) + 360) % 360
  return hslToRgb(hue, 0.7, 0.6)
}

function hslToRgb (h: number, s: number, l: number): TRgb {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const hp = h / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  let r = 0
  let g = 0
  let b = 0
  if (hp < 1) [r, g, b] = [c, x, 0]
  else if (hp < 2) [r, g, b] = [x, c, 0]
  else if (hp < 3) [r, g, b] = [0, c, x]
  else if (hp < 4) [r, g, b] = [0, x, c]
  else if (hp < 5) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  const m = l - c / 2
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  }
}

/**
 * Базовий RGB ролі: палітра відомих ролей → колір з API → хеш імені →
 * золото/сірий за прапором admin.
 */
export function resolveRoleTagRgb (role: IRoleTagModel): TRgb {
  const known = resolveKnownRole(role.name)
  if (known) {
    const fromPalette = parseHexColor(ROLE_COLORS[known])
    if (fromPalette) return fromPalette
  }

  const fromApi = parseHexColor(role.color ?? undefined)
  if (fromApi) return fromApi

  if (role.name) return hashNameToRgb(role.name)

  return role.isAdminRole ? FALLBACK_ADMIN : FALLBACK_USER
}

/**
 * CSS-змінні для «скляних» пілюль ролей: рамка/фон/hover/tінь з однієї бази RGB.
 */
export function getRoleTagCssVars (role: IRoleTagModel): Record<string, string> {
  const { r, g, b } = resolveRoleTagRgb(role)

  return {
    '--rt-r': String(r),
    '--rt-g': String(g),
    '--rt-b': String(b)
  }
}
