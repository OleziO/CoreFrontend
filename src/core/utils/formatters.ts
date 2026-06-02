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
