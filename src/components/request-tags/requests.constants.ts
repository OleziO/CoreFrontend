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
  [ERequestStatus.RECEIVED]: 'tag-tone-info tag-dot',
  [ERequestStatus.IN_PROGRESS]: 'tag-tone-warning tag-dot',
  [ERequestStatus.APPROVED]: 'tag-tone-success tag-dot',
  [ERequestStatus.REJECTED]: 'tag-tone-danger tag-dot'
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
  [ERequestType.MMR]: 'tag-tone-violet',
  [ERequestType.WITHDRAW]: 'tag-tone-success',
  [ERequestType.VERIFY]: 'tag-tone-primary',
  [ERequestType.TEAM_VERIFICATION]: 'tag-tone-primary',
  [ERequestType.PLAYER_VERIFICATION]: 'tag-tone-primary'
}
