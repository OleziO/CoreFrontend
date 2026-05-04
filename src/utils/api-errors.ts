/** Повідомлення з типової помилки NestJS: `{ statusCode, message, error }` */
export function getApiErrorMessage (e: unknown, fallback: string): string {
  const data =
    typeof e === 'object' && e !== null && 'response' in e
      ? (e as { response?: { data?: unknown } }).response?.data
      : undefined
  if (data && typeof data === 'object' && data !== null && 'message' in data) {
    const m = (data as { message: unknown }).message
    if (typeof m === 'string' && m.trim() !== '') return m
    if (Array.isArray(m) && m.length) return m.map(String).filter(Boolean).join(', ')
  }
  if (typeof e === 'object' && e !== null && 'message' in e) {
    const m = (e as { message: unknown }).message
    if (typeof m === 'string' && m.trim() !== '') return m
  }
  return fallback
}
