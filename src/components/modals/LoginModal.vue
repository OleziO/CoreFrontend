<template>
  <el-dialog
    v-model="modelValue"
    align-center
    class="login-dialog"
    width="440"
    :show-close="false"
    destroy-on-close
  >
    <template #header>
      <div class="login-dialog__head">
        <div class="flex min-w-0 flex-col gap-4">
          <span class="sys-label">// Доступ</span>
          <h2 class="login-dialog__title">Потрібен вхід</h2>
        </div>
        <button type="button" class="login-dialog__close" aria-label="Закрити" @click="close">
          <PhX :size="16" weight="bold" />
        </button>
      </div>
    </template>

    <div class="login-dialog__body">
      <div class="login-dialog__icon" aria-hidden="true">
        <PhLockKey :size="28" weight="duotone" />
      </div>

      <p class="login-dialog__text">
        Ця сторінка доступна лише авторизованим гравцям.
        Увійдіть через Discord, щоб продовжити.
      </p>

      <p v-if="authStore.loginError" class="login-dialog__error" role="alert">
        <PhWarningCircle :size="14" weight="bold" class="shrink-0" />
        <span>{{ authStore.loginError }}</span>
      </p>
    </div>

    <template #footer>
      <div class="login-dialog__foot">
        <el-button size="large" @click="close">
          Закрити
        </el-button>
        <el-button
          type="primary"
          size="large"
          class="login-dialog__cta"
          :loading="authStore.loginLoading"
          @click="login"
        >
          <PhDiscordLogo :size="20" weight="bold" />
          <span class="ml-10 font-medium">Увійти через Discord</span>
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { PhDiscordLogo, PhLockKey, PhWarningCircle, PhX } from '@phosphor-icons/vue'

const props = defineProps<{
  /** Куди повернути після успішного входу (fullPath приватного маршруту). */
  redirectTo?: string
}>()

const modelValue = defineModel<boolean>({ default: false })

const authStore = useAuthStore()

function close () {
  modelValue.value = false
}

function login () {
  if (props.redirectTo) authService.savePostLoginRedirect(props.redirectTo)
  authStore.startDiscordLogin()
}

// Якщо токен з'явився (напр. через /login-success в іншій вкладці) — модалка вже не потрібна.
watch(() => authStore.token, (token) => {
  if (token) close()
})
</script>

<!-- Not scoped: el-dialog is teleported to <body>. The unique `.login-dialog`
     class keeps these rules confined to this modal only. -->
<style lang="scss">
.el-dialog.login-dialog {
  margin: 0 auto;
  background: rgba(16, 19, 36, 0.62);
  backdrop-filter: blur(24px) saturate(130%);
  -webkit-backdrop-filter: blur(24px) saturate(130%);

  .el-dialog__header {
    border-bottom: 1px solid rgba(var(--ds-primary-rgb), 0.12);
  }

  .el-dialog__footer {
    border-top: 1px solid rgba(var(--ds-primary-rgb), 0.12);
  }

  .login-dialog__close:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.6) !important;
    outline-offset: 2px;
  }
}

.login-dialog__head {
  @apply flex items-start justify-between gap-12;
}

.login-dialog__title {
  @apply m-0 truncate font-display text-xl uppercase leading-none tracking-wide text-white;
}

.login-dialog__close {
  @apply inline-flex size-28 items-center justify-center rounded-md border-0 bg-transparent p-0 text-white/55;
  transition: color var(--ds-duration-fast) ease, background-color var(--ds-duration-fast) ease;
}

.login-dialog__body {
  @apply flex flex-col items-center gap-14 text-center;
}

.login-dialog__icon {
  @apply inline-flex size-56 items-center justify-center rounded-xl border;
  color: var(--ds-primary);
  border-color: rgba(var(--ds-primary-rgb), 0.28);
  background:
    repeating-linear-gradient(-45deg, rgba(var(--ds-primary-rgb), 0.05) 0 1px, transparent 1px 10px),
    rgba(7, 8, 15, 0.45);
  box-shadow: 0 0 24px rgba(var(--ds-primary-rgb), 0.18);
}

.login-dialog__text {
  @apply m-0 max-w-[320px] text-sm leading-relaxed text-white/70;
}

.login-dialog__error {
  @apply m-0 inline-flex items-center gap-6 text-xs;
  color: var(--el-color-danger);
}

.login-dialog__foot {
  @apply flex flex-wrap items-center justify-end gap-10;

  .el-button > span {
    @apply inline-flex items-center;
  }
}

@media (hover: hover) and (pointer: fine) {
  .login-dialog__close:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.08);
  }
}
</style>
