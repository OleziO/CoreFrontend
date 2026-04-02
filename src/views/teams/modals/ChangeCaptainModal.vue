<template>
  <el-dialog
    v-model="modelValue"

    title="Передати капітанство"
    width="400px"
    destroy-on-close
  >
    <div class="flex flex-col gap-4 my-10 w-full">
      <p class="text-sm text-gray-400">
        Оберіть гравця команди для передачі капітанства:
      </p>
      <el-select-v2
        v-model="selectedPlayerId"
        :options="teamPlayers"
        placeholder="Оберіть нового капітана"
        :height="300"
      />
    </div>

    <template #footer>
      <div class="flex justify-end gap-10">
        <el-button @click="modelValue = false">
          Скасувати
        </el-button>
        <el-button
          :disabled="!selectedPlayerId"
          type="primary"
          @click="transferCaptaincy()"
        >
          Підтвердити
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">

const props = defineProps<{
  team: TTeam | undefined
  teamId: number
}>()

const modelValue = defineModel<boolean>({ default: false })

const selectedPlayerId = ref<number | null>(null)
const teamsStore = useTeamsStore()

const teamPlayers = computed(() => {
  if (!props.team?.players) return []

  // Исключаем текущего капитана из списка
  return props.team.players
    .filter(player => !player.is_cap)
    .map(player => ({
      value: player.id,
      label: player.steam_name || player.user_name || `Гравець #${player.id}`
    }))
})

async function transferCaptaincy () {
  if (!selectedPlayerId.value || !props.teamId) return

  await teamsStore.updateTeamCapitan(props.teamId, selectedPlayerId.value)

  modelValue.value = false
}
</script>
