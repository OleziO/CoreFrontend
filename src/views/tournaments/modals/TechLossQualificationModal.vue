<template>
  <el-dialog
    v-model="modelValue"
    title="Технічна поразка — кваліфікація"
    width="560px"
    class="tech-loss-qual-dialog custom-dialog"
    destroy-on-close
    @open="resetForm"
  >
    <p class="text-xs text-gray-500 leading-snug mb-16 m-0">
      Оберіть матч і команду-переможця. Записується без ID матчу Dota 2.
    </p>

    <!-- Match select -->
    <div class="mb-20">
      <div class="text-xs text-gray-400 mb-6 uppercase tracking-wide">Матч</div>
      <div v-if="props.matches.length === 0" class="text-sm text-amber-400 py-8">
        Немає відкритих матчів.
      </div>
      <el-select
        v-else
        v-model="selectedMatchId"
        placeholder="Оберіть матч"
        class="w-full"
        filterable
        :disabled="loading"
        @change="winnerTeamId = ''"
      >
        <el-option
          v-for="m in props.matches"
          :key="m.id"
          :label="matchLabel(m)"
          :value="m.id"
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

    <template #footer>
      <div class="flex justify-end gap-10">
        <el-button :disabled="loading" class="!bg-transparent !border-white/10 !text-gray-300" @click="close">
          Скасувати
        </el-button>
        <el-button
          type="danger"
          :loading="loading"
          :disabled="!selectedMatchId || !winnerTeamId"
          @click="submit"
        >
          Зарахувати поразку
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { TQualificationMatch } from '@/api/types/api.types'
import MatchTeamSelectCard from '@/components/MatchTeamSelectCard.vue'

const props = defineProps<{
  matches: TQualificationMatch[]
  onSubmitted?: (matchId: string, winnerId: string) => void
}>()

const modelValue = defineModel<boolean>({ default: false })

const selectedMatchId = ref<string>('')
const winnerTeamId = ref<string>('')
const loading = ref(false)

const selectedMatch = computed(() =>
  props.matches.find((m) => m.id === selectedMatchId.value) ?? null
)

function matchLabel (m: TQualificationMatch): string {
  return `${m.teamA?.name ?? '?'} vs ${m.teamB?.name ?? '?'}`
}

function cardState (teamId: string): 'neutral' | 'winner' | 'loser' {
  if (!winnerTeamId.value) return 'neutral'
  return winnerTeamId.value === teamId ? 'winner' : 'loser'
}

function toggleWinner (teamId: string) {
  winnerTeamId.value = winnerTeamId.value === teamId ? '' : teamId
}

function resetForm () {
  selectedMatchId.value = ''
  winnerTeamId.value = ''
  loading.value = false
}

function close () {
  modelValue.value = false
}

async function submit () {
  if (!selectedMatchId.value || !winnerTeamId.value) return
  loading.value = true
  try {
    const res = await tournamentsService.adminTechLossQualificationMatch(
      selectedMatchId.value,
      winnerTeamId.value
    )
    ElMessage.success('Технічну поразку зараховано')
    props.onSubmitted?.(res.matchId, res.winnerId)
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
:deep(.tech-loss-qual-dialog.custom-dialog) {
  background-color: #1e2330;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}
:deep(.tech-loss-qual-dialog .el-dialog__title) {
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
