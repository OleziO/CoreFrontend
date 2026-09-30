// Типи друзів виводяться з OpenAPI-схеми (GET /friends). Записи в `schema.d.ts` додано
// вручну за форматом openapi-typescript — `npm run api` після деплою бекенду перегенерує їх.
type TFriendsOverviewResponse = TResponse<'/friends', 'get'>

/** Як я пов'язаний із гравцем — виводиться зі стору друзів без окремого запиту. */
type TFriendRelationState = {
  relation: import('@/api/types/api.types').TFriendRelationKind
  /** id запиту в друзі, коли він відкритий (вхідний чи надісланий); інакше null. */
  requestId: string | null
}
