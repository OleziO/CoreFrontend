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
  [ETeamStatus.APPROVED]: 'tag-tone-success tag-dot',
  [ETeamStatus.APPLIED]: 'tag-tone-warning tag-dot'
}
