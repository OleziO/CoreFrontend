export enum ERequestStatus {
  NEW = 'new',
  ASSIGNED = 'assigned',
  COMMITED = 'commited',
  MERGED = 'merged',
  CLOSED = 'closed',
}

export const requestStatusLabelMap: Record<string, string> = {
  [ERequestStatus.NEW]: 'Новий',
  [ERequestStatus.ASSIGNED]: 'В роботі', // Или 'Призначено'
  [ERequestStatus.COMMITED]: 'Зафіксовано',
  [ERequestStatus.MERGED]: "Об'єднано",
  [ERequestStatus.CLOSED]: 'Закрито'
}

export const requestStatusClassMap: Record<string, string> = {
  [ERequestStatus.NEW]: 'tag-tone-info tag-dot',
  [ERequestStatus.ASSIGNED]: 'tag-tone-warning tag-dot',
  [ERequestStatus.COMMITED]: 'tag-tone-violet tag-dot',
  [ERequestStatus.MERGED]: 'tag-tone-success tag-dot',
  [ERequestStatus.CLOSED]: 'tag-tone-neutral tag-dot'
}
