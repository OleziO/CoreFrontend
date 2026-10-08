import type { TMatch3Skill } from '@/features/match3/match3-engine.utils'
import type { IMatch3SkillMeta } from '@/features/match3/match3.d'

/** Герої за замовчуванням — коли Steam не прив'язаний або OpenDota не віддав топ гравця. */
export const MATCH3_DEFAULT_HEROES: { key: string; name: string }[] = [
  { key: 'pudge', name: 'Pudge' },
  { key: 'crystal_maiden', name: 'Crystal Maiden' },
  { key: 'juggernaut', name: 'Juggernaut' },
  { key: 'invoker', name: 'Invoker' },
  { key: 'axe', name: 'Axe' },
  { key: 'lina', name: 'Lina' }
]

/** Колір обідка за типом фішки (RGB для `rgba(var(--tone), a)`): тип читається і за кольором, і за портретом. */
export const MATCH3_KIND_TONES = [
  '244, 63, 94',
  '56, 189, 248',
  '52, 211, 153',
  '251, 191, 36',
  '167, 139, 250',
  '251, 146, 60'
]

export const MATCH3_SKILLS: IMatch3SkillMeta[] = [
  {
    skill: 'blink',
    name: 'Blink',
    description: 'Поміняйте будь-які дві сусідні фішки — навіть без збігу. Хід не витрачається.',
    targetHint: 'Blink: оберіть дві сусідні фішки'
  },
  {
    skill: 'laguna',
    name: 'Laguna Blade',
    description: 'Спалює весь рядок. Спецфішки в ньому вибухають. Хід не витрачається.',
    targetHint: 'Laguna Blade: оберіть рядок'
  },
  {
    skill: 'refresher',
    name: 'Refresher Orb',
    description: 'Перемішує поле. Рятує, коли ходів не лишилось.',
    targetHint: ''
  }
]

export const MATCH3_SKILL_BY_ID = Object.fromEntries(
  MATCH3_SKILLS.map((meta) => [meta.skill, meta])
) as Record<TMatch3Skill, IMatch3SkillMeta>

/**
 * Тривалість фаз анімації, мс. Падіння залежить від відстані: `fallBase + fallPerRow × рядки` —
 * ті самі числа йдуть у CSS-змінні поля, тож очікування в коді й CSS-переходи збігаються.
 */
export const MATCH3_STEP_MS = {
  swap: 300,
  /** Невдалий обмін: фішки міняються місцями й повертаються назад — кожен напрямок. */
  revert: 280,
  clear: 420,
  fallBase: 260,
  fallPerRow: 70,
  shuffle: 700,
  /** Скільки висить напис очок / бонусного часу. */
  popup: 1300
} as const

/** Тривалість падіння на `rows` рядків. */
export function match3FallMs (rows: number): number {
  return MATCH3_STEP_MS.fallBase + MATCH3_STEP_MS.fallPerRow * Math.max(0, rows)
}

/** Скільки секунд лишилось → «1:05». */
export function formatMatch3Clock (ms: number): string {
  const total = Math.ceil(Math.max(0, ms) / 1000)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

/** Через скільки секунд бездіяльності підсвітити можливий хід. */
export const MATCH3_HINT_DELAY_MS = 6000

export const MATCH3_LEADERBOARD_QUERY_KEY = ['match3', 'leaderboard'] as const

export function pluralizeMatch3Moves (n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return `${n} хід`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} ходи`
  return `${n} ходів`
}

export function formatMatch3Score (n: number): string {
  return Math.round(n).toLocaleString('uk-UA')
}
