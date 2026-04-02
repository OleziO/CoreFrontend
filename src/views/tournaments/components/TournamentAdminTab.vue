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
            <TournamentStatusTag :status="(tournament?.status as ETournamentStatus)" class="min-w-100" />
          </div>
        </div>

        <div class="w-full md:w-auto shrink-0 relative z-10">
          <button
            v-if="currentAction"
            class="w-full md:mt-0 mt-20 md:w-auto group flex items-center justify-center px-20
                py-8 text-white font-light rounded-md transition-all shadow-md disabled:bg-red-300"
            :class="actionButtonSolidColor"
            @click="tournamentProgress"
          >
            <span>{{ currentAction.label }}</span>
          </button>

          <div
            v-else class="px-6 py-3 rounded-xl
               text-gray-500 text-sm bg-white/[0.02] font-mono"
          >
            Дії недоступні
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'matches'" class="mt-20">
      <TournamentMatchesTab v-model:matches="matches" :tournament-id="tournamentId" />
    </div>

    <div v-if="activeTab === 'participants'" class="mt-20">
      <div class="participants-tab flex flex-col gap-20 w-full max-w-7xl mx-auto">
        <div class="w-full flex items-center gap-20 justify-between">
          <el-input v-model="teamSearch" placeholder="Пошук по ніку" class="w-full" />

          <el-tooltip placement="top" content="Функціонал в розробці">
            <el-button
              type="primary"
              plain
              :disabled="true"
              size="large"
              class="flex items-center gap-2 md:px-40 px-20"
            >
              <PhPlus weight="bold" />
              <span class="ml-4 md:block hidden">Додати команду</span>
            </el-button>
          </el-tooltip>
        </div>

        <el-table
          :data="teams"
          row-key="team_id"
          class="h-[350px] rounded-md overflow-auto"
          empty-text="Команди відсутні"
          border
        >
          <el-table-column label="ID команди">
            <template #default="{ row }: {row: TTeam}">
              <div class="flex items-center gap-20 py-10">
                <span class="text-sm text-white">{{ row.id }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="">
            <template #default="{ row }: {row: TTeam}">
              <el-avatar :src="getImageUrl(row.avatar_url)" />
            </template>
          </el-table-column>

          <el-table-column label="Назва команди">
            <template #default="{ row }: {row: TTeam}">
              <span class="text-sm text-white">{{ row.team_name }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Дивізіон">
            <template #default="{ row }: {row: TTeam}">
              <span class="text-sm text-white">{{ row.calculated_division?.name }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Дії" align="right" width="160">
            <template #header>
              <div class="text-center py-10">Дії</div>
            </template>
            <template #default="{ row }: { row: TTeam }">
              <div
                v-if="props.tournament?.status !== ETournamentStatus.ENDED"
                class="flex justify-center px-20 gap-10 text-white"
              >
                <el-tooltip
                  placement="top" content="Видалити команду з турніру"
                >
                  <el-popconfirm
                    title="Видалити команду з турніру?"
                    confirm-button-text="Видалити"
                    class="custom-popconfirm"
                    width="300"
                    placement="left-start"
                    cancel-button-text="Скасувати"
                    cancel-button-type="primary"
                    confirm-button-type="danger"
                    @confirm="handleRemoveTeam(row.id)"
                  >
                    <template #reference>
                      <PhTrash
                        :size="16"
                        weight="bold"
                        class="cursor-pointer hover:scale-[1.1] transition-all"
                      />
                    </template>
                  </el-popconfirm>
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <AwardPointsModal
      v-model="isAwardPointsModalOpen"
      :tournament-id="tournamentId"
      :teams="teams"
      @success="handleAwardPoints"
    />
  </div>
</template>

<script setup lang="ts">
import { ETournamentStatus } from '@/components/tournaments-tags/tournament.constants'
import { getImageUrl } from '@/core/helpers'
import { PhPlus, PhTrash } from '@phosphor-icons/vue'
import TournamentStatusTag from '@/components/tournaments-tags/TournamentStatusTag.vue'
import AwardPointsModal from '../modals/AwardPointsModal.vue'

const props = defineProps<{
  tournament?: TTournamentWithParticipants
}>()

const matches = defineModel<TTournamentOpenMatch[]>('matches', { default: [] })

const tabs = [
  { value: 'status', label: 'Етапи турніру' },
  { value: 'matches', label: 'Управління матчами' },
  { value: 'participants', label: 'Управління командами' }
]

const route = useRoute()
const tournamentStore = useTournamentStore()

const tournamentId = ref(Number(route.params.id))
const activeTab = ref('status')
const teamSearch = ref('')

const teams = ref<TTeam[] | undefined>([])
const isAwardPointsModalOpen = ref(false)

const currentAction = computed(() => {
  const status = props.tournament?.status
  if (status === ETournamentStatus.PRE_REGISTRATION) return { label: 'Відкрити реєстрацію', nextStatus: 'registration' }
  if (status === ETournamentStatus.REGISTRATION) return { label: 'Розпочати турнір', nextStatus: 'in-progress' }
  if (status === ETournamentStatus.IN_PROGRESS) return { label: 'Завершити турнір', nextStatus: 'ended' }
  return null
})

const actionButtonSolidColor = computed(() => {
  const status = props.tournament?.status
  if (status === 'pre-registration') return 'bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/25'
  if (status === 'registration') return 'bg-green-600 hover:bg-green-500 hover:shadow-green-500/25'
  if (status === 'in-progress') return 'bg-red-600 hover:bg-red-500 hover:shadow-red-500/25'
  return 'bg-gray-700 hover:bg-gray-600'
})

async function tournamentProgress () {
  if (currentAction.value?.nextStatus === 'registration') {
    await tournamentStore.openRegistrationTournament(tournamentId.value)
  } else if (currentAction.value?.nextStatus === 'in-progress') {
    await tournamentStore.startTournament(tournamentId.value)
    matches.value = await tournamentStore.getOpenMatches(tournamentId.value) || []
  } else if (currentAction.value?.nextStatus === 'ended') {
    isAwardPointsModalOpen.value = true
  }
}

async function handleAwardPoints () {
  // Модалка уже закрывается автоматически после успешного вызова endTournament
  // Здесь можно добавить дополнительную логику при необходимости
}

async function handleRemoveTeam (teamId: number) {
  try {
    const updatedTournament = await tournamentStore.adminUnregisterTeamFromTournament(tournamentId.value, teamId)
    if (updatedTournament) {
      teams.value = updatedTournament.participants
    }
  } catch (error) {
    console.error('Помилка при видаленні команди:', error)
  }
}

onMounted(async () => {
  teams.value = props.tournament?.participants
})

</script>

<style scoped>
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translate3d(0, 20px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

// TODO В данный момент еще не доделаны матчи, и нет эндпоинта для того чтобы модеры могли поместить команду на турнир
