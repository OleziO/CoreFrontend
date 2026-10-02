import { findService } from '@/views/find/find.service'
import { useFindStore } from '@/views/find/find.store'
import { useTeamsStore } from '@/views/teams/teams.store'
import type { TJoinRequest, TTeamMemberSlot } from '@/api/types/api.types'

/**
 * Відповіді на заявки / запрошення — і з дзвіночка, і з модалки «Переглянути».
 * Після прийняття склад команди змінився: оновлюємо її кеш, а коли приєднався я сам
 * (прийняв запрошення) — ще й `/auth/me`, щоб `teamId` у профілі став актуальним.
 */
export function useFindRequestActions () {
  const authStore = useAuthStore()
  const findStore = useFindStore()
  const teamsStore = useTeamsStore()

  async function sync (request: TJoinRequest): Promise<void> {
    findStore.refreshMe()
    if (request.status !== 'ACCEPTED') return
    teamsStore.refreshTeam(request.team.id).catch(() => { /* кеш оновиться при наступному заході */ })
    if (request.player.id === authStore.user?.id) await authStore.fetchUser()
  }

  async function accept (id: string, slot?: TTeamMemberSlot): Promise<TJoinRequest> {
    const request = await findService.acceptRequest(id, slot)
    await sync(request)
    return request
  }

  async function decline (id: string): Promise<TJoinRequest> {
    const request = await findService.declineRequest(id)
    await sync(request)
    return request
  }

  async function withdraw (id: string): Promise<TJoinRequest> {
    const request = await findService.withdrawRequest(id)
    await sync(request)
    return request
  }

  return { accept, decline, withdraw }
}
