export enum ERequestStatus {
  RECEIVED = 'received',
  IN_PROGRESS = 'in-progress',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum ERequestType {
  MMR = 'mmr',
  WITHDRAW = 'withdraw',
  VERIFY = 'verify',
  TEAM_VERIFICATION = 'team_verification',
  PLAYER_VERIFICATION = 'player_verification',
}

// === STATUS CONFIG ===

export const requestStatusLabelMap: Record<ERequestStatus, string> = {
  [ERequestStatus.RECEIVED]: 'Новий',
  [ERequestStatus.IN_PROGRESS]: 'В обробці',
  [ERequestStatus.APPROVED]: 'Схвалено',
  [ERequestStatus.REJECTED]: 'Відхилено'
}

export const requestStatusClassMap: Record<ERequestStatus, string> = {
  [ERequestStatus.RECEIVED]: `
    !border !border-blue-500/40 !bg-blue-500/10 !text-blue-400
    rounded-lg px-8 py-4 text-[11px] font-semibold uppercase tracking-wide
  `,
  [ERequestStatus.IN_PROGRESS]: `
    !border !border-yellow-500/40 !bg-yellow-500/10 !text-yellow-400
    rounded-lg px-8 py-4 text-[11px] font-semibold uppercase tracking-wide
    animate-pulse
  `,
  [ERequestStatus.APPROVED]: `
    !border !border-green-500/40 !bg-green-500/10 !text-green-400
    rounded-lg px-8 py-4 text-[11px] font-semibold uppercase tracking-wide
    shadow-[0_0_12px_rgba(34,197,94,0.2)]
  `,
  [ERequestStatus.REJECTED]: `
    !border !border-red-500/40 !bg-red-500/10 !text-red-400
    rounded-lg px-8 py-4 text-[11px] font-semibold uppercase tracking-wide
  `
}

// === TYPE CONFIG ===

export const requestTypeLabelMap: Record<string, string> = {
  [ERequestType.MMR]: 'Оновлення MMR',
  [ERequestType.WITHDRAW]: 'Вивід коштів',
  [ERequestType.VERIFY]: 'Верифікація',
  [ERequestType.TEAM_VERIFICATION]: 'Верифікація команди',
  [ERequestType.PLAYER_VERIFICATION]: 'Верифікація гравця'
}

export const requestTypeClassMap: Record<string, string> = {
  [ERequestType.MMR]: `
    !border !border-purple-500/40 !bg-purple-500/10 !text-purple-400
    rounded-lg px-8 py-4 text-[11px] font-semibold uppercase tracking-wide
    shadow-[0_0_12px_rgba(168,85,247,0.2)]
  `,
  [ERequestType.WITHDRAW]: `
    !border !border-emerald-500/40 !bg-emerald-500/10 !text-emerald-400
    rounded-lg px-8 py-4 text-[11px] font-semibold uppercase tracking-wide
    shadow-[0_0_12px_rgba(16,185,129,0.2)]
  `,
  [ERequestType.VERIFY]: `
    !border !border-cyan-500/40 !bg-cyan-500/10 !text-cyan-400
    rounded-lg px-8 py-4 text-[11px] font-semibold uppercase tracking-wide
  `,
  [ERequestType.TEAM_VERIFICATION]: `
    !border !border-cyan-500/40 !bg-cyan-500/10 !text-cyan-400
    rounded-lg px-8 py-4 text-[11px] font-semibold uppercase tracking-wide
  `,
  [ERequestType.PLAYER_VERIFICATION]: `
    !border !border-cyan-500/40 !bg-cyan-500/10 !text-cyan-400
    rounded-lg px-8 py-4 text-[11px] font-semibold uppercase tracking-wide
  `
}
