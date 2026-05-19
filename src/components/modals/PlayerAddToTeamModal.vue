<template>
  <el-dialog
    v-model="modelValue"
    :title="isCoach ? 'Додати тренера' : 'Додати гравців до команди'"
    width="440"
    destroy-on-close
    @close="close"
  >
    <div v-loading.fullscreen="playerStore.loading || submitLoading" class="flex flex-col gap-4 my-20 w-full">
      <div class="flex flex-col gap-6 text-sm text-gray-400 px-2">
        <span>
          {{ slotTitle }}: можна обрати до
          <span class="text-gray-200 font-medium">{{ maxSelectable }}</span>
          {{ slotLabel }}.
          Лише <span class="text-gray-200">верифіковані</span> гравці.
        </span>
        <span v-if="maxSelectable > 0" class="text-gray-300">
          Обрано: <span class="font-medium text-white">{{ selectedIds.length }}</span>
          / {{ maxSelectable }}
        </span>
        <span v-else class="text-amber-500/90">
          У цьому слоті немає вільних місць.
        </span>
      </div>

      <el-input
        v-model="search"
        placeholder="Пошук по ніку"
        clearable
        size="large"
        class="flex-1"
        :disabled="maxSelectable === 0"
      >
        <template #prefix>
          <PhMagnifyingGlass />
        </template>
      </el-input>

      <div class="py-20 w-full !h-[300px] overflow-hidden">
        <RecycleScroller
          :items="eligiblePlayers"
          key-field="id"
          :buffer="1000"
          class="w-full !max-h-[300px] rounded-xl overflow-auto"
          :item-size="85"
        >
          <template #default="{ item: row }">
            <div
              class="flex justify-between items-center cursor-pointer rounded-lg
                border-b !h-80 border-white/5 hover:bg-white/5 transition p-10 gap-10"
              :class="{
                'bg-gray-700/90 hover:!bg-gray-700/90 ring-1 ring-primary/60': isRowSelected(row.id),
                'opacity-50 pointer-events-none': maxSelectable === 0
              }"
              @click="togglePlayer(row.id)"
            >
              <div class="flex items-center gap-10 min-w-0 flex-1">
                <div
                  class="shrink-0 size-6 rounded border flex items-center justify-center transition"
                  :class="isRowSelected(row.id)
                    ? 'border-primary bg-primary/20 text-primary'
                    : 'border-white/20 text-transparent'"
                >
                  <PhCheck v-if="isRowSelected(row.id)" :size="14" weight="bold" />
                </div>
                <el-avatar :src="getAvatarUrl(row.avatarUrl)" class="size-50 shrink-0" />
                <div class="flex flex-col leading-tight min-w-0">
                  <span class="font-bold text-gray-200 truncate">
                    {{ row.discordName }}
                  </span>
                  <span v-if="row.discordUsername" class="text-xs text-gray-500 truncate">
                    @{{ row.discordUsername }}
                  </span>
                </div>
              </div>
            </div>
          </template>
        </RecycleScroller>

        <div
          v-if="!eligiblePlayers.length && maxSelectable > 0"
          class="text-center py-10 text-gray-500 text-sm"
        >
          Гравців не знайдено
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-10">
        <el-button
          :disabled="!selectedIds.length || submitLoading || maxSelectable === 0"
          :loading="submitLoading"
          type="primary"
          class="flex-1"
          @click="submitAdd"
        >
          <PhPlus />
          <span class="ml-10">
            Додати обраних
            <template v-if="selectedIds.length">({{ selectedIds.length }})</template>
          </span>
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { isPlayerVerified, searchPlayer } from '@/core/helpers'
import { getApiErrorMessage } from '@/utils/api-errors'
import { PhCheck, PhMagnifyingGlass, PhPlus } from '@phosphor-icons/vue'
import type { TTeamResponse } from '@/api/types/api.types'
import { teamsService } from '@/views/teams/teams.service'

const props = defineProps<{
  team: TTeamResponse | undefined
  isMain: boolean
  isCoach?: boolean
  onAdded?: () => void | Promise<void>
}>()

const modelValue = defineModel<boolean>({ default: false })

const selectedIds = ref<string[]>([])
const search = ref('')
const submitLoading = ref(false)
const apiPublicUrl = import.meta.env.VITE_API_PUBLIC_URL

const playerStore = usePlayersStore()
const teamsStore = useTeamsStore()

const slotTitle = computed(() => {
  if (props.isCoach) return 'Тренер'
  return props.isMain ? 'Основа' : 'Запас'
})

