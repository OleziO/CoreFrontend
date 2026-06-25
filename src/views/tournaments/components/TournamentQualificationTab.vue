<template>
  <div class="mt-16 flex flex-col gap-16">
    <div
      class="rounded-xl border border-white/10 bg-white/[0.03] p-15 md:p-20 flex flex-col md:flex-row
      md:items-center md:justify-between gap-16"
    >
      <div>
        <div class="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Кваліфікаційний етап
        </div>
        <div v-if="phaseWindowText" class="text-sm text-gray-300 mt-4">
          {{ phaseWindowText }}
        </div>
        <div v-else-if="qualificationSubmissionDeadlineIso" class="text-sm text-gray-300 mt-4">
          Межа для подань (кінець кваліфікації): {{ formatUk(qualificationSubmissionDeadlineIso) }}
        </div>
        <div v-if="pastSubmissionWindow" class="text-amber-400 text-sm mt-6">
          Термін подачі результату завершено — сервер може відхилити нові матчі (після кінця вікна кваліфікації).
        </div>
      </div>
      <div v-if="qualificationSubmissionDeadlineIso" class="flex flex-col items-start md:items-end gap-6">
        <span class="text-xs text-gray-500 uppercase font-bold tracking-wider">Залишилось до кінця кваліфікації</span>
        <span class="font-mono text-lg text-cyan-300">{{ countdownLabel }}</span>
      </div>
    </div>

    <QualificationMatchesList
      :matches="sortedDisplayMatches"
      :tournament-teams="tournamentTeams"
      :player-points="qualificationPhase?.playerTournamentPoints ?? null"
      :loading="qualificationHydrateInFlight"
      :show-add-result-button="showAddResultButton"
      :show-test-match-button="isLocalhost"
      :show-tech-loss-button="isAdmin"
      @add-result="openAddModal"
      @test-match="openTestMatchModal"
      @tech-loss="openTechLossModal"
    />

    <QualificationAddResultModal
      v-model="modalOpen"
      :tournament-id="tournamentId"
      :past-qualifications-end="pastSubmissionWindow"
      @submitted="onSubmitted"
    />
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import 'dayjs/locale/uk'
import { useIntervalFn } from '@vueuse/core'
import QualificationMatchesList from './qualification/QualificationMatchesList.vue'
import QualificationAddResultModal from '../modals/QualificationAddResultModal.vue'
import type {
  TQualificationMatch as QualificationMatch,
  TQualificationPhase as QualificationPhase
} from '@/api/types/api.types'
dayjs.locale('uk')

const props = defineProps<{
  tournamentId: string
  tournament: TTournament | null
}>()

const emit = defineEmits<{
  (e: 'patch-tournament', value: TTournament): void
}>()

const authStore = useAuthStore()
const { open: openAppModal } = useAppModals()

const qualificationPhase = shallowRef<QualificationPhase | null>(null)

// tournament.teams comes from the embedded Tournament schema (Team[]), not the /teams list (TTeam[]).
// Cast bridging the schema mismatch — structurally compatible at runtime.
const tournamentTeams = computed(() => (props.tournament?.teams ?? null) as TTeam[] | null)

/** Захист від паралельних GET та від циклу watch → patch → watch. */
const qualificationHydrateInFlight = ref(false)

async function hydrateQualification () {
  if (qualificationHydrateInFlight.value) return
  const fromDetail = props.tournament?.qualification
  if (fromDetail?.matches?.length) {
    qualificationPhase.value = fromDetail
    return
  }

  qualificationHydrateInFlight.value = true
  const requestTournamentId = props.tournamentId
  try {
    const fetched = await tournamentsService.fetchQualification(requestTournamentId)
    if (props.tournamentId !== requestTournamentId) return
    qualificationPhase.value = fetched
    /**
     * Підмішуємо в батька лише коли є матчі — інакше patch створює новий об'єкт qualification
     * з порожнім matches, deep-watch знову викликає hydrate → безкінечні GET.
     */
    const hasMatches = (fetched?.matches?.length ?? 0) > 0
    const parentHasNoMatches = !(props.tournament?.qualification?.matches?.length ?? 0)
    if (fetched && props.tournament && parentHasNoMatches && hasMatches) {
      emit('patch-tournament', { ...props.tournament, qualification: fetched })
    }
  } catch {
    qualificationPhase.value = null
  } finally {
    qualificationHydrateInFlight.value = false
  }
}

onMounted(() => {
  hydrateQualification()
})

