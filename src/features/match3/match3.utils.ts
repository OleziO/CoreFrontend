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

/** Тривалість фаз анімації, мс. */
export const MATCH3_STEP_MS = {
  swap: 200,
  clear: 260,
  fall: 300,
  shuffle: 450,
  invalid: 320
} as const

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
