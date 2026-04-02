export enum ETournamentType {
  MIX = 'mix',
  TEAM = 'team',
}

// 1. Маппінг назв (те, що бачить користувач)
export const tournamentTypeLabelMap: Record<string, string> = {
  [ETournamentType.MIX]: 'Мікс',
  [ETournamentType.TEAM]: 'Командний'
}

// 2. Маппінг стилів (Синій для міксу, Фіолетовий для команди)
export const tournamentTypeClassMap: Record<string, string> = {
  [ETournamentType.MIX]: `
    !border !border-blue-500/40
    !bg-blue-500/10 !text-blue-400
    rounded-lg px-8 py-4
    text-[11px] tracking-wide
    font-semibold uppercase
    shadow-[0_0_12px_rgba(59,130,246,0.2)]
    transition-all duration-300
  `,

  [ETournamentType.TEAM]: `
    !border !border-purple-500/40
    !bg-purple-500/10 !text-purple-400
    rounded-lg px-8 py-4
    text-[11px] tracking-wide
    font-semibold uppercase
    shadow-[0_0_12px_rgba(168,85,247,0.2)]
    transition-all duration-300
  `
}

export enum ETournamentStatus {
  PRE_REGISTRATION = 'pre-registration',
  REGISTRATION = 'registration',
  TEAM_CREATION = 'team-creation',
  IN_PROGRESS = 'in-progress',
  ENDED = 'ended',
}

export const tournamentStatusLabelMap: Record<ETournamentStatus, string> = {
  [ETournamentStatus.PRE_REGISTRATION]: 'Анонс',
  [ETournamentStatus.REGISTRATION]: 'Реєстрація',
  [ETournamentStatus.TEAM_CREATION]: 'Формування команд',
  [ETournamentStatus.IN_PROGRESS]: '◉ Live',
  [ETournamentStatus.ENDED]: 'Завершено'
}

export const tournamentStatusClassMap: Record<ETournamentStatus, string> = {
  [ETournamentStatus.PRE_REGISTRATION]: `
    !border !border-gray-500/40 !bg-gray-500/10 !text-gray-400
    rounded-lg !px-10 !py-6 text-sm font-semibold uppercase tracking-wide
  `,
  [ETournamentStatus.REGISTRATION]: `
    !border !border-green-500/40 !bg-green-500/10 !text-green-400
    rounded-lg !px-10 !py-6 text-sm font-semibold uppercase tracking-wide
    shadow-[0_0_12px_rgba(34,197,94,0.2)]
  `,
  [ETournamentStatus.TEAM_CREATION]: `
    !border !border-orange-500/40 !bg-orange-500/10 !text-orange-400
    rounded-lg !px-10 !py-6 text-sm font-semibold uppercase tracking-wide
  `,
  [ETournamentStatus.IN_PROGRESS]: `
    !border !border-red-500/40 !bg-red-500/10 !text-red-400
    rounded-lg !px-10 !py-6 text-sm font-semibold uppercase tracking-wide animate-pulse
  `,
  [ETournamentStatus.ENDED]: `
    !border !border-yellow-500/40 !bg-yellow-500/10 !text-yellow-400
    rounded-lg px-10 py-6 text-sm font-semibold uppercase tracking-wide
  `
}