/**
 * Не deep-watch на весь `qualification` — після patch-tournament змінюється посилання
 * і Vue знову викликає hydrate безкінечно. Достатньо id турніру + довжини списку матчів.
 */
watch(
  () => [props.tournamentId, props.tournament?.qualification?.matches?.length ?? -1] as const,
  () => {
    hydrateQualification()
  }
)

const matches = computed(() => qualificationPhase.value?.matches ?? [])

/** Спочатку матчі з результатом, далі — що ще чекають подачу. */
const sortedDisplayMatches = computed(() => {
  const list = [...matches.value]
  list.sort((a, b) => {
    const aDone = !!(a.dotaMatchId || a.winner)
    const bDone = !!(b.dotaMatchId || b.winner)
    if (aDone !== bDone) return aDone ? -1 : 1
    return 0
  })
  return list
})

/** UTC кінець вікна кваліфікаційних подань (`registrationEndsAt` у відповіді API). */
const qualificationSubmissionDeadlineIso = computed(() => props.tournament?.registrationEndsAt ?? '')

/** Клієнтська перевірка: після цього UTC бекенд відхиляє подані матчі події (згідно з ТЗ — registrationEndsAt). */
const pastSubmissionWindow = computed(() => {
  const end = qualificationSubmissionDeadlineIso.value
  if (!end) return false
  return dayjs().isAfter(dayjs(end))
})

const phaseWindowText = computed(() => {
  const q = qualificationPhase.value
  if (!q?.startTime && !q?.endTime) return ''
  if (q.startTime && q.endTime) {
    return `${formatUk(q.startTime)} — ${formatUk(q.endTime)}`
  }
  if (q.endTime) return `Етап до ${formatUk(q.endTime)}`
  return ''
})

function formatUk (iso: string) {
  return dayjs(iso).format('DD MMM YYYY, HH:mm')
}

const countdownLabel = ref('—')

function updateCountdown () {
  const end = qualificationSubmissionDeadlineIso.value
  if (!end) {
    countdownLabel.value = '—'
    return
  }
  const diff = dayjs(end).diff(dayjs(), 'second')
  if (diff <= 0) {
    countdownLabel.value = '0 г 0 хв 0 с'
    return
  }
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  const s = diff % 60
  const mLabel = `${String(m).padStart(2, '0')} хв`
  const sLabel = `${String(s).padStart(2, '0')} с`
  if (h >= 24) {
    const days = Math.floor(h / 24)
    const remH = h % 24
    countdownLabel.value = `${days} дн ${remH} г ${mLabel} ${sLabel}`
  } else {
    countdownLabel.value = `${h} г ${mLabel} ${sLabel}`
  }
}

updateCountdown()
useIntervalFn(updateCountdown, 1000)

/** Кнопка «Додати результат» для авторизованого користувача, поки триває строк кваліфікації. */
const showAddResultButton = computed(
  () => !!authStore.token && !pastSubmissionWindow.value
)

const isAdmin = computed(() => authStore.isAdmin?.isAdmin || authStore.isAdmin?.isModerator)

const modalOpen = ref(false)

function openAddModal () {
  modalOpen.value = true
}

function openTechLossModal () {
  openAppModal('TechLossQualificationModal', {
    matches: matches.value,
    onSubmitted: (matchId: string, winnerId: string) => {
      const q = qualificationPhase.value
      if (!q) return
      const list = [...(q.matches ?? [])]
      const i = list.findIndex((m) => m.id === matchId)
      if (i >= 0) {
        const m = list[i]
        const fullWinner = m.teamA?.id === winnerId ? m.teamA : m.teamB
        list[i] = { ...m, winner: fullWinner, dotaMatchId: `tech_loss_${matchId}` }
      }
      qualificationPhase.value = { ...q, matches: list }
      const t = props.tournament
      if (t) emit('patch-tournament', { ...t, qualification: { ...q, matches: list } })
    }
  })
}

const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost'

function openTestMatchModal () {
  openAppModal('TestMatchCreationModal', {
    tournamentId: props.tournamentId,
    phase: 'qualification',
    teams: props.tournament?.teams ?? []
  })
}

function onSubmitted (updated: QualificationMatch) {
  const q = qualificationPhase.value
  if (!q) return
  const list = [...(q.matches ?? [])]
  const i = list.findIndex((m) => m.id === updated.id)
  if (i >= 0) list[i] = updated
  const nextPhase: QualificationPhase = { ...q, matches: list }
  qualificationPhase.value = nextPhase
  const t = props.tournament
  if (t) emit('patch-tournament', { ...t, qualification: nextPhase })
}
</script>
