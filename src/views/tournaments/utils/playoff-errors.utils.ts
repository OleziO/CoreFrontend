import { getApiErrorMessage } from '@/core/utils/api-errors'

/** HTTP-статус з помилки axios, якщо є. */
function errorStatus (e: unknown): number | undefined {
  return typeof e === 'object' && e !== null && 'response' in e
    ? (e as { response?: { status?: number } }).response?.status
    : undefined
}

/** Переклад відомих текстів помилок бекенда плей-оф у дружні підказки. */
function friendlyPlayoffMessage (msg: string): string {
  const hints: Record<string, string> = {
    'Match already submitted': 'Результат цього матчу вже подано.',
    'Playoff already started': 'Плей-оф уже стартовано.',
    'Playoff not started': 'Плей-оф ще не стартовано.',
    'Team already disqualified': 'Команду вже дискваліфіковано.',
    'Team not found in playoff': 'Команду не знайдено серед учасників плей-оф.',
    'Teams not found as active participants':
      'Команди з матчу не є активними учасниками плей-оф.'
  }
  return hints[msg.trim()] ?? msg.trim()
}

export function friendlyPlayoffError (e: unknown, fallback: string): string {
  const status = errorStatus(e)
  const raw = getApiErrorMessage(e, fallback)

  if (status === 503) {
    return 'Дані матчу ще не доступні в OpenDota. Спробуйте за кілька хвилин.'
  }
  if (status === 409) {
    return 'Плей-оф уже стартовано.'
  }

  const mapped = friendlyPlayoffMessage(raw)
  if (mapped !== raw) return mapped

  if (status === 404) {
    return raw && raw !== fallback ? mapped : 'Турнір, плей-оф або команду не знайдено.'
  }
  if (status === 400) {
    return raw && raw !== fallback
      ? mapped
      : 'Некоректні дані: можливо, матч уже подано або команди недопущені.'
  }
  return mapped || fallback
}
