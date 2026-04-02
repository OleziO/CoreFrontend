<template>
  <el-dialog
    v-model="modelValue"
    title="Додати гравця до команди"
    width="400"
    destroy-on-close
    @close="close"
  >
    <div v-loading.fullscreen="playerStore.loading" class="flex flex-col gap-4 my-20 w-full">
      <el-input
        v-model="search"
        placeholder="Пошук по ніку"
        clearable
        size="large"
        class="flex-1"
      >
        <template #prefix>
          <PhMagnifyingGlass />
        </template>
      </el-input>

      <div class="py-20 w-full !h-[300px] overflow-hidden">
        <RecycleScroller
          :items="freePlayers"
          key-field="id"
          :buffer="1000"
          class="w-full !max-h-[300px] rounded-xl overflow-auto"
          :item-size="85"
        >
          <template #default="{ item: row }">
            <div
              class="flex justify-between items-center cursor-pointer rounded-lg
                border-b !h-80 border-white/5 hover:bg-white/5 transition p-10"
              :class="{'bg-gray-700 hover:!bg-gray-700': selectedPlayer === row.id}"
              @click="setSelectedPLayer(row.id)"
            >
              <!-- Гравець -->
              <div class="flex items-center gap-10">
                <el-avatar :src="getAvatarUrl(row.avatar_url)" class="size-50" />
                <div class="flex flex-col leading-tight">
                  <span class="font-bold text-gray-200">
                    {{ row.steam_name }}
                  </span>
                  <span v-if="row.user_name" class="text-xs text-gray-500">
                    @{{ row.user_name }}
                  </span>
                </div>
              </div>
            </div>
          </template>
        </RecycleScroller>

        <!-- Порожній стан -->
        <div
          v-if="!freePlayers.length"
          class="text-center py-10 text-gray-500 text-sm"
        >
          Гравців не знайдено
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-10">
        <el-button :disabled="!selectedPlayer" type="primary" class="flex-1" @click="joinToTeam()">
          <PhPlus />
          <span class="ml-10">Додати гравця до {{ isMain ? 'основи' : 'запасу' }}</span>
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { searchPlayer } from '@/core/helpers'
import { PhMagnifyingGlass, PhPlus } from '@phosphor-icons/vue'

// 1. Добавляем проп isMain
const props = defineProps<{
  team: TTeam | undefined
  isMain: boolean
}>()

const modelValue = defineModel<boolean>({ default: false })

const selectedPlayer = ref<number | null>(null)
const search = ref('')
const apiPublicUrl = import.meta.env.VITE_API_PUBLIC_URL

const teamsStore = useTeamsStore()
const playerStore = usePlayersStore()

const freePlayers = computed(() => {
  if (!playerStore.players) return []

  const _players = playerStore.players.filter(player => !player.team_id)

  return _players.filter(player => searchPlayer(player, search.value.trim()))
})

const getAvatarUrl = (path: string | null | undefined) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${apiPublicUrl}${path}`
}

function setSelectedPLayer (id: number) {
  selectedPlayer.value = id
}

function close () {
  modelValue.value = false
  selectedPlayer.value = null
}

async function joinToTeam () {
  await teamsStore.joinToTeam(
    selectedPlayer.value as number,
    props.team?.id as number,
    props.isMain
  )

  close()
}

onMounted(() => {
  playerStore.getPlayers()
})
</script>
