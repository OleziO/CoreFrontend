import { ERole } from '@/types/general.enums'
import { hasAdminRole, hasPlayerRole, isPlayerVerified } from '@/core/helpers'

/**
 * Пріоритет групи для сортування реєстру гравців:
 * Адміни → Медіа (стрімери) → Верифіковані → Неверифіковані.
 * Менше значення — вище у списку.
 */
export function getPlayerSortPriority (player: TPlayer): number {
  if (hasAdminRole(player.roles)) return 0
  if (hasPlayerRole(player.roles, ERole.MEDIA)) return 1
  if (isPlayerVerified(player)) return 2
  return 3
}

/** Стабільне сортування за групою; всередині групи зберігається порядок з бекенду. */
export function sortPlayersByRolePriority (players: readonly TPlayer[]): TPlayer[] {
  return players
    .map((player, index) => ({ player, index, priority: getPlayerSortPriority(player) }))
    .sort((a, b) => a.priority - b.priority || a.index - b.index)
    .map(({ player }) => player)
}
