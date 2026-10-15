<template>
  <el-dialog
    v-model="modelValue"
    align-center
    class="media-dialog"
    width="420"
    destroy-on-close
  >
    <template #header>
      <div class="flex min-w-0 flex-col gap-4">
        <span class="media-dialog__eyebrow">
          <PhKey :size="12" weight="bold" aria-hidden="true" />
          // Реєстрація за паролем
        </span>
        <h2 class="media-dialog__title">{{ bracket.name }}</h2>
      </div>
    </template>

    <form class="flex flex-col gap-12" @submit.prevent="submit">
      <p class="media-dialog__text">
        Пароль називає стрімер на трансляції. Після реєстрації чекайте старту: бот сам запросить вас у лобі.
      </p>
      <el-input
        ref="inputRef"
        v-model="password"
        :maxlength="DUEL_TOURNAMENT_PASSWORD_MAX"
        placeholder="Пароль турніру"
        autocomplete="off"
        @keyup.enter="submit"
      />
    </form>

    <template #footer>
      <el-button @click="modelValue = false">Скасувати</el-button>
      <el-button
        type="primary"
        class="media-dialog__primary"
        :loading="joining"
        :disabled="!password.trim()"
        @click="submit"
      >
        Зареєструватися
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { PhKey } from '@phosphor-icons/vue'
import { DUEL_TOURNAMENT_PASSWORD_MAX } from '@/views/duels/duels.utils'
import { duelBracketsService } from '@/views/media/media.service'
import type { TDuelBracket } from '@/api/types/api.types'

const props = defineProps<{
  bracket: TDuelBracket
  onJoined?: (bracket: TDuelBracket) => void
}>()

const modelValue = defineModel<boolean>({ default: false })

const password = ref('')
const joining = ref(false)
const inputRef = ref<{ focus: () => void } | null>(null)

watch(modelValue, (open) => {
  if (!open) return
  password.value = ''
  nextTick(() => inputRef.value?.focus())
}, { immediate: true })

async function submit () {
  const value = password.value.trim()
  if (!value || joining.value) return
  joining.value = true
  try {
    props.onJoined?.(await duelBracketsService.join(props.bracket.id, value))
    modelValue.value = false
  } catch {
    // тост уже показав сервіс (невірний пароль, ліміт спроб, місць немає)
  } finally {
    joining.value = false
  }
}
</script>

<style lang="scss" src="./media-dialog.scss"></style>
