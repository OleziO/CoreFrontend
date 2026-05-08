/** Відображення призового фонду в UI (валюта одна — гривня). */
export function formatTournamentPrizeUah (value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return `${value} грн`
}
