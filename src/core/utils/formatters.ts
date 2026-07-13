import {
  tournamentAdminStatusOptions
} from '@/components/tournaments-tags/tournament.constants'

/** Статуси турніру для фільтрів списку та застарілого UpdateTournamentDrawer. */
export const tournamentStatuses = tournamentAdminStatusOptions.map(({ key, label }) => ({
  key,
  label
}))

/** Відображення призового фонду в UI (валюта одна — гривня). */
export function formatTournamentPrizeUah (value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return `${value} грн`
}

/**
 * Відображення вступного внеску в UI. Зберігається у копійках (як фінансова підсистема),
 * тож ділимо на 100 для показу в гривнях.
 */
export function formatEntryFeeUah (kopecks: number | null | undefined): string {
  if (kopecks == null || Number.isNaN(Number(kopecks))) return '—'
  const uah = Number(kopecks) / 100
  return `${Number.isInteger(uah) ? uah : uah.toFixed(2)} грн`
}
