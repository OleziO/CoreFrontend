import { derivePlayoffPodium } from '@/views/tournaments/utils/playoff-podium.utils'
import { getTournamentPhase } from '@/views/tournaments/tournaments.utils'

/**
 * Призери турніру для п'єдесталу на сторінці турніру.
 * Бекенд не має публічної підсумкової таблиці, тож місця виводимо з серій сітки.
 * Ендпоінт серій вимагає авторизації — для гостей п'єдестал не показуємо
 * (401 у перехоплювачі axios скинув би токен і викинув на головну).
 */
export function useTournamentPodium (tournament: Ref<TTournament | null>) {
  const authStore = useAuthStore()
  const podium = ref<TTournamentPodiumEntry[]>([])
  const loading = ref(false)
  let requestSeq = 0

  /** Плей-оф триває або зіграно: фінал міг вирішитись раніше, ніж статус став COMPLETED. */
  const isPlayoffStage = computed(() => {
    const t = tournament.value
    if (!t) return false
    return t.tournamentStatus === 'PLAYOFF' || getTournamentPhase(t) === 'past'
  })

  async function refresh () {
    const t = tournament.value
    if (!t || !authStore.token || !isPlayoffStage.value) {
      podium.value = []
      return
    }
    const seq = ++requestSeq
    loading.value = true
    try {
      const series = await tournamentsService.fetchPlayoffOpenMatches(t.id)
      if (seq !== requestSeq) return
      podium.value = derivePlayoffPodium(series, {
        bracketType: t.bracketType,
        hasThirdPlaceMatch: t.hasThirdPlaceMatch
      })
    } catch {
      // 404 — плей-оф ще не стартував; будь-яка інша помилка — просто без п'єдесталу.
      if (seq === requestSeq) podium.value = []
    } finally {
      if (seq === requestSeq) loading.value = false
    }
  }

  watch(
    () => [tournament.value?.id, authStore.token, isPlayoffStage.value] as const,
    () => { refresh() },
    { immediate: true }
  )

  return { podium, loading, refresh }
}
