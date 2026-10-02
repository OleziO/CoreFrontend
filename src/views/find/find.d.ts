import type { TTournamentFormat } from '@/api/types/api.types'

/** Вкладка сторінки «Пошук команди»; живе в `?tab=`. */
export type TFindTab = 'teams' | 'players'

/** Фільтри вкладки «Команди» (оголошення команд). */
export interface IFindTeamsFilters {
  positions: number[]
  /** Оголошення, чий діапазон MMR містить це значення. */
  mmr: number | null
  /** Лише оголошення, куди я можу подати заявку. */
  eligible: boolean
  /** Лише верифіковані команди. */
  verified: boolean
  formats: TTournamentFormat[]
}

/** Фільтри вкладки «Гравці» (гравці шукають команду). */
export interface IFindPlayersFilters {
  ratingFrom: number | null
  ratingTo: number | null
  /** Тир медалі 1–8. */
  ranks: number[]
  positions: number[]
  formats: TTournamentFormat[]
  /** Міста для LAN; враховуються лише разом із форматом LAN. */
  lanCities: string[]
}

/** Сторінка списку з бекенду + стан «Показати ще». */
export interface IFindPage<T> {
  items: T[]
  total: number
}
