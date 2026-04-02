<template>
  <div class="participants-tab flex flex-col gap-20 w-full max-w-7xl mx-auto md:p-20 p-10">
    <!-- Header -->
    <div class="w-full flex items-center gap-20 justify-between">
      <el-input v-model="playerSearch" placeholder="Пошук по ніку" class="w-full" />
      <el-button
        type="warning"
        plain
        size="large"
        class="flex items-center gap-2"
        @click="emit('open-auto-search')"
      >
        <span class="ml-2 md:block hidden">Автопошук</span>
      </el-button>
      <el-button
        type="primary"
        plain
        size="large"
        class="flex items-center gap-2 md:px-40 px-20"
        @click="emit('open-add-player')"
      >
        <PhPlus weight="bold" />
        <span class="ml-4 md:block hidden">Додати учасника</span>
      </el-button>
    </div>

    <!-- Table -->
    <div class="overflow-hidden">
      <el-table
        :data="filteredPlayers"
        row-key="player_id"
        class="h-[350px] rounded-md overflow-auto"
        empty-text="Гравці відсутні"
        border
      >
        <!-- Player Column -->
        <el-table-column label="Гравець" min-width="300">
          <template #header>
            <div class="flex items-center gap-20 py-10 ml-90">Гравець</div>
          </template>
          <template #default="{ row }: { row: TMixPoolEntry }">
            <div class="flex items-center gap-20 py-10">
              <el-avatar
                :src="playersMap.get(row.player_id || 0)?.avatar_url
                  ? `${apiPublicUrl}${playersMap.get(row.player_id || 0)?.avatar_url}`
                  : ''"
                class="ring-2 ring-gray-800 shadow-md transition-all duration-300"
              >
                <template #default>
                  <PhUser size="28" weight="bold" class="text-white/70" />
                </template>
              </el-avatar>

              <div class="flex flex-col">
                <span class="text-sm font-bold text-gray-200">
                  {{ playersMap.get(row.player_id || 0)?.steam_name || 'Ім\'я відсутнє' }}
                </span>
                <span class="text-xs text-gray-400 mt-2">
                  @{{ playersMap.get(row.player_id || 0)?.user_name || 'Діскорд відсутній' }}
                </span>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- Pool Column -->
        <el-table-column
          v-if="isDraftStage"
          label="Пул"
          align="center"
          width="100"
        >
          <template #header>
            <div class="text-center py-10">Пул</div>
          </template>
          <template #default="{ row }: { row: TMixPoolEntry }">
            <el-tag
              :type="getPoolColor(row.pool || null)"
              effect="dark"
              class="p-12 rounded-lg font-medium text-gray-800"
            >
              {{ row.pool ? `Pool ${row.pool}` : '-' }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- Role Column -->
        <el-table-column
          v-if="isDraftStage"
          label="Роль"
          align="center"
          width="80"
        >
          <template #header>
            <div class="text-center py-10">Роль</div>
          </template>
          <template #default="{ row }: { row: TMixPoolEntry }">
            <el-tooltip v-if="row.is_cap" content="Капітан" placement="top">
              <PhTrophy weight="fill" class="text-yellow-500" />
            </el-tooltip>
            <span v-else class="text-gray-500">—</span>
          </template>
        </el-table-column>

        <!-- Status Column -->
        <el-table-column
          v-if="isDraftStage"
          label="Статус"
          align="center"
          width="120"
        >
          <template #header>
            <div class="text-center py-10">Статус</div>
          </template>
          <template #default="{ row }: { row: TMixPoolEntry }">
            <el-tag
              class="text-xs p-10 font-medium bg-primary text-gray-800 rounded-lg border-none"
            >
              {{ row.is_free ? 'Вільний' : 'В команді' }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- Actions Column -->
        <el-table-column label="" align="right" width="160">
          <template #header>
            <div class="text-center py-10">Дії</div>
          </template>
          <template #default="{ row }: { row: TMixPoolEntry }">
            <div
              v-if="props.tournament.status !== ETournamentStatus.ENDED"
              class="flex justify-center px-20 gap-10 text-white"
            >
              <template v-if="isDraftStage">
                <el-tooltip
                  v-if="playersMap.get(row.player_id || 0)?.roles?.some(
                    role => role.type_name === ERole.MODERATOR || ERole.ADMIN)
                  "
                  content="Змінити пул гравця"
                >
                  <PhPencilSimple
                    :size="16"
                    weight="bold"
                    class="hover:text-primary hover:scale-[1.1]  transition-all"
                    @click="emit('edit-pool', row)"
                  />
                </el-tooltip>

                <el-tooltip
                  v-if="row.is_cap"
                  content="Зняти роль капітана" placement="top"
                >
                  <PhX
                    :size="16"
                    weight="bold"
                    class="hover:text-primary hover:scale-[1.1]  transition-all"
                    @click="emit('toggle-captain', row)"
                  />
                </el-tooltip>

                <el-tooltip
                  v-else-if="playersMap.get(row.player_id || 0)?.roles?.some(
                    role => role.type_name === ERole.MODERATOR || ERole.ADMIN
                  )"
                  content="Призначити капітаном" placement="top"
                >
                  <PhTrophy
                    :size="16"
                    weight="bold"
                    class="hover:text-primary hover:scale-[1.1]  transition-all"
                    @click="emit('toggle-captain', row)"
                  />
                </el-tooltip>
              </template>

              <el-tooltip
                v-if="playersMap.get(row.player_id || 0)?.roles?.some(
                  role => role.type_name === ERole.MODERATOR || ERole.ADMIN
                )"
                placement="top" content="Видалити гравця з турніру"
              >
                <el-popconfirm
                  title="Видалити гравця з турніру?"
                  confirm-button-text="Видалити"
                  class="custom-popconfirm"
                  width="300"
                  placement="left-start"
                  cancel-button-text="Скасувати"
                  cancel-button-type="primary"
                  confirm-button-type="danger"
                  @confirm="emit('remove-player', row)"
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
</template>

