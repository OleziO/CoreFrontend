import { ElMessageBox } from 'element-plus'
import { useVipStore } from '@/store/modules/vip'

/** Команда видачі: кількість місяців або безстроковий VIP. */
export type TVipGrantCommand = number | 'lifetime'

/**
 * Ручна видача / зняття VIP адміном з підтвердженнями — спільне для вкладки «VIP»
 * в адмінці та профілю гравця. Стор сам патчить гравця у списку.
 */
export function useAdminVipActions () {
  const vipStore = useVipStore()

  function isBusy (playerId: string) {
    return vipStore.adminBusyId === playerId
  }

  async function grant (player: TPlayer, command: TVipGrantCommand) {
    const name = player.discordName ?? 'гравцю'
    if (command === 'lifetime') {
      try {
        await ElMessageBox.confirm(
          `Видати ${name} безстроковий VIP? Він ніколи не спливає, автопродовження вимкнеться.`,
          'Безстроковий VIP',
          { confirmButtonText: 'Видати назавжди', cancelButtonText: 'Скасувати', type: 'warning' }
        )
      } catch {
        return
      }
      await vipStore.grantByAdmin(player.id, { lifetime: true })
      return
    }
    await vipStore.grantByAdmin(player.id, { months: command })
  }

  async function revoke (player: TPlayer) {
    try {
      await ElMessageBox.confirm(
        `Зняти VIP у ${player.discordName ?? 'гравця'}? Статус зникне одразу, автопродовження вимкнеться.`,
        'Зняти VIP',
        { confirmButtonText: 'Зняти', cancelButtonText: 'Скасувати', type: 'warning' }
      )
    } catch {
      return
    }
    await vipStore.revokeByAdmin(player.id)
  }

  return { isBusy, grant, revoke }
}
