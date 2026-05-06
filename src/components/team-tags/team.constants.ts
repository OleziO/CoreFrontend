export enum ETeamStatus {
  APPROVED = 'approved',
  APPLIED = 'applied',
}

// 2. Маппинг названий (то, что видит пользователь)
export const teamStatusLabelMap: Record<string, string> = {
  [ETeamStatus.APPROVED]: 'Схвалена',
  [ETeamStatus.APPLIED]: 'В обробці'
}

// 3. Маппинг стилей (цвета)
export const teamStatusClassMap: Record<string, string> = {
  [ETeamStatus.APPROVED]: `
    !border !border-green-500/40
    !bg-green-500/10 !text-green-400
    rounded-lg px-8 py-4
    text-[11px] tracking-wide
    font-semibold
    shadow-[0_0_12px_rgba(34,197,94,0.2)]
    transition-all duration-300
  `,

  [ETeamStatus.APPLIED]: `
    border border-red-500/40
    bg-red-500/15 text-red-300
    rounded-lg px-12 py-5
    text-[12px] tracking-wide
    font-semibold
    transition-all duration-300
  `
}
