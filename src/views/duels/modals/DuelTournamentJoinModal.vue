<template>
  <el-dialog
    v-model="modelValue"
    align-center
    class="duel-tournament-dialog"
    width="420"
    destroy-on-close
  >
    <template #header>
      <div class="flex min-w-0 flex-col gap-4">
        <span class="sys-label">// Вхід у турнір</span>
        <h2 class="duel-tournament-dialog__title">{{ tournament.name }}</h2>
      </div>
    </template>

    <form class="flex flex-col gap-12" @submit.prevent="submit">
      <p class="duel-tournament-dialog__text">
        Введіть пароль, який дав організатор. Після входу кнопка «Шукати в турнірі» підбере суперника
        серед учасників — з таблицею турніру, окремою від загального рейтингу.
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
      <el-button type="primary" :loading="joining" :disabled="!password.trim()" @click="submit">
        Увійти
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { duelsService } from '@/views/duels/duels.service'
import { DUEL_TOURNAMENT_PASSWORD_MAX } from '@/views/duels/duels.utils'
import type { TDuelTournament } from '@/api/types/api.types'

const props = defineProps<{
  tournament: TDuelTournament
  onJoined?: (tournament: TDuelTournament) => void
}>()

const modelValue = defineModel<boolean>({ default: false })

const password = ref('')
const joining = ref(false)
const inputRef = ref<{ focus: () => void } | null>(null)

/** Модалку монтують уже відкритою — `@open` у el-dialog тоді не спрацьовує, тож скидаємо поле за `modelValue`. */
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
    const joined = await duelsService.joinTournament(props.tournament.id, value)
    props.onJoined?.(joined)
    modelValue.value = false
  } catch {
    // тост уже показав duelsService (невірний пароль, ліміт спроб, турнір завершено)
  } finally {
    joining.value = false
  }
}
</script>

<!-- Not scoped: el-dialog is teleported to <body>. -->
<style lang="scss">
.el-dialog.duel-tournament-dialog {
  margin: 0 auto;
  max-width: calc(100vw - 32px);
  background: rgba(16, 19, 36, 0.62);
  backdrop-filter: blur(24px) saturate(130%);
  -webkit-backdrop-filter: blur(24px) saturate(130%);

  .duel-tournament-dialog__title {
    font-family: var(--ds-font-display);
    font-size: 20px;
    line-height: 1.2;
    color: var(--ds-text-strong);
  }

  .duel-tournament-dialog__text {
    font-size: 13px;
    line-height: 1.5;
    color: var(--ds-text-muted);
  }
}
</style>
