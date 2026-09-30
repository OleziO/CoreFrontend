<template>
  <header class="app-header sticky left-0 top-0 z-50 w-full">
    <!-- ─── Bar ────────────────────────────────────────────────────────────
         Three true columns on lg+ (logo | HUD readout | user), so the readout
         is centred on the viewport instead of between two unequal sides.
         Below lg the side columns collapse and the logo is centred alone. -->
    <div
      class="
        app-header__bar
        relative grid h-60 w-full items-center justify-items-center
        px-20 lg:px-40
        lg:grid-cols-[1fr_auto_1fr]
      "
    >
      <!-- LOGO -->
      <RouterLink
        :to="{ name: routeNames.rootPage }"
        class="app-header__logo flex h-full max-w-[130px] items-center lg:justify-self-start"
        aria-label="Core League — головна"
      >
        <el-image
          class="h-full select-none"
          fit="contain"
          :src="logo"
          alt="Core League"
        />
      </RouterLink>

      <!-- HUD READOUT — decorative system strip, desktop only -->
      <div
        class="app-header__hud hud-corners hud-corners--fade hidden lg:flex"
        aria-hidden="true"
      >
        <span class="app-header__seg app-header__seg--sys">
          <span class="app-header__dot" />
          SYS://CORE LEAGUE
        </span>

        <span class="app-header__tick" />

        <span class="app-header__seg app-header__seg--muted">DOTA 2</span>

        <span class="app-header__tick app-header__tick--clock" />

        <span class="app-header__seg app-header__seg--clock">
          <PhClock :size="11" weight="bold" class="shrink-0" />
          KYIV
          <span class="app-header__time">
            {{ kyivTime.hm }}<span class="app-header__time-sec">:{{ kyivTime.s }}</span>
          </span>
        </span>
      </div>

      <!-- RIGHT SIDE. Дзвіночок видно на всіх екранах (на мобільному — абсолютно
           праворуч у смузі); пігулка користувача та кнопка входу — лише на lg+. -->
      <div class="app-header__actions flex items-center gap-10 lg:justify-self-end">
        <!-- NOTIFICATIONS -->
        <NotificationCenter v-if="authStore.token" />

        <!-- USER -->
        <el-dropdown
          v-if="authStore.token"
          trigger="click"
          placement="bottom-end"
          popper-class="header-dropdown"
          class="hidden lg:flex"
          @visible-change="onMenuVisibleChange"
        >
          <div
            role="button"
            tabindex="0"
            aria-haspopup="menu"
            :aria-expanded="menuOpen"
            :aria-label="userMenuLabel"
            class="app-header__user"
            :class="{ 'is-open': menuOpen }"
          >
            <span class="app-header__identity">
              <span class="app-header__name">{{ authStore.user?.discordName }}</span>
              <span v-if="roleLine" class="app-header__role">{{ roleLine }}</span>
            </span>

            <span class="app-header__avatar">
              <el-image
                class="size-full"
                :src="authStore.user?.avatarUrl ?? ''"
                fit="cover"
              />
            </span>

            <PhCaretDown :size="12" weight="bold" class="app-header__caret shrink-0" />
          </div>

          <template #dropdown>
            <el-dropdown-menu>
              <!-- Identity plate: who is signed in + live rating -->
              <li class="header-menu__identity" role="presentation">
                <span class="header-menu__identity-avatar">
                  <el-image
                    class="size-full"
                    :src="authStore.user?.avatarUrl ?? ''"
                    fit="cover"
                  />
                </span>
                <span class="header-menu__identity-text">
                  <span class="header-menu__identity-name">{{ authStore.user?.discordName }}</span>
                  <span class="header-menu__identity-meta">{{ identityMeta }}</span>
                </span>
                <span v-if="ratingLabel" class="header-menu__identity-mmr">
                  {{ ratingLabel }}
                  <small>MMR</small>
                </span>
              </li>

              <el-dropdown-item
                :class="{
                  'header-user-menu__item--active': route.name === routeNames.profile
                }"
              >
                <RouterLink
                  :to="{ name: routeNames.profile }"
                  active-class=""
                  exact-active-class=""
                  class="flex w-full items-center gap-10 no-underline text-inherit"
                >
                  <span class="header-menu__icon"><PhUser :size="16" weight="bold" /></span>
                  <span>Профіль</span>
                </RouterLink>
              </el-dropdown-item>

              <el-dropdown-item
                :class="{
                  'header-user-menu__item--active': route.name === routeNames.duels
                }"
              >
                <RouterLink
                  :to="{ name: routeNames.duels }"
                  active-class=""
                  exact-active-class=""
                  class="flex w-full items-center gap-10 no-underline text-inherit"
                >
                  <span class="header-menu__icon"><PhSword :size="16" weight="bold" /></span>
                  <span>Дуелі</span>
                </RouterLink>
              </el-dropdown-item>

              <li v-if="hasAdminUaRole" class="header-menu__section" role="presentation">
                // Адміністрування
              </li>

              <el-dropdown-item
                v-if="hasAdminUaRole"
                :class="{
                  'header-user-menu__item--active': route.name === routeNames.adminPanel
                }"
                @click="router.push({ name: routeNames.adminPanel })"
              >
                <span class="header-menu__icon"><PhGauge :size="16" weight="bold" /></span>
                <span>Адмінка</span>
              </el-dropdown-item>

              <el-dropdown-item
                v-if="hasAdminUaRole"
                :class="{
                  'header-user-menu__item--active': route.name === routeNames.analytics
                }"
                @click="router.push({ name: routeNames.analytics })"
              >
                <span class="header-menu__icon"><PhChartLineUp :size="16" weight="bold" /></span>
                <span>Аналітика</span>
              </el-dropdown-item>

              <el-dropdown-item
                v-if="hasAdminUaRole"
                @click.stop="showCreateTournamentDrawer = true"
              >
                <span class="header-menu__icon"><PhTrophy :size="16" weight="bold" /></span>
                <span>Створити турнір</span>
              </el-dropdown-item>

              <li class="header-menu__divider" role="separator" />

              <el-dropdown-item
                class="header-user-menu__item--danger"
                @click="authStore.logout"
              >
                <span class="header-menu__icon"><PhSignOut :size="16" weight="bold" /></span>
                <span>Вийти з аккаунту</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <!-- LOGIN -->
        <el-button
          v-else
          type="primary"
          class="!hidden items-center justify-center lg:!flex"
          :loading="authStore.loginLoading"
          @click="authStore.startDiscordLogin()"
        >
          <PhDiscordLogo size="20" weight="bold" />
          <span class="ml-10 text-sm font-medium">
            Увійти через Discord
          </span>
        </el-button>
      </div>
    </div>

    <!-- ─── Bottom edge ────────────────────────────────────────────────────
         Ruler ticks fading in from the sides, the cyan → pink hairline, and a
         slow light sweep travelling along it. Purely decorative. -->
    <span class="app-header__edge" aria-hidden="true">
      <span class="app-header__ruler" />
      <span class="hud-line hud-line--pink app-header__line" />
      <span class="app-header__sweep" />
    </span>
  </header>

  <CreateTournamentDrawer
    v-if="authStore.token && hasAdminUaRole"
    v-model="showCreateTournamentDrawer"
  />
