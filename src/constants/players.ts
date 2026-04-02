import { ERole } from '@/types/general.types'

export const playersRolesArr = [
  { label: 'Гравець', value: ERole.PLAYER },
  { label: 'Не верифікований', value: ERole.GUEST },
  { label: 'Капітан', value: ERole.CAP },
  { label: 'Заблокований', value: ERole.BLOCKED },
  { label: 'Модератор', value: ERole.MODERATOR },
  { label: 'Медіа', value: ERole.MEDIA },
  { label: 'Адмін', value: ERole.ADMIN }
] as const
