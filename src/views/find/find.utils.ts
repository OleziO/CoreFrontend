import type { Component } from 'vue'
import { PhStrategy, PhUser, PhUsersThree } from '@phosphor-icons/vue'
import type { TRecruitmentBlockReason, TTeamMemberSlot } from '@/api/types/api.types'

/** Ліміти полів — дзеркало бекенду (`recruitment.constants.ts`). */
export const FIND_TEXT_MAX_LENGTH = 200
export const FIND_MMR_MAX = 22000
export const FIND_PLAYERS_NEEDED_MAX = 5
/** Заявок / запрошень на добу без VIP. */
export const FIND_DAILY_LIMIT = 5

/** Чому не можна подати заявку / опублікувати оголошення — підпис для кнопки. */
export const FIND_BLOCK_REASON_LABELS: Record<TRecruitmentBlockReason, string> = {
  not_verified: 'Потрібна верифікація акаунта',
  no_steam: 'Привʼяжіть Steam у профілі',
  has_team: 'Ви вже в команді',
  no_positions: 'Вкажіть позиції у профілі',
  mmr_too_low: 'Ваш MMR нижчий за потрібний',
  mmr_too_high: 'Ваш MMR вищий за потрібний',
  position_mismatch: 'Команда шукає інші позиції'
}

/** Причини, які гравець виправляє сам у профілі — кнопка веде туди. */
export const FIND_PROFILE_FIXABLE_REASONS: readonly TRecruitmentBlockReason[] = ['no_steam', 'no_positions']

export function findBlockReasonText (reasons: readonly TRecruitmentBlockReason[]): string {
  return reasons.map(r => FIND_BLOCK_REASON_LABELS[r]).join(' · ')
}

export interface IFindSlotOption {
  value: TTeamMemberSlot
  label: string
  hint: string
  icon: Component
}

export const FIND_SLOT_OPTIONS: readonly IFindSlotOption[] = [
  { value: 'main', label: 'Основний', hint: 'Стартовий склад', icon: PhUser },
  { value: 'reserved', label: 'Запасний', hint: 'Підміна на матчі', icon: PhUsersThree },
  { value: 'coach', label: 'Тренер', hint: 'Штаб команди', icon: PhStrategy }
]

export function findSlotLabel (slot: TTeamMemberSlot | null | undefined): string {
  return FIND_SLOT_OPTIONS.find(o => o.value === slot)?.label ?? '—'
}

/** Заповненість складу — для блокування слотів у модалках (бекенд перевіряє те саме). */
export interface IFindRosterState {
  mainCount: number
  reservedCount: number
  hasCoach: boolean
  isPlayingTournament: boolean
}

export function findSlotDisabledReasons (roster: IFindRosterState): Partial<Record<TTeamMemberSlot, string>> {
  const reasons: Partial<Record<TTeamMemberSlot, string>> = {}
  if (roster.isPlayingTournament) reasons.main = 'Турнір триває'
  else if (roster.mainCount >= 5) reasons.main = 'Заповнено'
  if (roster.reservedCount >= 3) reasons.reserved = 'Заповнено'
  if (roster.hasCoach) reasons.coach = 'Вже є'
  return reasons
}

/** Перший доступний слот (основа → запас → тренер); `null`, коли місць немає. */
export function findFirstOpenSlot (roster: IFindRosterState): TTeamMemberSlot | null {
  const reasons = findSlotDisabledReasons(roster)
  return FIND_SLOT_OPTIONS.find(o => !reasons[o.value])?.value ?? null
}

const mmrFormat = new Intl.NumberFormat('uk-UA')

/** «3 000 – 5 000», «від 3 000», «до 5 000» або «будь-який». */
export function formatFindMmrRange (min: number | null | undefined, max: number | null | undefined): string {
  if (min != null && max != null) return `${mmrFormat.format(min)} – ${mmrFormat.format(max)}`
  if (min != null) return `від ${mmrFormat.format(min)}`
  if (max != null) return `до ${mmrFormat.format(max)}`
  return 'будь-який'
}

const expiresFormat = new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })

export function formatFindExpiresAt (iso: string | null | undefined): string {
  if (!iso) return ''
  const at = new Date(iso)
  return Number.isNaN(at.getTime()) ? '' : expiresFormat.format(at)
}
