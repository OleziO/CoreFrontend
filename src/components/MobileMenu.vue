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

        <!-- Акаунт: профіль і друзі — лише для авторизованих -->
        <RouterLink
          v-if="authStore.token"
          :to="{ name: routeNames.profile }"
          class="mobile-menu-link no-underline"
          :class="{ 'mobile-menu-link--active': isActive(routeNames.profile) }"
          :aria-current="isActive(routeNames.profile) ? 'page' : undefined"
          @click="close"
        >
          <PhUser :size="20" />
          <span>Профіль</span>
        </RouterLink>

        <RouterLink
          v-if="authStore.token"
          :to="{ name: routeNames.friends }"
          class="mobile-menu-link no-underline"
          :class="{ 'mobile-menu-link--active': isActive(routeNames.friends) }"
          :aria-current="isActive(routeNames.friends) ? 'page' : undefined"
          @click="close"
        >
          <PhUserPlus :size="20" />
          <span>Друзі</span>
        </RouterLink>

        <!-- Розділи, яких немає в нижньому таббарі (там лише Головна, Турніри, Команди, Лідери) -->
        <RouterLink
          :to="{ name: routeNames.players }"
          class="mobile-menu-link no-underline"
          :class="{ 'mobile-menu-link--active': isActive(routeNames.players, routeNames.player) }"
          :aria-current="isActive(routeNames.players, routeNames.player) ? 'page' : undefined"
          @click="close"
        >
          <PhUsersThree :size="20" />
          <span>Гравці</span>
        </RouterLink>

        <RouterLink
          v-if="authStore.token"
          :to="{ name: routeNames.find }"
          class="mobile-menu-link no-underline"
          :class="{ 'mobile-menu-link--active': isActive(routeNames.find) }"
          :aria-current="isActive(routeNames.find) ? 'page' : undefined"
          @click="close"
        >
          <PhBinoculars :size="20" />
          <span>Пошук команди</span>
        </RouterLink>

        <RouterLink
          :to="{ name: routeNames.duels }"
          class="mobile-menu-link no-underline"
          :class="{ 'mobile-menu-link--active': isActive(routeNames.duels) }"
          :aria-current="isActive(routeNames.duels) ? 'page' : undefined"
          @click="close"
        >
          <PhSword :size="20" />
          <span>Дуелі</span>
        </RouterLink>

        <!-- Медіа-турніри: виділений пункт у фіолетовому Twitch -->
        <RouterLink
          :to="{ name: routeNames.mediaDuels }"
          class="mobile-menu-link mobile-menu-link--media no-underline"
          :class="{ 'mobile-menu-link--active': isMediaActive }"
          :aria-current="isMediaActive ? 'page' : undefined"
          @click="close"
        >
          <PhTwitchLogo :size="20" weight="fill" />
          <span>Медіа-турніри</span>
          <span class="mobile-menu-link__tag">1v1 · 5v5</span>
        </RouterLink>

        <RouterLink
          v-if="hasAdminUaRole"
          class="mobile-menu-link no-underline"
          :class="{ 'mobile-menu-link--active': isActive(routeNames.adminPanel) }"
          :aria-current="isActive(routeNames.adminPanel) ? 'page' : undefined"
          :to="{ name: routeNames.adminPanel }"
          @click="close"
        >
          <PhGauge :size="20" />
          <span>Адмінка</span>
        </RouterLink>

        <RouterLink
          v-if="hasAdminUaRole"
          class="mobile-menu-link no-underline"
          :class="{ 'mobile-menu-link--active': isActive(routeNames.analytics) }"
          :aria-current="isActive(routeNames.analytics) ? 'page' : undefined"
          :to="{ name: routeNames.analytics }"
          @click="close"
        >
          <PhChartLineUp :size="20" />
          <span>Аналітика</span>
        </RouterLink>

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

        <!-- Документи — статичні сторінки поза SPA, тож звичайні посилання з повним переходом.
             Реквізити продавця й картки — у юридичному блоці наприкінці кожної сторінки -->
        <nav class="mobile-menu-legal" aria-label="Документи">
          <a
            v-for="slug in LEGAL_PAGE_SLUGS"
            :key="slug"
            :href="legalPageHref(slug)"
            class="mobile-menu-legal__link no-underline"
            @click="close"
          >
            {{ LEGAL_PAGE_LABELS.uk[slug] }}
          </a>
        </nav>
      </nav>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { routeNames } from '@/router/route-names'
