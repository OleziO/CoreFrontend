import type { TMatch3Pos, TMatch3Skill } from '@/features/match3/match3-engine.utils'

/** Як виглядає тип фішки: герой, його портрет і колір обідка (щоб типи легко розрізнялись). */
export interface IMatch3HeroSkin {
  /** Коротке ім'я Dota, напр. `pudge`. */
  key: string
  name: string
  /** Іконка-голова героя (Stratz), як у «Улюблених героях» профілю. */
  imageUrl: string
  /** Та сама іконка зі Steam CDN — якщо Stratz не віддав картинку. */
  fallbackUrl: string
}

export interface IMatch3SkillMeta {
  skill: TMatch3Skill
  name: string
  /** Підказка в tooltip: що робить навичка. */
  description: string
  /** Що треба зробити після вибору навички (порожньо — спрацьовує одразу). */
  targetHint: string
}

/** Спливаючий напис очок над полем. */
export interface IMatch3Popup {
  id: number
  text: string
  /** Центр у частках поля, 0…1. */
  x: number
  y: number
  big: boolean
}

export type TMatch3Hint = [TMatch3Pos, TMatch3Pos]