</template>

<script setup lang="ts">
import { routeNames } from '@/router/route-names'
import logo from '@/assets/images/core-league-logo-full.png'
import {
  PhDiscordLogo, PhSignOut, PhUser, PhTrophy, PhCaretDown, PhGauge, PhChartLineUp, PhClock, PhSword
} from '@phosphor-icons/vue'
import CreateTournamentDrawer from '@/views/admin-panel/components/drawers/CreateTournamentDrawer.vue'
import NotificationCenter from '@/components/NotificationCenter.vue'
import { hasAdminRole } from '@/core/helpers'
import { roleLabelMap } from '@/components/player-tags/player.enums'

const authStore = useAuthStore()
const showCreateTournamentDrawer = ref(false)
const menuOpen = ref(false)

/** Єдиний предикат адмінського доступу — спільний із гардом роуту /finance. */
const hasAdminUaRole = computed(() => hasAdminRole(authStore.user?.roles))

const userMenuLabel = computed(
  () => `Меню користувача: ${authStore.user?.discordName ?? ''}`
)

/**
 * Другий рядок пігулки: до двох ролей українською. `role.name` з API може бути
 * і слагом (`admin`), і вже готовою підписом («Адмін») — мапа покриває перший
 * випадок, інакше показуємо як є.
 */
const roleLine = computed(() => {
  const labels = roleLabelMap as Record<string, string>
  const names = (authStore.user?.roles ?? [])
    .map(r => labels[r.name] ?? r.name)
    .filter(Boolean)
  return names.slice(0, 2).join(' · ')
})

/** Другий рядок плашки в меню: Discord-логін, а без нього — ролі. */
const identityMeta = computed(() => {
  const username = authStore.user?.discordUsername
  return username ? `@${username}` : roleLine.value
})

