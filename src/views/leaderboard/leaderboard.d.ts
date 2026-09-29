// Типи таблиці лідерів виводяться з OpenAPI-схеми (GET /leaderboard).
// Записи в `schema.d.ts` додано вручну за форматом openapi-typescript — `npm run api`
// після деплою бекенду перегенерує їх один в один.
type TLeaderboardResponse = TResponse<'/leaderboard', 'get'>
type TLeaderboardRow = TLeaderboardResponse['players'][number]
type TLeaderboardScoreWeights = TLeaderboardResponse['weights']

/** Ключ сортування таблиці — числове поле рядка, за яким можна впорядкувати. */
type TLeaderboardSortKey =
  | 'score'
  | 'wins'
  | 'winrate'
  | 'maps'
  | 'achievements'
  | 'tournamentPoints'
  | 'rating'
  | 'kills'

/** Пункт селекта сортування. */
type TLeaderboardSortOption = {
  key: TLeaderboardSortKey
  label: string
}
