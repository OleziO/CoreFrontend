<template>
  <el-dialog
    v-model="modelValue"
    title="Технічна поразка — плей-оф"
    width="560px"
    class="tech-loss-playoff-dialog custom-dialog"
    destroy-on-close
    @open="onOpen"
  >
    <div v-if="fetchingMatches" class="py-20 flex justify-center">
      <el-icon class="animate-spin text-gray-400" :size="28"><Loading /></el-icon>
    </div>

    <template v-else>
      <p class="text-xs text-gray-500 leading-snug mb-16 m-0">
        Оберіть матч і вкажіть переможця. Сітку буде оновлено автоматично.
      </p>

      <!-- Match select -->
      <div class="mb-20">
        <div class="text-xs text-gray-400 mb-6 uppercase tracking-wide">Матч</div>
        <div v-if="openMatches.length === 0" class="text-sm text-amber-400 py-8">
          Немає матчів у поточній сітці.
        </div>
        <el-select
          v-else
          v-model="selectedMatchKey"
          placeholder="Оберіть матч"
          class="w-full"
          filterable
          :disabled="loading"
          @change="winnerTeamId = ''"
        >
          <el-option
            v-for="m in openMatches"
            :key="matchKey(m)"
            :label="matchLabel(m)"
            :value="matchKey(m)"
          />
        </el-select>
      </div>

      <!-- Team cards -->
      <Transition name="fade-slide">
        <div v-if="selectedMatch" class="flex flex-col gap-10">
          <div class="text-xs text-gray-400 uppercase tracking-wide">Переможець</div>

          <div v-if="!selectedMatch.teamA || !selectedMatch.teamB" class="text-sm text-gray-500 py-8">
            Дані матчу недоступні.
          </div>
          <div v-else class="flex gap-12 mt-4">
            <MatchTeamSelectCard
              :team="selectedMatch.teamA"
              :state="cardState(selectedMatch.teamA.id)"
              @click="toggleWinner(selectedMatch.teamA.id)"
            />
            <MatchTeamSelectCard
              :team="selectedMatch.teamB"
              :state="cardState(selectedMatch.teamB.id)"
              @click="toggleWinner(selectedMatch.teamB.id)"
            />
          </div>
        </div>
      </Transition>
    </template>

    <template #footer>
      <div class="flex justify-end gap-10">
        <el-button :disabled="loading" class="!bg-transparent !border-white/10 !text-gray-300" @click="close">
          Скасувати
        </el-button>
        <el-button
          type="danger"
          :loading="loading"
          :disabled="!canSubmit"
          @click="submit"
        >
          Зарахувати поразку
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { Loading } from '@element-plus/icons-vue'
import type { TOpenPlayoffMatch } from '@/api/types/api.types'
import MatchTeamSelectCard from '@/components/MatchTeamSelectCard.vue'

const props = defineProps<{
  tournamentId: string
  onSubmitted?: (response: TPlayoff) => void
}>()

const modelValue = defineModel<boolean>({ default: false })

const openMatches = ref<TOpenPlayoffMatch[]>([])
const fetchingMatches = ref(false)
const selectedMatchKey = ref<string>('')
const winnerTeamId = ref<string>('')
const loading = ref(false)

const selectedMatch = computed(() =>
  openMatches.value.find((m) => matchKey(m) === selectedMatchKey.value) ?? null
)

const canSubmit = computed(() =>
  !!selectedMatchKey.value && !!winnerTeamId.value && !fetchingMatches.value
)

function matchKey (m: TOpenPlayoffMatch): string {
  return String(m.challongeMatchId)
}

function matchLabel (m: TOpenPlayoffMatch): string {
  const stateLabel = m.state === 'complete' ? ' [завершено]' : ''
  return `${m.teamA.name} vs ${m.teamB.name} — раунд ${m.round}${stateLabel}`
}

function cardState (teamId: string): 'neutral' | 'winner' | 'loser' {
  if (!winnerTeamId.value) return 'neutral'
  return winnerTeamId.value === teamId ? 'winner' : 'loser'
}

function toggleWinner (teamId: string) {
  winnerTeamId.value = winnerTeamId.value === teamId ? '' : teamId
}

async function onOpen () {
  selectedMatchKey.value = ''
  winnerTeamId.value = ''
  loading.value = false
  fetchingMatches.value = true
  try {
    openMatches.value = await tournamentsService.fetchPlayoffOpenMatches(props.tournamentId)
  } catch {
    ElMessage.error('Не вдалося завантажити матчі сітки')
    openMatches.value = []
  } finally {
    fetchingMatches.value = false
  }
}

function close () {
  modelValue.value = false
}

async function submit () {
  const match = selectedMatch.value
  if (!match || !winnerTeamId.value) return

  const loserTeamId = winnerTeamId.value === match.teamA.id ? match.teamB.id : match.teamA.id

  loading.value = true
  try {
    const res = await tournamentsService.adminTechLossPlayoffMatch(
      props.tournamentId,
      winnerTeamId.value,
      loserTeamId
    )
    ElMessage.success('Технічну поразку зараховано, сітку оновлено')
    props.onSubmitted?.(res)
    close()
  } catch (e: unknown) {
    const msg =
      typeof e === 'object' && e !== null && 'response' in e
        ? ((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? '')
        : ''
    ElMessage.error(msg || 'Не вдалося зарахувати технічну поразку')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
:deep(.tech-loss-playoff-dialog.custom-dialog) {
  background-color: #1e2330;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}
:deep(.tech-loss-playoff-dialog .el-dialog__title) {
  color: #fff;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
