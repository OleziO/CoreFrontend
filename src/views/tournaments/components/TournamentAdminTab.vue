<template>
  <div class="w-full mt-20">
    <el-tabs v-model="activeTab" tab-position="top" stretch class="w-full">
      <el-tab-pane v-for="tab in tabs" :key="tab.label" class="mt-20" :label="tab.label" :name="tab.value" />
    </el-tabs>

    <div v-if="activeTab === 'status'" class="mt-20">
      <div
        class="bg-[#111827] rounded-md p-10
          md:p-20 flex flex-col md:flex-row items-center justify-between gap-8
          relative overflow-hidden"
      >
        <div class="flex items-center w-full gap-10 relative z-10">
          <div class="flex items-center w-full gap-10">
            <span class="text-gray-400 text-xs font-bold uppercase tracking-widest">Поточний етап</span>
            <TournamentStatusTag :status="tournament?.tournamentStatus" class="min-w-100" />
          </div>
        </div>

        <!-- TODO: endpoint not in API yet (startTournament, openRegistration, endTournament) -->
        <div class="px-6 py-3 rounded-xl text-gray-500 text-sm bg-white/[0.02] font-mono">
          Управління турніром недоступне
        </div>
      </div>

      <div class="mt-20">
        <el-popconfirm
          title="Видалити турнір? Дія незворотна."
          confirm-button-text="Видалити"
          cancel-button-text="Скасувати"
          confirm-button-type="danger"
          @confirm="deleteTournament"
        >
          <template #reference>
            <el-button type="danger" :loading="deleteLoading" plain>
              Видалити турнір
            </el-button>
          </template>
        </el-popconfirm>
      </div>
    </div>

    <div v-if="activeTab === 'participants'" class="mt-20">
      <div class="participants-tab flex flex-col gap-20 w-full max-w-7xl mx-auto">
        <div class="bg-[#111827] rounded-md p-10 md:p-20 flex flex-col gap-12">
          <span class="text-gray-400 text-xs font-bold uppercase tracking-widest">Додати команду до турніру</span>
          <div class="flex gap-10 items-center">
            <el-select
              v-model="selectedTeamId"
              filterable
              placeholder="Оберіть команду"
              class="flex-1"
              :loading="teamsLoading"
            >
              <el-option
                v-for="team in eligibleTeams"
                :key="team.id"
                :label="team.name"
                :value="team.id"
              />
            </el-select>
            <el-button
              type="primary"
              :loading="joinLoading"
              :disabled="!selectedTeamId"
              @click="adminJoinTeam"
            >
              Додати
            </el-button>
          </div>
        </div>

        <el-table
          :data="teams"
          row-key="id"
          class="h-[350px] rounded-md overflow-auto"
          empty-text="Команди відсутні"
          border
        >
          <el-table-column label="ID команди">
            <template #default="{ row }">
              <span class="text-sm text-white">{{ row.id }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Назва команди">
            <template #default="{ row }">
              <span class="text-sm text-white">{{ row.name }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import TournamentStatusTag from '@/components/tournaments-tags/TournamentStatusTag.vue'
import type { TTournament as Tournament, TTeam as Team } from '@/api/types/api.types'
import { tournamentsService } from '@/views/tournaments/tournaments.service'
import { teamsService } from '@/views/teams/teams.service'

const props = defineProps<{
  tournament?: Tournament | null
}>()

const emit = defineEmits<{ (e: 'refresh'): void }>()

const router = useRouter()
const deleteLoading = ref(false)
const joinLoading = ref(false)
const selectedTeamId = ref<string>('')
const allTeams = ref<Team[]>([])
const teamsLoading = ref(false)

function computeDivision (mainPlayers: { rating: number }[]): string | null {
  const ratings = mainPlayers.map((p) => p.rating)
  const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length
  const max = Math.max(...ratings)
  if (avg <= 2500 && max <= 3500) return 'DIVISION_I'
  if (avg <= 4500 && max <= 5500) return 'DIVISION_II'
  if (avg <= 7000) return 'DIVISION_III'
  return null
}

const eligibleTeams = computed(() => {
  const tournamentDivision = props.tournament?.division ?? null
  return allTeams.value.filter((t) => {
    if (!t.isVerified || (t.mainPlayers?.length ?? 0) !== 5) return false
    if (!tournamentDivision) return true
    return computeDivision(t.mainPlayers) === tournamentDivision
  })
})

const tabs = [
  { value: 'status', label: 'Етапи турніру' },
  { value: 'participants', label: 'Управління командами' }
]

const activeTab = ref('status')

const teams = computed(() => props.tournament?.teams || [])

async function loadTeams () {
  teamsLoading.value = true
  try {
    allTeams.value = await teamsService.fetchAllTeams()
  } catch {
    ElMessage.error('Не вдалося завантажити команди')
  } finally {
    teamsLoading.value = false
  }
}

watch(activeTab, (tab) => {
  if (tab === 'participants') loadTeams()
}, { immediate: false })

async function adminJoinTeam () {
  if (!props.tournament?.id || !selectedTeamId.value) return
  joinLoading.value = true
  try {
    await tournamentsService.joinTournament(props.tournament.id, selectedTeamId.value)
    ElMessage.success('Команду додано до турніру')
    selectedTeamId.value = ''
    emit('refresh')
  } catch {
    ElMessage.error('Не вдалося додати команду')
  } finally {
    joinLoading.value = false
  }
}

async function deleteTournament () {
  if (!props.tournament?.id) return
  deleteLoading.value = true
  try {
    await tournamentsService.deleteTournament(props.tournament.id)
    ElMessage.success('Турнір видалено')
    router.push('/tournaments')
  } catch {
    ElMessage.error('Не вдалося видалити турнір')
  } finally {
    deleteLoading.value = false
  }
}
</script>
