export enum EDivision {
  DIV_I = 'Дивізіон I',
  DIV_II = 'Дивізіон II',
  DIV_III = 'Дивізіон III',
  SEMI_PRO = 'Напів-професійний Дивізіон',
  PRO = 'Професійний Дивізіон',
}

export const divisionLabels: Record<string, string> = {
  [EDivision.DIV_I]: 'Дивізіон I',
  [EDivision.DIV_II]: 'Дивізіон II',
  [EDivision.DIV_III]: 'Дивізіон III',
  [EDivision.SEMI_PRO]: 'Напів-професійний',
  [EDivision.PRO]: 'Професійний'
}

export const divisionClassMap: Record<string, string> = {
  [EDivision.DIV_I]: `
    !border !border-orange-400/40
    !bg-orange-400/10 !text-orange-300
    rounded-lg px-8 py-4
    text-[11px] tracking-wide
    font-semibold
    shadow-[0_0_12px_rgba(251,146,60,0.2)]
    transition-all duration-300
  `,
  [EDivision.DIV_II]: `
    !border !border-[rgba(230,233,255,0.4)]
    !bg-[rgba(230,233,255,0.1)] !text-[rgba(230,233,255,0.7)]
    rounded-lg px-8 py-4
    text-[11px] tracking-wide
    font-semibold
    shadow-[0_0_10px_rgba(230,233,255,0.1)]
    transition-all duration-300
  `,
  [EDivision.DIV_III]: `
    !border !border-yellow-400/40
    !bg-yellow-400/10 !text-yellow-300
    rounded-lg px-8 py-4
    text-[11px] tracking-wide
    font-semibold
    shadow-[0_0_12px_rgba(234,179,8,0.15)]
    transition-all duration-300
  `,
  [EDivision.SEMI_PRO]: `
    !border !border-[rgba(6,182,212,0.4)]
    !bg-[rgba(6,182,212,0.15)] 
    !text-[#22d3ee]
    rounded-lg px-8 py-4
    text-[11px] tracking-wide
    font-semibold
    shadow-[0_0_15px_rgba(6,182,212,0.2)]
    transition-all duration-300
  `,
  [EDivision.PRO]: `
    !border !border-[rgba(225,29,72,0.5)]
    !bg-[rgba(225,29,72,0.2)] 
    !text-[#fb7185]
    rounded-lg px-8 py-4
    text-[11px] tracking-wide
    font-semibold
    shadow-[0_0_20px_rgba(225,29,72,0.35)]
    transition-all duration-300
  `
}

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
