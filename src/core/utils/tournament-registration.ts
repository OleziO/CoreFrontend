/**
 * Клієнтське дзеркало бекендового `tournament-registration.util.ts`.
 * Тримати логіку синхронною з беком: бек — джерело істини, тут лише приховуємо
 * кнопки, щоб капітан не бив у 400.
 */

export type TRegistrationBlockReason = 'NOT_OPEN_YET' | 'DEADLINE_PASSED' | 'CLOSED_BY_ADMIN'

type TRegistrationWindow = Pick<
TTournament,
'registrationStartsAt' | 'registrationEndsAt'
> & { registrationClosedAt?: string | null }

/**
 * Причина, чому реєстрація зачинена, або null — якщо відкрита.
 * Ручне закриття адміном має приоритет над датами, як і на бекенді.
 *
 * `nowMs` передається зовні (через `useNow`), щоб computed перерахувався,
 * коли дедлайн минає під час перебування на сторінці.
 */
export function getRegistrationBlockReason (
  tournament: TRegistrationWindow | null | undefined,
  nowMs: number = Date.now()
): TRegistrationBlockReason | null {
  if (!tournament) return null

  if (tournament.registrationClosedAt) return 'CLOSED_BY_ADMIN'

  const startsAt = Date.parse(tournament.registrationStartsAt as unknown as string)
  const endsAt = Date.parse(tournament.registrationEndsAt as unknown as string)

  // Некоректну/відсутню дату не трактуємо як закриття — вирішує бекенд.
  if (Number.isFinite(startsAt) && nowMs < startsAt) return 'NOT_OPEN_YET'
  if (Number.isFinite(endsAt) && nowMs > endsAt) return 'DEADLINE_PASSED'

  return null
}

/** Текст для банера замість кнопки приєднання. */
export const registrationBlockBannerMap: Record<TRegistrationBlockReason, string> = {
  NOT_OPEN_YET: 'Реєстрація ще не відкрита',
  DEADLINE_PASSED: 'Реєстрацію на турнір закрито',
  CLOSED_BY_ADMIN: 'Реєстрацію на турнір закрито'
}
