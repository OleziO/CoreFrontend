import { ERole } from '@/types/general.enums'
import { hasDisplayAdminRole, hasPlayerRole, isPlayerVerified, isPlayerVip } from '@/core/helpers'

/**
 * Пріоритет групи для сортування реєстру гравців:
 * Адміни → Медіа (стрімери) → VIP → Верифіковані → Неверифіковані.
 * Медіа з адмін-правами належить до групи «Медіа» (медіа-роль пріоритетніша).
 * «ІТ» (адмін-права без адмін-відображення) сортується за рештою ознак.
 * Менше значення — вище у списку.
 */
export function getPlayerSortPriority (player: TPlayer): number {
  if (hasPlayerRole(player.roles, ERole.MEDIA)) return 1
  if (hasDisplayAdminRole(player.roles)) return 0
  if (isPlayerVip(player)) return 2
  if (isPlayerVerified(player)) return 3
  return 4
}

/**
 * Стабільне сортування за групою; всередині групи VIP іде першим
 * (VIP-адмін вище за адміна без VIP, так само з медіа), далі — порядок з бекенду.
 */
export function sortPlayersByRolePriority (players: readonly TPlayer[]): TPlayer[] {
  return players
    .map((player, index) => ({
      player,
      index,
      priority: getPlayerSortPriority(player),
      vipRank: isPlayerVip(player) ? 0 : 1
    }))
    .sort((a, b) => a.priority - b.priority || a.vipRank - b.vipRank || a.index - b.index)
    .map(({ player }) => player)
}
