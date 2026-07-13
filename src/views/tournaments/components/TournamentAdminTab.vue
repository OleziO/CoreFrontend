<template>
  <div class="w-full mt-20">
    <el-tabs v-model="activeTab" tab-position="top" stretch class="w-full">
      <el-tab-pane v-for="tab in tabs" :key="tab.label" class="mt-20" :label="tab.label" :name="tab.value" />
    </el-tabs>

    <div v-if="activeTab === 'status'" class="mt-20">
      <div
        class="bg-surface border border-white/10 rounded-xl p-10
          md:p-20 flex flex-col md:flex-row items-center justify-between gap-8
          relative overflow-hidden"
      >
        <div class="flex items-center w-full gap-10 relative z-10">
          <div class="flex items-center w-full gap-10">
            <span class="text-gray-400 text-xs font-bold uppercase tracking-widest">Поточний етап</span>
            <TournamentStatusTag :status="tournament?.tournamentStatus" class="min-w-100" />
          </div>
        </div>

        <!-- TODO: endpoint not in API yet (startTournament, openQualifications, endTournament) -->
        <div class="px-6 py-3 rounded-xl text-gray-500 text-sm bg-white/[0.02] font-mono">
          Управління турніром недоступне
        </div>
      </div>

      <div class="mt-20 flex items-center gap-10">
        <el-button type="primary" plain @click="showEditDrawer = true">
          Редагувати турнір
        </el-button>

        <el-popconfirm
          width="300"
          placement="bottom-start"
          title="Видалити турнір?"
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

    <CreateTournamentDrawer v-model="showEditDrawer" :tournament="tournament" />

    <div v-if="activeTab === 'participants'" class="mt-20">
      <div class="participants-tab flex flex-col gap-20 w-full max-w-7xl mx-auto">
        <div class="bg-surface border border-white/10 rounded-xl p-10 md:p-20 flex flex-col gap-12">
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

    <div v-if="activeTab === 'playoff'" class="mt-20 flex flex-col gap-20 w-full max-w-7xl mx-auto">
      <div v-if="playoffLoading" class="text-gray-500 text-sm">
        Завантаження…
      </div>

      <template v-else-if="playoff">
        <div class="bg-surface border border-white/10 rounded-xl p-10 md:p-20 flex flex-col gap-12">
          <span class="text-gray-400 text-xs font-bold uppercase tracking-widest">Плей-оф запущено</span>
          <a
            :href="playoff.embedUrl"
            target="_blank"
            rel="noopener"
            class="text-primary text-sm break-all hover:underline"
          >
            {{ playoff.embedUrl }}
          </a>
        </div>

        <div class="bg-surface border border-white/10 rounded-xl p-10 md:p-20 flex flex-col gap-12">
          <span class="text-gray-400 text-xs font-bold uppercase tracking-widest">Учасники плей-оф</span>
          <el-table
            :data="playoff.teams"
            row-key="id"
            class="rounded-md overflow-auto"
            empty-text="Команди відсутні"
            border
          >
            <el-table-column label="Назва команди">
              <template #default="{ row }">
                <span class="text-sm text-white">{{ row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column label="Дія" width="180">
              <template #default="{ row }">
                <el-popconfirm
                  width="260"
                  title="Дискваліфікувати команду?"
                  confirm-button-text="Так"
                  cancel-button-text="Ні"
                  confirm-button-type="danger"
                  @confirm="disqualify(row.id)"
                >
                  <template #reference>
                    <el-button type="danger" size="small" :loading="actionLoading" plain>
                      Дискваліфікувати
                    </el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </template>

      <template v-else>
        <div class="bg-surface border border-white/10 rounded-xl p-10 md:p-20 flex flex-col gap-12">
          <span class="text-gray-400 text-xs font-bold uppercase tracking-widest">Додати команди до плей-оф</span>
          <div class="flex gap-10 items-center">
            <el-select
              v-model="selectedEligibleIds"
              multiple
              filterable
              placeholder="Оберіть команди (допущені за кваліфікацією)"
              class="flex-1"
              :loading="eligibleLoading"
            >
              <el-option
                v-for="t in addableEligibleTeams"
                :key="t.id"
                :label="t.name"
                :value="t.id"
              />
            </el-select>
            <el-button
              type="primary"
              :loading="actionLoading"
              :disabled="!selectedEligibleIds.length"
              @click="addStaged"
            >
              Додати
            </el-button>
          </div>
        </div>

        <div class="bg-surface border border-white/10 rounded-xl p-10 md:p-20 flex flex-col gap-12">
          <span class="text-gray-400 text-xs font-bold uppercase tracking-widest">
            Склад плей-оф (ще не запущено)
          </span>
          <el-table
            :data="stagedTeams"
            row-key="id"
            class="rounded-md overflow-auto"
            empty-text="Команди ще не додані"
            border
          >
            <el-table-column label="Назва команди">
              <template #default="{ row }">
                <span class="text-sm text-white">{{ row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column label="Дія" width="140">
              <template #default="{ row }">
                <el-button
                  type="danger"
                  size="small"
                  :loading="actionLoading"
                  plain
                  @click="removeStaged(row.id)"
                >
                  Прибрати
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="flex items-center gap-10">
            <el-popconfirm
              width="320"
              title="Запустити плей-оф? Дію не можна скасувати."
              confirm-button-text="Запустити"
              cancel-button-text="Скасувати"
              @confirm="startPlayoff"
            >
              <template #reference>
                <el-button type="primary" :loading="actionLoading" :disabled="stagedTeams.length < 2">
                  Запустити плей-оф
                </el-button>
              </template>
            </el-popconfirm>
            <span v-if="stagedTeams.length < 2" class="text-gray-500 text-xs">
              Потрібно щонайменше 2 команди.
            </span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import TournamentStatusTag from '@/components/tournaments-tags/TournamentStatusTag.vue'
import { inferTournamentDivisionFromAvgRating } from '@/components/tournaments-tags/tournament.constants'
import { tournamentsService } from '@/views/tournaments/tournaments.service'
import { teamsService } from '@/views/teams/teams.service'
import { friendlyPlayoffError } from '@/views/tournaments/utils/playoff-errors.utils'

const props = defineProps<{
  tournament?: TTournament | null
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
  (e: 'playoff-updated', response: TPlayoff): void
}>()

const showEditDrawer = ref(false)

const router = useRouter()
const tournamentStore = useTournamentStore()
const deleteLoading = ref(false)
const joinLoading = ref(false)
const selectedTeamId = ref<string>('')
const allTeams = ref<Array<TTeam | TTeam>>([])
const teamsLoading = ref(false)

// Дивізіон рахуємо лише за середнім MMR основи (без верхньої межі по гравцю),
// щоб фільтр збігався з бекендом (tournament-division.util.ts, поріг 6500).
function computeDivision (mainPlayers: { rating: number }[]): string | null {
  if (mainPlayers.length === 0) return null
  const ratings = mainPlayers.map((p) => p.rating)
  const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length
  return inferTournamentDivisionFromAvgRating(avg)
}

const eligibleTeams = computed(() => {
  const tournamentDivision = props.tournament?.division ?? null
  return allTeams.value.filter((t) => {
    if (!t.isVerified) return false
    if (!tournamentDivision) return true
    const main = t.mainPlayers ?? []
    if (main.length === 0) return false
    return computeDivision(main) === tournamentDivision
  })
})
const tabs = [
  { value: 'status', label: 'Етапи турніру' },
  { value: 'participants', label: 'Управління командами' },
  { value: 'playoff', label: 'Плей-оф' }
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
  if (tab === 'playoff') loadPlayoffData()
}, { immediate: false })

// --- Плей-оф (адмін) ---
const playoff = ref<TPlayoff | null>(null)
const playoffLoading = ref(false)
const actionLoading = ref(false)
const eligibleLoading = ref(false)
const playoffEligibleTeams = ref<TTeam[]>([])
const stagedTeams = ref<TTeam[]>([])
const selectedEligibleIds = ref<string[]>([])

/** Допущені команди, яких ще немає в складі плей-оф. */
const addableEligibleTeams = computed(() => {
  const staged = new Set(stagedTeams.value.map((t) => t.id))
  return playoffEligibleTeams.value.filter((t) => !staged.has(t.id))
})

async function loadPlayoffData () {
  const id = props.tournament?.id
  if (!id || playoffLoading.value) return
  playoffLoading.value = true
  try {
    const started = await tournamentsService.fetchPlayoff(id)
    playoff.value = started
    if (!started) {
      eligibleLoading.value = true
      const [staged, eligible] = await Promise.all([
        tournamentsService.getPlayoffTeams(id),
        tournamentsService.fetchQualificationTeams(id)
      ])
      stagedTeams.value = staged
      playoffEligibleTeams.value = eligible
    }
  } catch (e: unknown) {
    ElMessage.error(friendlyPlayoffError(e, 'Не вдалося завантажити дані плей-оф'))
  } finally {
    eligibleLoading.value = false
    playoffLoading.value = false
  }
}

async function addStaged () {
  const id = props.tournament?.id
  if (!id || !selectedEligibleIds.value.length) return
  actionLoading.value = true
  try {
    stagedTeams.value = await tournamentsService.addPlayoffTeams(id, selectedEligibleIds.value)
    selectedEligibleIds.value = []
    ElMessage.success('Команди додано до складу плей-оф')
  } catch (e: unknown) {
    ElMessage.error(friendlyPlayoffError(e, 'Не вдалося додати команди'))
  } finally {
    actionLoading.value = false
  }
}

async function removeStaged (teamId: string) {
  const id = props.tournament?.id
  if (!id) return
  actionLoading.value = true
  try {
    stagedTeams.value = await tournamentsService.removePlayoffTeams(id, [teamId])
  } catch (e: unknown) {
    ElMessage.error(friendlyPlayoffError(e, 'Не вдалося прибрати команду'))
  } finally {
    actionLoading.value = false
  }
}

async function startPlayoff () {
  const id = props.tournament?.id
  if (!id) return
  actionLoading.value = true
  try {
    playoff.value = await tournamentsService.startPlayoff(
      id,
      stagedTeams.value.map((t) => t.id)
    )
    ElMessage.success('Плей-оф запущено')
    emit('refresh')
  } catch (e: unknown) {
    ElMessage.error(friendlyPlayoffError(e, 'Не вдалося запустити плей-оф'))
    // 409 — можливо, плей-оф уже стартовано іншим адміном; перезавантажуємо стан.
    await loadPlayoffData()
  } finally {
    actionLoading.value = false
  }
}

async function disqualify (teamId: string) {
  const id = props.tournament?.id
  if (!id) return
  actionLoading.value = true
  try {
    const response = await tournamentsService.disqualifyPlayoffTeam(id, teamId)
    playoff.value = response
    ElMessage.success('Команду дискваліфіковано, сітку перебудовано')
    emit('playoff-updated', response)
    emit('refresh')
  } catch (e: unknown) {
    ElMessage.error(friendlyPlayoffError(e, 'Не вдалося дискваліфікувати команду'))
  } finally {
    actionLoading.value = false
  }
}

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
    await tournamentStore.deleteTournament(props.tournament.id)
    ElMessage.success('Турнір видалено')
    router.push('/tournaments')
  } catch {
    ElMessage.error('Не вдалося видалити турнір')
  } finally {
    deleteLoading.value = false
  }
}
</script>
