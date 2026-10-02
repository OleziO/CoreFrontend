import { findService } from '@/views/find/find.service'
import type { TManagedTeam, TRecruitmentMe } from '@/api/types/api.types'

/**
 * Мій стан у пошуку команди: власне оголошення, ліміти на добу та команди, якими я
 * керую (капітан / тренер) з їхнім відкритим оголошенням. Спільний для сторінки `/find`,
 * її модалок, дзвіночка та кнопки «Запросити» в профілі гравця.
 */
export const useFindStore = defineStore('find', () => {
  const authStore = useAuthStore()

  const me = ref<TRecruitmentMe | null>(null)
  const loading = ref(false)
  let inflight: Promise<TRecruitmentMe | null> | null = null

  const isAdmin = computed(() => me.value?.isAdmin ?? false)
  const managedTeams = computed<TManagedTeam[]>(() => me.value?.managedTeams ?? [])
  /** Хто може запрошувати: менеджер хоча б однієї команди або адмін. */
  const canInvite = computed(() => isAdmin.value || managedTeams.value.length > 0)
  /** Хто може публікувати оголошення команди. */
  const canPostForTeam = computed(() => canInvite.value)

  async function loadMe ({ force = false } = {}): Promise<TRecruitmentMe | null> {
    if (!authStore.token) {
      me.value = null
      return null
    }
    if (me.value && !force) return me.value
    if (inflight) return inflight
    loading.value = true
    inflight = findService.fetchMe()
      .then((value) => {
        me.value = value
        return value
      })
      .catch(() => me.value)
      .finally(() => {
        loading.value = false
        inflight = null
      })
    return inflight
  }

  /** Після будь-якої мутації: ліміти й оголошення змінились. */
  function refreshMe (): Promise<TRecruitmentMe | null> {
    return loadMe({ force: true })
  }

  watch(() => authStore.token, () => {
    me.value = null
  })

  return { me, loading, isAdmin, managedTeams, canInvite, canPostForTeam, loadMe, refreshMe }
})
