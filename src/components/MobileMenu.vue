<template>
  <transition name="mobile-menu">
    <div
      v-if="togglerStore.showMobileMenu"
      class="mobile-menu-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Меню"
      @click.self="close"
    >
      <nav
        ref="panelRef"
        class="mobile-menu-panel"
        @keydown="onPanelKeydown"
      >
        <div class="flex w-full items-center justify-between">
          <span class="text-caption uppercase tracking-wide text-white/40">Меню</span>
          <button
            type="button"
            class="mobile-menu-close"
            aria-label="Закрити меню"
            @click="close"
          >
            <PhX :size="20" />
          </button>
        </div>

        <RouterLink
          v-if="authStore.token"
          :to="{ name: routeNames.profile }"
          class="mobile-menu-link no-underline"
          @click="close"
        >
          <PhUser :size="20" />
          <span>Профіль</span>
        </RouterLink>

        <RoleGuard :roles="['admin', 'moderator']">
          <RouterLink
            class="mobile-menu-link no-underline"
            :to="{ name: routeNames.adminPanel }"
            @click="close"
          >
            <PhGauge :size="20" />
            <span>Адмінка</span>
          </RouterLink>
        </RoleGuard>

        <RoleGuard :roles="['admin', 'moderator']">
          <RouterLink
            class="mobile-menu-link no-underline"
            :to="{ name: routeNames.financeMonitor }"
            @click="close"
          >
            <PhCurrencyCircleDollar :size="20" />
            <span>Фінанси</span>
          </RouterLink>
        </RoleGuard>

        <div class="mobile-menu-socials">
          <a
            v-for="social in socialLinks"
            :key="social.name"
            :href="social.url"
            target="_blank"
            rel="noopener noreferrer"
            class="mobile-menu-social"
            :title="social.name"
            :aria-label="social.name"
          >
            <Icon :name="social.icon" :size="20" />
          </a>
        </div>

        <el-button
          v-if="!authStore.token"
          type="primary"
          class="w-full"
          :loading="authStore.loginLoading"
          @click="handleDiscordLogin"
        >
          <PhDiscordLogo size="20" weight="bold" class="mr-8" />
          Увійти через Discord
        </el-button>
        <button
          v-else
          type="button"
          class="mobile-menu-link mobile-menu-link--danger"
          @click="handleLogout"
        >
          <PhSignOut :size="20" />
          <span>Вийти з аккаунту</span>
        </button>
      </nav>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { routeNames } from '@/router/route-names'
import RoleGuard from '@/guards/RoleGuard.vue'
import Icon, { type TIconName } from '@/components/Icon.vue'
import { PhDiscordLogo, PhUser, PhGauge, PhCurrencyCircleDollar, PhSignOut, PhX } from '@phosphor-icons/vue'

const togglerStore = useTogglerStore()
const authStore = useAuthStore()

const panelRef = ref<HTMLElement | null>(null)
let previouslyFocused: HTMLElement | null = null

const socialLinks: Array<{ name: string; url: string; icon: TIconName }> = [
  { name: 'YouTube', url: 'https://www.youtube.com/@Core_League', icon: 'youtube' },
  { name: 'Telegram', url: 'https://t.me/s/core_league', icon: 'telegram' },
  { name: 'Discord', url: 'https://discord.gg/QeDj9TjmgM', icon: 'discord' },
  { name: 'Instagram', url: 'https://www.instagram.com/core__league/', icon: 'instagram' },
  { name: 'TikTok', url: 'https://www.tiktok.com/@core_league_dota2', icon: 'tiktok' },
  { name: 'Twitch', url: 'https://www.twitch.tv/core_league', icon: 'twitch' }
]

function getFocusable (): HTMLElement[] {
  if (!panelRef.value) return []
  return Array.from(
    panelRef.value.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  )
}

function onPanelKeydown (event: KeyboardEvent) {
  if (event.key !== 'Tab') return
  const focusable = getFocusable()
  if (focusable.length === 0) return

  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  const active = document.activeElement as HTMLElement | null

  if (event.shiftKey && active === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(
  () => togglerStore.showMobileMenu,
  async (open) => {
    if (open) {
      previouslyFocused = document.activeElement as HTMLElement | null
      await nextTick()
      getFocusable()[0]?.focus()
    } else {
      previouslyFocused?.focus()
      previouslyFocused = null
    }
  }
)

onKeyStroke('Escape', () => {
  if (togglerStore.showMobileMenu) close()
})

function close () {
  togglerStore.showMobileMenu = false
}

function handleDiscordLogin () {
  close()
  authStore.startDiscordLogin()
}

function handleLogout () {
  close()
  authStore.logout()
}
</script>

<style scoped>
.mobile-menu-overlay {
  @apply
    fixed inset-0 z-[60]
    bg-black/50
    backdrop-blur-xl
    flex items-center justify-center;
}

.mobile-menu-panel {
  @apply
    w-full max-w-[340px]
    mx-20
    rounded-3xl
    border border-white/15
    bg-surface/80
    backdrop-blur-2xl
    shadow-elevation-4
    flex flex-col items-stretch gap-12
    py-24 px-20;
}

.mobile-menu-close {
  @apply
    inline-flex items-center justify-center
    size-36 rounded-full
    border border-white/10 bg-white/5 text-white/70
    cursor-pointer transition-colors duration-200
    hover:text-white hover:bg-white/10;
}

.mobile-menu-link {
  @apply
    box-border flex w-full items-center gap-12 cursor-pointer
    rounded-xl border border-white/10 bg-white/5
    px-16 py-12 no-underline
    text-base font-medium text-white
    transition-colors duration-200 ease-out
    hover:text-primary hover:border-primary/40;
}

.mobile-menu-link--danger {
  @apply text-error hover:text-error hover:border-error/40;
}

.mobile-menu-socials {
  @apply flex items-center justify-between gap-8 py-4;
}

.mobile-menu-social {
  @apply
    inline-flex items-center justify-center
    size-40 rounded-xl
    text-white/70
    transition-colors duration-200
    hover:text-white hover:bg-white/10;
}

.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: opacity 0.25s ease;
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
}
</style>