<script setup lang="ts">
import { PhPlus, PhUser, PhTrophy, PhPencilSimple, PhX, PhTrash } from '@phosphor-icons/vue'
import { ETournamentStatus } from '@/components/tournaments-tags/tournament.constants'
import { ERole } from '@/types/general.types'

const apiPublicUrl = import.meta.env.VITE_API_PUBLIC_URL

const props = defineProps<{
  participants: TMixPoolEntry[]
  tournament: TMixTournament
  tournamentStatus: string
}>()

const emit = defineEmits<{
  (e: 'open-add-player'): void
  (e: 'open-auto-search'): void
  (e: 'edit-pool', payload: TMixPoolEntry): void
  (e: 'toggle-captain', payload: TMixPoolEntry): void
  (e: 'remove-player', payload: TMixPoolEntry): void
}>()

const playersStore = usePlayersStore()

const playerSearch = ref('')

const playersMap = computed(() => {
  return new Map(playersStore.players.map(p => [p.id, p]))
})

const filteredPlayers = computed(() => {
  console.log(props.participants)
  if (!playerSearch.value) return props.participants

  return props.participants.filter(player =>
    player && searchPlayer(playersMap.value?.get(player.player_id || 0) || null)
  )
})

const isDraftStage = computed(() => {
  const draftStatuses = ['team-creation', 'in-progress', 'registration']
  return draftStatuses.includes(props.tournamentStatus)
})

function searchPlayer (player: TPlayer | null) {
  if (!playerSearch.value || !player) return true
  return player.user_name?.toLowerCase().includes(playerSearch.value.toLowerCase()) ||
         player.steam_name?.toLowerCase().includes(playerSearch.value.toLowerCase())
}

const getPoolColor = (pool: number | null) => {
  switch (pool) {
    case 1: return 'danger'
    case 2: return 'warning'
    case 3: return 'success'
    default: return 'info'
  }
}
</script>
