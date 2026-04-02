<template>
  <el-dialog
    title="Додати гравця до команди"
    width="600px"
    :model-value="isOpen.AddPlayerToMixTeamModal"
    destroy-on-close
    class="custom-dialog"
    @close="close('AddPlayerToMixTeamModal')"
  >
    <div class="flex flex-col gap-10 p-10">
      <div v-if="props.poolInfo" class="text-sm text-gray-400 mb-2">
        Pool: {{ props.poolInfo.min_mmr }} - {{ props.poolInfo.max_mmr }} MMP
      </div>

      <el-table
        :data="freePlayers"
        height="400"
        class="rounded-lg overflow-hidden !custom-pl"
        style="width: 100%"
        empty-text="Вільних гравців не знайдено"
        row-class-name="hover:bg-black/5 dark:hover:bg-white/5 transition"
        header-cell-class-name="table-header-padding-x"
      >
        <!-- Гравець -->
        <el-table-column label="Гравець" min-width="260">
          <template #default="{ row }">
            <div class="flex items-center gap-4 py-1">
              <el-avatar
                :size="36"
                :src="getAvatarUrl(row?.avatar_url)"
              />

              <div class="flex flex-col leading-tight">
                <span class="font-medium text-gray-800 dark:text-gray-100">
                  {{ row.steam_name || '—' }}
                </span>
                <span class="text-xs text-gray-500">
                  {{ row.user_name ? `@${row.user_name}` : '—' }}
                </span>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- MMR -->
        <el-table-column
          label="MMR"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <span class="text-sm font-medium text-start text-gray-700 dark:text-gray-200">
              {{ row.mmr ?? '—' }}
            </span>
          </template>
        </el-table-column>

        <!-- Дія -->
        <el-table-column
          align="right"
          width="120"
        >
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              :loading="mixStore.isLoading"
              @click="addPlayerToTeam(row)"
            >
              Додати
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">

const props = withDefaults(defineProps<{
  tournament: TMixTournament
  teamId: number
  poolInfo?: {
    pool: number
    min_mmr: number
    max_mmr: number
  } | null
}>(), {
  poolInfo: null
})

const { isOpen, close } = useAppModals()
const playersStore = usePlayersStore()

const apiPublicUrl = import.meta.env.VITE_API_PUBLIC_URL

const mixStore = useMixTournamentStore()

const getAvatarUrl = (path: string | null | undefined) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${apiPublicUrl}${path}`
}

const freePlayers = computed(() => {
  const mixPools = props.tournament?.mix_pools || []

  let filtered = mixPools.filter((entry: TMixPoolEntry) => entry.is_free)

  if (props.poolInfo?.pool) {
    filtered = filtered.filter((entry: TMixPoolEntry) => entry.pool === props.poolInfo?.pool)
  }

  filtered = filtered.filter(p => !p.is_cap)

  return filtered.map(f => playersStore.players.find(p => p.id === f.player_id))
})

const addPlayerToTeam = async (entry: TPlayer) => {
  if (!entry.id || !props.tournament.id || !props.teamId) return

  await mixStore.addPlayerToMixTeam(
    entry.id,
    props.tournament.id,
    props.teamId
  )

  close('AddPlayerToMixTeamModal')
}

onMounted(playersStore.getPlayers)
</script>

<style lang="scss" scoped>
.el-table.custom-pl {
  td.el-table__cell.is-center {
    @apply text-start #{!important};
  }
}
</style>
