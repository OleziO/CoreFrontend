/**
 * Клієнтське дзеркало бекендового `tournament-schedule.util.ts`.
 *
 * Розклад турніру — три незалежні вікна: реєстрація, кваліфікація, плей-оф.
 * Бек лишається джерелом істини (`validateTournamentSchedule` кидає 400), тут
 * лише не даємо адміну зберегти суперечливі дати й показуємо зрозумілу причину.
 *
 * Тримати правила синхронними з беком.
 */

export type TTournamentScheduleForm = {
  registrationStartsAt: string
  registrationEndsAt: string
  qualificationStartsAt: string
  qualificationEndsAt: string
  tournamentStartsAt: string
  tournamentEndsAt: string
}

type TScheduleRule = {
  before: keyof TTournamentScheduleForm
  after: keyof TTournamentScheduleForm
  /** true — межі можуть збігатися (вікна стикаються). */
  allowEqual: boolean
  message: string
}

/**
 * Реєстрація свідомо може перетинатися з кваліфікацією: приєднатися до турніру
 * можна і під час реєстрації, і під час кваліфікації, тож команда реєструється
 * і того ж вечора грає кваліфікаційний матч. Єдине міжвіконне правило —
 * кваліфікація має завершитися до старту сітки, інакше планувальник бекенду
 * запустить плей-оф, поки ще подають результати.
 */
const SCHEDULE_RULES: TScheduleRule[] = [
  {
    before: 'registrationStartsAt',
    after: 'registrationEndsAt',
    allowEqual: false,
    message: 'Кінець реєстрації має бути пізніше за початок реєстрації'
  },
  {
    before: 'qualificationStartsAt',
    after: 'qualificationEndsAt',
    allowEqual: false,
    message: 'Кінець кваліфікації має бути пізніше за початок кваліфікації'
  },
  {
    before: 'tournamentStartsAt',
    after: 'tournamentEndsAt',
    allowEqual: false,
    message: 'Кінець плей-оф має бути пізніше за початок плей-оф'
  },
  {
    before: 'qualificationEndsAt',
    after: 'tournamentStartsAt',
    allowEqual: true,
    message: 'Кваліфікація має завершитися до початку плей-оф'
  }
]

/**
 * Перше порушене правило або null, якщо розклад узгоджений.
 * Незаповнені поля ігноруються — їх ловить перевірка обовʼязковості.
 */
export function getScheduleViolation (
  schedule: Partial<TTournamentScheduleForm>,
  parse: (value: string) => number = (v) => Date.parse(v.replace(' ', 'T'))
): string | null {
  for (const rule of SCHEDULE_RULES) {
    const rawBefore = schedule[rule.before]
    const rawAfter = schedule[rule.after]
    if (!rawBefore || !rawAfter) continue

    const before = parse(rawBefore)
    const after = parse(rawAfter)
    if (!Number.isFinite(before) || !Number.isFinite(after)) continue

    const ok = rule.allowEqual ? before <= after : before < after
    if (!ok) return rule.message
  }
  return null
}