import Icon, { type TIconName } from '@/components/Icon.vue'
import {
  PhDiscordLogo, PhUser, PhUserPlus, PhUsersThree, PhChartLineUp, PhGauge, PhSignOut, PhSword, PhX, PhBinoculars,
  PhTwitchLogo
} from '@phosphor-icons/vue'
import { hasAdminRole } from '@/core/helpers'
import { LEGAL_PAGE_LABELS, LEGAL_PAGE_SLUGS, legalPageHref } from '@/config/legal-pages'

const togglerStore = useTogglerStore()
const authStore = useAuthStore()
const route = useRoute()

/** Поточний розділ у меню: сам роут або його сторінка деталей (напр. «Гравці» → гравець). */
function isActive (...names: string[]): boolean {
  return names.includes(String(route.name))
}

/** Медіа-турніри: обидві вкладки хабу й сторінка турніру. */
const isMediaActive = computed(() => isActive(routeNames.mediaDuels, routeNames.mediaTeams, routeNames.mediaBracket))

/** Єдиний предикат адмінського доступу — за прапором `isAdminRole`, спільний із гардом /finance. */
const hasAdminUaRole = computed(() => hasAdminRole(authStore.user?.roles))

const panelRef = ref<HTMLElement | null>(null)
let previouslyFocused: HTMLElement | null = null

const socialLinks: Array<{ name: string; url: string; icon: TIconName }> = [
  { name: 'YouTube', url: 'https://www.youtube.com/@Core_League', icon: 'youtube' },
  { name: 'Telegram', url: 'https://t.me/core_league_lviv', icon: 'telegram' },
  { name: 'Discord', url: 'https://discord.gg/QeDj9TjmgM', icon: 'discord' },
  { name: 'Instagram', url: 'https://www.instagram.com/core_league_lviv/', icon: 'instagram' },
  { name: 'TikTok', url: 'https://www.tiktok.com/@core_league_lviv', icon: 'tiktok' },
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
    relative
    w-full max-w-[340px]
    mx-20
    rounded-3xl
    border
    bg-surface/85
    backdrop-blur-2xl
    flex flex-col items-stretch gap-12
    py-24 px-20;
  /* Сім посилань на документи внизу: на низьких екранах панель прокручується, а не обрізається. */
  max-height: calc(100dvh - 32px);
  overflow-y: auto;
  border-color: var(--ds-border-strong);
  box-shadow: var(--ds-elevation-4), var(--ds-glow-primary-soft);
}

/* Neon top light on the panel. */
.mobile-menu-panel::before {
  content: '';
  position: absolute;
  inset: 0 16px auto 16px;
  height: 1px;
  pointer-events: none;
  background: linear-gradient(90deg, transparent 0%, rgba(46, 229, 255, 0.7) 50%, transparent 100%);
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
    rounded-xl border bg-white/5
    px-16 py-12 no-underline
    text-base font-medium text-white
    transition-colors duration-200 ease-out
    hover:text-primary hover:border-primary/40;
  border-color: var(--ds-border);
}

.mobile-menu-link--active {
  @apply text-primary border-primary/40;
  background-color: rgba(46, 229, 255, 0.08);
}

.mobile-menu-link--media {
  color: rgb(205, 180, 255);
  border-color: rgba(145, 70, 255, 0.55);
  background: linear-gradient(120deg, rgba(145, 70, 255, 0.22), rgba(145, 70, 255, 0.06));
  box-shadow: 0 0 14px rgba(145, 70, 255, 0.2);
}

.mobile-menu-link--media:hover,
.mobile-menu-link--media.mobile-menu-link--active {
  color: #fff;
  border-color: rgba(145, 70, 255, 0.9);
  background: linear-gradient(120deg, rgba(145, 70, 255, 0.45), rgba(145, 70, 255, 0.15));
}

.mobile-menu-link__tag {
  margin-left: auto;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  letter-spacing: 0.14em;
  color: rgba(255, 255, 255, 0.55);
}

.mobile-menu-link--danger {
  @apply text-error hover:text-error hover:border-error/40;
}

.mobile-menu-legal {
  @apply flex flex-wrap justify-center gap-x-12;
}

.mobile-menu-legal__link {
  @apply
    inline-flex min-h-32 items-center
    text-caption text-white/45
    transition-colors duration-200
    hover:text-primary;
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