const ratingFormat = new Intl.NumberFormat('uk-UA')
const ratingLabel = computed(() => {
  const rating = authStore.user?.rating
  return typeof rating === 'number' ? ratingFormat.format(rating) : ''
})

// ─── HUD clock — Kyiv time, ticks once a second ─────────────────────────────
const now = useNow({ interval: 1000 })
const kyivFormatter = new Intl.DateTimeFormat('uk-UA', {
  timeZone: 'Europe/Kyiv',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
})

const kyivTime = computed(() => {
  const [h = '00', m = '00', s = '00'] = kyivFormatter.format(now.value).split(':')
  return { hm: `${h}:${m}`, s }
})

function onMenuVisibleChange (visible: boolean) {
  menuOpen.value = visible
}

const route = useRoute()
const router = useRouter()
</script>

<style scoped>
/* ─── Shell ──────────────────────────────────────────────────────────────── */
/* Dark glass with two soft lamps behind the ends of the bar: cyan under the
   logo, pink under the user menu — the same order as the hairline gradient. */
.app-header {
  isolation: isolate;
  background:
    radial-gradient(ellipse 340px 130px at 0% 60%, rgba(var(--ds-primary-rgb), 0.11), transparent 70%),
    radial-gradient(ellipse 280px 110px at 100% 60%, rgba(var(--ds-pink-rgb), 0.07), transparent 70%),
    linear-gradient(180deg, rgba(13, 15, 28, 0.92) 0%, rgba(7, 8, 15, 0.84) 100%);
  backdrop-filter: blur(20px) saturate(130%);
  -webkit-backdrop-filter: blur(20px) saturate(130%);
  box-shadow: var(--ds-elevation-3);
}

/* ─── Actions — нижче lg лише дзвіночок, притиснутий до правого краю смуги ── */
.app-header__actions {
  position: absolute;
  top: 0;
  right: 20px;
  height: 60px;
}

@media (min-width: 1024px) {
  .app-header__actions {
    position: static;
    height: auto;
  }
}

/* ─── Logo — the header's one lit element ────────────────────────────────── */
.app-header__logo {
  filter: drop-shadow(0 0 12px rgba(var(--ds-primary-rgb), 0.35));
  transition: filter var(--ds-duration-base) ease;
}

.app-header__logo:focus-visible {
  outline: 2px solid rgba(var(--ds-primary-rgb), 0.6);
  outline-offset: 4px;
  border-radius: 6px;
}

/* ─── HUD readout ────────────────────────────────────────────────────────── */
.app-header__hud {
  --hud-corner-size: 8px;
  --hud-corner-inset: 0px;
  --hud-corner-color: rgba(var(--ds-primary-rgb), 0.55);

  align-items: center;
  gap: 14px;
  height: 30px;
  padding: 0 16px;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.22em;
  line-height: 1;
  text-transform: uppercase;
  white-space: nowrap;
}

.app-header__seg {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--ds-text-muted);
}

.app-header__seg--sys {
  color: var(--ds-primary);
  text-shadow: var(--ds-neon-text-subtle);
}

.app-header__seg--muted {
  color: var(--ds-text-faint);
}

/* The clock only fits once the side columns have room (≥ xl); between lg and
   xl the readout stops after "DOTA 2" so it never crowds the user pill. */
.app-header__seg--clock,
.app-header__tick--clock {
  display: none;
}

.app-header__seg--clock {
  color: var(--ds-text-faint);
}

@media (min-width: 1280px) {
  .app-header__seg--clock {
    display: inline-flex;
  }

  .app-header__tick--clock {
    display: block;
  }
}

.app-header__time {
  color: var(--ds-text-muted);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.12em;
}

.app-header__time-sec {
  opacity: 0.5;
}

.app-header__tick {
  width: 1px;
  height: 12px;
  background: rgba(var(--ds-primary-rgb), 0.3);
}

/* "System online" dot. */
.app-header__dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background: var(--ds-primary);
  box-shadow: 0 0 8px rgba(var(--ds-primary-rgb), 0.9);
  animation: header-dot-blink 2.4s ease-in-out infinite;
}

@keyframes header-dot-blink {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.35;
  }
}

/* ─── User pill ──────────────────────────────────────────────────────────── */
.app-header__user {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 42px;
  padding: 0 10px 0 14px;
  border-radius: var(--ds-control-radius);
  border: 1px solid rgba(var(--ds-primary-rgb), 0.2);
  background: rgba(255, 255, 255, 0.04);
  cursor: pointer;
  user-select: none;
  transition:
    background-color var(--ds-duration-base) ease,
    border-color var(--ds-duration-base) ease,
    box-shadow var(--ds-duration-base) ease,
    transform var(--ds-duration-press) var(--ds-ease-out);
}