const slotLabel = computed(() => {
  if (props.isCoach) return 'тренера'
  return props.isMain ? 'гравців у основі' : 'гравців у запасі'
})

/** Скільки ще можна додати в цей слот (ліміт бекенду / UI). Тренер — один. */
const maxSelectable = computed(() => {
  const t = props.team
  if (!t) return 0
  if (props.isCoach) return t.coach ? 0 : 1
  if (props.isMain) {
    return Math.max(0, 5 - (t.mainPlayers?.length ?? 0))
  }
  return Math.max(0, 3 - (t.reservedPlayers?.length ?? 0))
})

const rosterPlayerIds = computed(() => {
  const t = props.team
  const ids = new Set<string>()
  if (!t) return ids
  if (t.captain?.id) ids.add(t.captain.id)
  if (t.coach?.id) ids.add(t.coach.id)
  for (const p of t.mainPlayers ?? []) ids.add(p.id)
  for (const p of t.reservedPlayers ?? []) ids.add(p.id)
  return ids
})

/** Гравці, яких ще нема в цьому рості, без іншої команди (або вже в цій — тільки якщо не в списку). */
const eligiblePlayers = computed(() => {
  if (!playerStore.players?.length || !props.team?.id || maxSelectable.value === 0) return []
  const teamId = props.team.id
  return playerStore.players.filter((player) => {
    if (!isPlayerVerified(player)) return false
    if (rosterPlayerIds.value.has(player.id)) return false
    const otherTeam = player.teamId && String(player.teamId) !== String(teamId)
    if (otherTeam) return false
    return searchPlayer(player, search.value.trim())
  })
})

const getAvatarUrl = (path: string | null | undefined) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${apiPublicUrl}${path}`
}

function isRowSelected (id: string) {
  return selectedIds.value.includes(id)
}

function togglePlayer (id: string) {
  if (maxSelectable.value === 0) return

  // Тренер — один: повторний клік знімає, інший гравець замінює вибір.
  if (props.isCoach) {
    selectedIds.value = isRowSelected(id) ? [] : [id]
    return
  }

  const i = selectedIds.value.indexOf(id)
  if (i >= 0) {
    selectedIds.value = selectedIds.value.filter((x) => x !== id)
    return
  }

  if (selectedIds.value.length >= maxSelectable.value) {
    ElMessage.warning(`Можна обрати щонайбільше ${maxSelectable.value} гравців для цього слоту.`)
    return
  }

  selectedIds.value = [...selectedIds.value, id]
}

function close () {
  modelValue.value = false
  selectedIds.value = []
  search.value = ''
}

watch(maxSelectable, (cap) => {
  if (selectedIds.value.length > cap) {
    selectedIds.value = selectedIds.value.slice(0, cap)
  }
})

async function submitAdd () {
  const tid = props.team?.id
  const ids = [...selectedIds.value]
  if (!tid || !ids.length) {
    ElMessage.warning('Оберіть гравців')
    return
  }
  if (ids.length > maxSelectable.value) {
    ElMessage.warning('Занадто багато обраних для вільних слотів')
    return
  }

  submitLoading.value = true
  try {
    if (props.isCoach) {
      const coachId = ids[0]
      try {
        const updatedTeam = await teamsStore.updateTeam(tid, { coachId })
        teamsStore.patchTeamInList(updatedTeam)
        playerStore.setPlayerTeamIdClientside(coachId, tid)
      } catch (e: unknown) {
        ElMessage.error(getApiErrorMessage(e, 'Не вдалося призначити тренера'))
        return
      }
      await props.onAdded?.()
      ElMessage.success('Тренера призначено')
      close()
      return
    }

    const slot = props.isMain ? 'main' : 'reserved'
    let added = 0
    for (const pid of ids) {
      try {
        const updatedTeam = await teamsService.addPlayerToTeam(tid, { playerId: pid, slot })
        teamsStore.patchTeamInList(updatedTeam)
        playerStore.setPlayerTeamIdClientside(pid, tid)
        added++
      } catch (e: unknown) {
        ElMessage.error(getApiErrorMessage(e, 'Не вдалося додати гравця'))
        break
      }
    }

    if (added > 0) {
      await props.onAdded?.()
    }

    if (added === ids.length) {
      ElMessage.success(added === 1 ? 'Гравця додано до команди' : `Додано гравців: ${added}`)
      close()
    } else if (added > 0) {
      ElMessage.warning(`Додано гравців: ${added} з ${ids.length}`)
      close()
    }
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  void playerStore.getPlayers()
})
</script>
