<template>
  <el-dialog
    v-model="modelValue"
    title="Запросити гравця"
    width="420px"
    destroy-on-close
    @closed="reset"
  >
    <div class="flex flex-col gap-16 my-10">
      <div>
        <p class="text-sm text-gray-400 mb-8">Роль у команді</p>
        <el-select v-model="selectedSlot" class="w-full">
          <el-option value="main" label="Основний гравець" />
          <el-option value="reserved" label="Запасний гравець" />
          <el-option value="coach" label="Тренер" />
        </el-select>
      </div>

      <template v-if="inviteLink">
        <div>
          <p class="text-sm text-gray-400 mb-8">Посилання для запрошення</p>
          <div class="flex gap-8">
            <el-input
              :model-value="inviteLink"
              readonly
              class="flex-1 font-mono text-xs"
            />
            <el-button :icon="copyIcon" @click="copyLink">
              {{ copied ? 'Скопійовано!' : 'Копіювати' }}
            </el-button>
          </div>
          <p class="text-xs text-gray-500 mt-8">
            Дійсне до {{ expiresAtFormatted }}. Одноразове — після переходу за посиланням воно стане недійсним.
          </p>
        </div>
      </template>
    </div>

    <template #footer>
      <div class="flex justify-end gap-10">
        <el-button @click="modelValue = false">
          Закрити
        </el-button>
        <el-button
          type="primary"
          :loading="loading"
          :disabled="!!inviteLink"
          @click="generate"
        >
          Згенерувати посилання
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { PhCopy } from '@phosphor-icons/vue'
import { useClipboard } from '@vueuse/core'
import { invitesService } from '@/views/invites/invites.service'

const props = defineProps<{
  teamId: string
  slot?: 'main' | 'reserved' | 'coach'
}>()

const modelValue = defineModel<boolean>({ default: false })

const selectedSlot = ref<'main' | 'reserved' | 'coach'>(props.slot ?? 'main')
const loading = ref(false)
const inviteLink = ref<string | null>(null)
const expiresAt = ref<string | null>(null)

const copyIcon = PhCopy

const { copy, copied } = useClipboard({ legacy: true })

const expiresAtFormatted = computed(() => {
  if (!expiresAt.value) return ''
  return new Date(expiresAt.value).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

async function generate () {
  if (!props.teamId) return
  loading.value = true
  try {
    const result = await invitesService.createTeamInvite(props.teamId, selectedSlot.value)
    inviteLink.value = `${window.location.origin}/invites/${result.token}`
    expiresAt.value = result.expiresAt
  } catch {
    ElMessage.error('Не вдалося створити запрошення')
  } finally {
    loading.value = false
  }
}

function copyLink () {
  if (inviteLink.value) copy(inviteLink.value)
}

function reset () {
  inviteLink.value = null
  expiresAt.value = null
  selectedSlot.value = props.slot ?? 'main'
}
</script>
