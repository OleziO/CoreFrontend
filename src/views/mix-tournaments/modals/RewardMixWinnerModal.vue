<template>
  <el-dialog
    v-model="modelValue"
    title="Обрати переможця"
    width="500px"
    destroy-on-close
  >
    <div class="flex flex-col gap-6">
      <el-form :model="form" label-position="top">
        <el-form-item label="Команда-переможець" required>
          <el-select
            v-model="form.winnerTeamId"
            placeholder="Оберіть команду"
            class="w-full"
            size="large"
          >
            <el-option
              v-for="team in teams"
              :key="team.id"
              :label="team.team_name || `Team #${team.id}`"
              :value="team.id"
            >
              <div class="flex items-center justify-between w-full">
                <span>{{ team.team_name }}</span>
                <span class="text-xs text-gray-500">ID: {{ team.id }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="Points" required>
          <el-input
            v-model="form.points"
            type="text"
            inputmode="numeric"
            placeholder="Від"
            class="!flex-1"
            @input="onNumericInput('points')"
          />
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="flex justify-end gap-10">
        <el-button
          class="!bg-transparent !border-white/10 !text-gray-300 hover:!text-white"
          @click="modelValue = false"
        >
          Скасувати
        </el-button>

        <el-button
          type="success"
          :loading="isLoading"
          :disabled="!form.winnerTeamId"
          class="!bg-green-600 !border-green-600 hover:!bg-green-500"
          @click="submit"
        >
          Застосувати
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
const props = defineProps<{
  tournamentId: number
  participants: TMixPoolEntry[]
  teams: TMixTeam[]
}>()

const modelValue = defineModel<boolean>({ default: false })

const isLoading = ref(false)

const form = ref<{
  winnerTeamId: number | null
  points: number
}>({
  winnerTeamId: null,
  points: 100
})

const mixStore = useMixTournamentStore()

function resetForm () {
  form.value.winnerTeamId = null
  form.value.points = 100
}

function onNumericInput (key: keyof typeof form.value) {
  const value = String(form.value[key] ?? '')

  const numeric = value.replace(/\D+/g, '')

  form.value[key] = numeric === '' ? 100 : Number(numeric)
}

async function submit () {
  await mixStore.rewardMixTeam(form.value.winnerTeamId || 100, form.value.points, props.tournamentId)

  resetForm()
  modelValue.value = false
}
</script>
