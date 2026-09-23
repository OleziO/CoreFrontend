<template>
  <el-dialog
    v-model="modelValue"
    title="Test match creation"
    width="420px"
    class="test-match-dialog custom-dialog"
    destroy-on-close
    @open="resetForm"
  >
    <p class="text-xs text-gray-500 leading-snug mb-12 m-0">
      Dev only. Picks a random winner and writes the match directly to DB — no Dota API or Challonge.
      Phase: <span class="text-cyan-400 font-semibold">{{ phase }}</span>
    </p>

    <div class="flex flex-col gap-10">
      <div>
        <div class="text-xs text-gray-400 mb-4">Team A</div>
        <el-select
          v-model="teamAId"
          placeholder="Select team A"
          class="w-full"
          :disabled="loading"
        >
          <el-option
            v-for="t in teams"
            :key="t.id"
            :label="t.name"
            :value="t.id"
            :disabled="t.id === teamBId"
          />
        </el-select>
      </div>

      <div>
        <div class="text-xs text-gray-400 mb-4">Team B</div>
        <el-select
          v-model="teamBId"
          placeholder="Select team B"
          class="w-full"
          :disabled="loading"
        >
          <el-option
            v-for="t in teams"
            :key="t.id"
            :label="t.name"
            :value="t.id"
            :disabled="t.id === teamAId"
          />
        </el-select>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-10">
        <el-button :disabled="loading" @click="close">
          Cancel
        </el-button>
        <el-button type="warning" :loading="loading" @click="submit">
          Create mock match
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
const props = defineProps<{
  tournamentId: string
  phase: 'qualification' | 'playoff'
  teams: TTeam[]
  onSubmitted?: () => void
}>()

const modelValue = defineModel<boolean>({ default: false })

const teamAId = ref('')
const teamBId = ref('')
const loading = ref(false)

function resetForm () {
  teamAId.value = ''
  teamBId.value = ''
  loading.value = false
}

function close () {
  modelValue.value = false
}

function validate (): boolean {
  if (!teamAId.value || !teamBId.value) {
    ElMessage.warning('Select both teams.')
    return false
  }
  if (teamAId.value === teamBId.value) {
    ElMessage.warning('Teams must be different.')
    return false
  }
  return true
}

async function submit () {
  if (!validate()) return
  loading.value = true
  try {
    await devService.mockMatch(props.tournamentId, teamAId.value, teamBId.value, props.phase)
    ElMessage.success('Mock match created')
    props.onSubmitted?.()
    close()
  } catch (e: unknown) {
    const msg =
      typeof e === 'object' && e !== null && 'response' in e
        ? ((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed to create mock match')
        : 'Failed to create mock match'
    ElMessage.error(msg)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
:deep(.test-match-dialog.custom-dialog) {
  background-color: theme('colors.dark.card');
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}
:deep(.test-match-dialog .el-dialog__title) {
  color: white;
}
</style>
