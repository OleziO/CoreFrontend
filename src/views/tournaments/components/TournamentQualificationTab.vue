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
        <div v-else-if="registrationEndsIso" class="text-sm text-gray-300 mt-4">
          Межа для подань (кінець реєстрації): {{ formatUk(registrationEndsIso) }}
        </div>
        <div v-if="pastSubmissionWindow" class="text-amber-400 text-sm mt-6">
          Термін подачі результату завершено — сервер може відхилити нові матчі (після кінця вікна кваліфікації).
        </div>
      </div>
      <div v-if="registrationEndsIso" class="flex flex-col items-start md:items-end gap-6">
        <span class="text-xs text-gray-500 uppercase font-bold tracking-wider">Залишилось до кінця реєстрації</span>
        <span class="font-mono text-lg text-cyan-300">{{ countdownLabel }}</span>
      </div>
    </div>

    <div
      v-if="matches.length === 0"
      class="py-28 flex justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02]"
    >
      <p class="text-gray-400 text-center max-w-lg px-15 leading-relaxed">
        Список кваліфікаційних матчів поки порожній. Потрібно, щоб бекенд повертав зв’язок
        qualification (з полем matches) у відповіді GET /tournaments/:id або реалізував GET /tournaments/:id/qualification.
      </p>
    </div>

    <div v-else class="rounded-xl overflow-hidden border border-white/10">
      <el-table :data="matches" row-key="id" class="qual-table bg-[#131a2a]" empty-text="Немає матчів">
        <el-table-column label="Команда A" min-width="160">
          <template #default="{ row }">
            <span class="text-white font-semibold">{{ row.teamA.name }}</span>
          </template>
        </el-table-column>
        <el-table-column width="48" align="center">
          <span class="text-gray-600">vs</span>
        </el-table-column>
        <el-table-column label="Команда B" min-width="160">
          <template #default="{ row }">
            <span class="text-white font-semibold">{{ row.teamB.name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Статус" min-width="200">
          <template #default="{ row }">
            <template v-if="row.winner?.name">
              <span class="text-green-400">Переможець: {{ row.winner.name }}</span>
              <span v-if="row.dotaMatchId" class="block text-xs text-gray-500 mt-2">Матч ID {{ row.dotaMatchId }}</span>
            </template>
            <template v-else-if="row.dotaMatchId">
              <span class="text-green-400">Матч ID {{ row.dotaMatchId }}</span>
            </template>
            <template v-else>
              <span class="text-gray-500">Очікується результат</span>
            </template>
          </template>
        </el-table-column>
        <el-table-column align="right" width="200">
          <template #default="{ row }">
            <el-button
              v-if="showSubmitForRow(row)"
              type="primary"
              size="small"
              class="!rounded-lg"
              :disabled="pastSubmissionWindow"
              @click="openModal(row)"
            >
              Подати результат
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <QualificationSubmitModal
      v-model="modalOpen"
      :tournament-id="tournamentId"
      :match="selectedMatch"
      :past-registration-end="pastSubmissionWindow"
      @submitted="onSubmitted"
    />
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import 'dayjs/locale/uk'
import { useIntervalFn } from '@vueuse/core'
import QualificationSubmitModal from '../modals/QualificationSubmitModal.vue'
import type {
  TTournament as Tournament,
  TQualificationMatch as QualificationMatch,
  TQualificationPhase as QualificationPhase
} from '@/api/types/api.types'
import { PROFILE_CAPTAIN_ROLE_UA } from '@/components/tournaments-tags/tournament.constants'

dayjs.locale('uk')

const props = defineProps<{
  tournamentId: string
  tournament: Tournament | null
}>()

const emit = defineEmits<{
  (e: 'patch-tournament', value: Tournament): void
}>()

const authStore = useAuthStore()

const qualificationPhase = shallowRef<QualificationPhase | null>(null)

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
  void hydrateQualification()
})

/**
 * Не deep-watch на весь `qualification` — після patch-tournament змінюється посилання
 * і Vue знову викликає hydrate безкінечно. Достатньо id турніру + довжини списку матчів.
 */
watch(
  () => [props.tournamentId, props.tournament?.qualification?.matches?.length ?? -1] as const,
  () => {
    void hydrateQualification()
  }
)

const matches = computed(() => qualificationPhase.value?.matches ?? [])

const registrationEndsIso = computed(() => props.tournament?.registrationEndsAt ?? '')

/** Клієнтська перевірка: після цього UTC бекенд відхиляє подані матчі події (згідно з ТЗ — registrationEndsAt). */
const pastSubmissionWindow = computed(() => {
  const end = registrationEndsIso.value
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
  const end = registrationEndsIso.value
  if (!end) {
    countdownLabel.value = '—'
    return
  }
  const diff = dayjs(end).diff(dayjs(), 'second')
  if (diff <= 0) {
    countdownLabel.value = '00:00:00'
    return
  }
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  const s = diff % 60
  countdownLabel.value = `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

updateCountdown()
useIntervalFn(updateCountdown, 1000)

const hasCaptainRole = computed(() =>
  !!(authStore.user?.roles ?? []).some((r) => r.name === PROFILE_CAPTAIN_ROLE_UA)
)

function captainOfTeam (teamId: string) {
  const full = props.tournament?.teams?.find((t) => t.id === teamId)
  const capId = full?.captain?.id
  return !!(capId && authStore.user?.id && capId === authStore.user.id)
}

function canSubmitMatch (row: QualificationMatch) {
  if (!authStore.token) return false
  if (row.dotaMatchId) return false
  if (row.winner) return false
  if (!hasCaptainRole.value) return false
  return captainOfTeam(row.teamA.id) || captainOfTeam(row.teamB.id)
}

function showSubmitForRow (row: QualificationMatch) {
  return canSubmitMatch(row)
}

const modalOpen = ref(false)
const selectedMatch = ref<QualificationMatch | null>(null)

function openModal (row: QualificationMatch) {
  selectedMatch.value = row
  modalOpen.value = true
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

<style scoped>
:deep(.qual-table.el-table) {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: rgba(255, 255, 255, 0.04);
  --el-table-row-hover-bg-color: rgba(255, 255, 255, 0.04);
}
</style>
