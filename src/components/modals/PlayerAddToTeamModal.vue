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
              <div class="flex items-center gap-10">
                <el-avatar :src="getAvatarUrl(row.avatarUrl)" class="size-50" />
                <div class="flex flex-col leading-tight">
                  <span class="font-bold text-gray-200">
                    {{ row.discordName }}
                  </span>
                  <span v-if="row.discordUsername" class="text-xs text-gray-500">
                    @{{ row.discordUsername }}
                  </span>
                </div>
              </div>
            </div>
          </template>
        </RecycleScroller>

        <div
          v-if="!freePlayers.length"
          class="text-center py-10 text-gray-500 text-sm"
        >
          Гравців не знайдено
        </div>
      </div>
    </div>

    <template #footer>
      <!-- TODO: endpoint not in API yet (joinToTeam) -->
      <div class="flex gap-10">
        <el-tooltip content="Функціонал в розробці">
          <el-button :disabled="true" type="primary" class="flex-1">
            <PhPlus />
            <span class="ml-10">Додати гравця до {{ isMain ? 'основи' : 'запасу' }}</span>
          </el-button>
        </el-tooltip>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { searchPlayer } from '@/core/helpers'
import { PhMagnifyingGlass, PhPlus } from '@phosphor-icons/vue'
import type { TTeam as Team } from '@/api/types/api.types'

defineProps<{
  team: Team | undefined
  isMain: boolean
}>()

const modelValue = defineModel<boolean>({ default: false })

const selectedPlayer = ref<string | null>(null)
const search = ref('')
const apiPublicUrl = import.meta.env.VITE_API_PUBLIC_URL

const playerStore = usePlayersStore()

const freePlayers = computed(() => {
  if (!playerStore.players) return []
  return playerStore.players.filter(player => searchPlayer(player, search.value.trim()))
})

const getAvatarUrl = (path: string | null | undefined) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${apiPublicUrl}${path}`
}

function setSelectedPLayer (id: string) {
  selectedPlayer.value = id
}

function close () {
  modelValue.value = false
  selectedPlayer.value = null
}

onMounted(() => {
  playerStore.getPlayers()
})
</script>