.app-header__user:active {
  transform: scale(0.98);
}

.app-header__user:focus-visible {
  outline: none;
  border-color: rgba(var(--ds-primary-rgb), 0.6);
  box-shadow: 0 0 0 2px rgba(var(--ds-primary-rgb), 0.35), var(--ds-glow-primary-soft);
}

/* Lit while the menu is open, so the trigger and its popper read as one unit. */
.app-header__user.is-open {
  border-color: rgba(var(--ds-primary-rgb), 0.55);
  background: rgba(var(--ds-primary-rgb), 0.08);
  box-shadow: var(--ds-glow-primary-soft);
}

.app-header__identity {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
  min-width: 0;
  max-width: 150px;
  text-align: right;
}

.app-header__name {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  color: rgba(255, 255, 255, 0.9);
}

.app-header__role {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.16em;
  line-height: 1;
  text-transform: uppercase;
  color: var(--ds-text-faint);
  transition: color var(--ds-duration-base) ease;
}

.app-header__user.is-open .app-header__role {
  color: rgba(var(--ds-primary-rgb), 0.85);
}

/* Square avatar frame — reads as a HUD tile next to the mono role line. */
.app-header__avatar {
  display: inline-flex;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  box-shadow:
    inset 0 0 0 1px rgba(var(--ds-primary-rgb), 0.4),
    var(--ds-glow-primary-soft);
  transition: box-shadow var(--ds-duration-base) ease;
}

.app-header__caret {
  color: rgba(255, 255, 255, 0.5);
  transition:
    transform var(--ds-duration-base) var(--ds-ease-out),
    color var(--ds-duration-base) ease;
}

.app-header__user.is-open .app-header__caret {
  transform: rotate(180deg);
  color: var(--ds-primary);
}

/* ─── Bottom edge ────────────────────────────────────────────────────────── */
.app-header__edge {
  position: absolute;
  inset: auto 0 0 0;
  height: 8px;
  pointer-events: none;
  overflow: hidden;
}

/* Ruler: minor ticks every 12px, a taller major tick every 60px, fading in
   from the sides so the readout above sits on a measured strip. */
.app-header__ruler {
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(90deg, rgba(var(--ds-primary-rgb), 0.28) 0 1px, transparent 1px 60px)
      bottom / 100% 6px no-repeat,
    repeating-linear-gradient(90deg, rgba(var(--ds-primary-rgb), 0.16) 0 1px, transparent 1px 12px)
      bottom / 100% 3px no-repeat;
  mask-image: linear-gradient(90deg, transparent 12%, #000 38%, #000 62%, transparent 88%);
  -webkit-mask-image: linear-gradient(90deg, transparent 12%, #000 38%, #000 62%, transparent 88%);
}

.app-header__line {
  position: absolute;
  inset: auto 0 0 0;
}

/* A short bright segment sweeping left → right along the hairline, then a
   pause off-screen. Constant motion, so linear; transform/opacity only. */
.app-header__sweep {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 180px;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.85) 50%, transparent 100%);
  box-shadow: 0 0 10px rgba(var(--ds-primary-rgb), 0.8);
  transform: translateX(-100%);
  opacity: 0;
  animation: header-sweep 9s linear infinite;
}

@keyframes header-sweep {
  0% {
    transform: translateX(-100%);
    opacity: 0;
  }

  4% {
    opacity: 1;
  }

  56% {
    opacity: 1;
  }

  60%,
  100% {
    transform: translateX(100vw);
    opacity: 0;
  }
}

/* ─── Pointer-only hover ─────────────────────────────────────────────────── */
@media (hover: hover) and (pointer: fine) {
  .app-header__logo:hover {
    filter: drop-shadow(0 0 18px rgba(var(--ds-primary-rgb), 0.6));
  }

  .app-header__user:hover {
    border-color: rgba(var(--ds-primary-rgb), 0.5);
    background: rgba(var(--ds-primary-rgb), 0.08);
    box-shadow: var(--ds-glow-primary-soft);
  }

  .app-header__user:hover .app-header__caret {
    color: rgba(255, 255, 255, 0.85);
  }
}

/* Reduced motion: the global rule in _tokens.scss already collapses durations;
   the sweep additionally hides so it never flashes on. */
@media (prefers-reduced-motion: reduce) {
  .app-header__sweep {
    display: none;
  }
}
</style>
