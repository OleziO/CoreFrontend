// Tournament type constants (kept for backward compat, no longer in API schema)
export const tournamentTypeLabelMap: Record<string, string> = {}
export const tournamentTypeClassMap: Record<string, string> = {}

export enum ETournamentStatus {
  SCHEDULED = 'SCHEDULED',
  REGISTRATION = 'REGISTRATION_OPEN',
  PRE_REGISTRATION = 'REGISTRATION_CLOSED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export const tournamentStatusLabelMap: Record<string, string> = {
  SCHEDULED: 'Анонс',
  REGISTRATION_OPEN: 'Реєстрація відкрита',
  REGISTRATION_CLOSED: 'Реєстрація закрита',
  IN_PROGRESS: '◉ Live',
  COMPLETED: 'Завершено'
}

export const tournamentStatusClassMap: Record<string, string> = {
  SCHEDULED: `
    !border !border-gray-500/40 !bg-gray-500/10 !text-gray-400
    rounded-lg !px-10 !py-6 text-sm font-semibold uppercase tracking-wide
  `,
  REGISTRATION_OPEN: `
    !border !border-green-500/40 !bg-green-500/10 !text-green-400
    rounded-lg !px-10 !py-6 text-sm font-semibold uppercase tracking-wide
    shadow-[0_0_12px_rgba(34,197,94,0.2)]
  `,
  REGISTRATION_CLOSED: `
    !border !border-orange-500/40 !bg-orange-500/10 !text-orange-400
    rounded-lg !px-10 !py-6 text-sm font-semibold uppercase tracking-wide
  `,
  IN_PROGRESS: `
    !border !border-red-500/40 !bg-red-500/10 !text-red-400
    rounded-lg !px-10 !py-6 text-sm font-semibold uppercase tracking-wide animate-pulse
  `,
  COMPLETED: `
    !border !border-yellow-500/40 !bg-yellow-500/10 !text-yellow-400
    rounded-lg px-10 py-6 text-sm font-semibold uppercase tracking-wide
  `
}
