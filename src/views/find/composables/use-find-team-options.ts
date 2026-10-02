import { useFindStore } from '@/views/find/find.store'
import { useTeamsStore } from '@/views/teams/teams.store'
import type { IFindRosterState } from '@/views/find/find.utils'

export interface IFindTeamOption {
  id: string
  name: string
  roster: IFindRosterState
}

/**
 * Команди, від імені яких можна діяти (оголошення, запрошення): мої (капітан / тренер),
 * а для адміна — усі активні команди. Мої завжди першими.
 */
export function useFindTeamOptions () {
  const findStore = useFindStore()
  const teamsStore = useTeamsStore()
  const loading = ref(false)

  const options = computed<IFindTeamOption[]>(() => {
    const mine: IFindTeamOption[] = findStore.managedTeams.map(({ team }) => ({
      id: team.id,
      name: team.name,
      roster: {
        mainCount: team.mainCount,
        reservedCount: team.reservedCount,
        hasCoach: !!team.coachId,
        isPlayingTournament: team.isPlayingTournament
      }
    }))
    if (!findStore.isAdmin) return mine

    const mineIds = new Set(mine.map(t => t.id))
    const others = teamsStore.teams
      .filter(t => !t.disbandedAt && !mineIds.has(t.id))
      .map(t => ({
        id: t.id,
        name: t.name,
        roster: {
          mainCount: t.mainPlayers?.length ?? 0,
          reservedCount: t.reservedPlayers?.length ?? 0,
          hasCoach: !!t.coach,
          isPlayingTournament: t.isPlayingTournament
        }
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'uk'))
    return [...mine, ...others]
  })

  async function load (): Promise<void> {
    loading.value = true
    try {
      await findStore.loadMe()
      if (findStore.isAdmin) await teamsStore.getTeams()
    } finally {
      loading.value = false
    }
  }

  return { options, loading, load }
}
