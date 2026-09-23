<template>
  <div class="invite-page">
    <span class="invite-page__glow" aria-hidden="true" />

    <!-- Loading -->
    <section v-if="loading" class="invite invite--pending neon-card rounded-2xl" aria-busy="true">
      <span class="invite__well invite__well--pulse">
        <PhShield :size="28" weight="fill" />
      </span>
      <span class="sys-label sys-label--muted">// Перевіряємо запрошення</span>
      <span class="invite__skeleton invite__skeleton--title" />
      <span class="invite__skeleton invite__skeleton--line" />
    </section>

    <!-- Error -->
    <section v-else-if="error" class="invite invite--error neon-card rounded-2xl">
      <span class="invite__well invite__well--error">
        <PhWarningCircle :size="28" weight="fill" />
      </span>
      <div class="flex flex-col items-center gap-8 text-center">
        <span class="sys-label sys-label--pink">// {{ error.code }}</span>
        <h1 class="invite__title">{{ error.title }}</h1>
        <p class="invite__text">{{ error.hint }}</p>
      </div>
      <el-button class="invite__btn" @click="router.push({ name: routeNames.rootPage })">
        <PhHouse :size="16" weight="bold" />
        <span>На головну</span>
      </el-button>
    </section>

    <!-- Invite -->
    <article v-else-if="invite" class="invite neon-card rounded-2xl">
      <span class="scanlines rounded-2xl" aria-hidden="true" />

      <!-- Header line -->
      <div class="invite__head" style="--i: 0">
        <span class="sys-label">// Запрошення до команди</span>
        <span class="hud-line h-px min-w-12 flex-1" aria-hidden="true" />
        <span class="invite__ref" :title="token">#{{ tokenRef }}</span>
      </div>

      <!-- Team -->
      <div class="invite__team" style="--i: 1">
        <span class="invite__logo">
          <el-avatar :size="88" :src="logoSrc" shape="square" class="invite__logo-img">
            <template #default>
              <PhShield :size="36" weight="fill" class="text-white/50" />
            </template>
          </el-avatar>
        </span>

        <RouterLink :to="{ name: routeNames.team, params: { id: invite.teamId } }" class="invite__name">
          {{ invite.teamName }}
        </RouterLink>

        <span class="invite__slot" :class="`is-${invite.slot}`">
          <component :is="slotIcon" :size="13" weight="fill" />
          {{ slotLabel }}
        </span>
      </div>

      <!-- Ticket tear -->
      <span class="invite__tear" aria-hidden="true" />

      <!-- Expiry -->
      <div class="invite__expiry" style="--i: 2">
        <span class="invite__expiry-label">
          <PhClock :size="12" weight="bold" />
          {{ countdown ? 'Дійсне ще' : 'Термін дії' }}
        </span>

        <div v-if="countdown" class="invite__digits" role="timer" :aria-label="`Дійсне ще ${countdown.text}`">
          <template v-for="(part, index) in countdown.parts" :key="part.unit">
            <span v-if="index" class="invite__colon" aria-hidden="true">:</span>
            <span class="invite__digit">
              <b>{{ part.value }}</b>
              <small>{{ part.unit }}</small>
            </span>
          </template>
        </div>
        <span v-else class="invite__expired">Закінчився</span>

        <span class="invite__date">до {{ expiresAtFormatted }}</span>
      </div>

      <!-- Actions -->
      <div class="invite__actions" style="--i: 3">
        <template v-if="!authStore.isLoggedIn">
          <p class="invite__note">
            <PhDiscordLogo :size="16" weight="fill" class="shrink-0 text-[#5865f2]" />
            <span>Щоб прийняти запрошення, увійдіть через Discord — ми повернемо вас сюди.</span>
          </p>
          <el-button
            type="primary"
            class="invite__btn"
            :loading="authStore.loginLoading"
            @click="loginAndReturn"
          >
            <PhDiscordLogo :size="18" weight="fill" />
            <span>Увійти через Discord</span>
          </el-button>
        </template>

        <template v-else>
          <el-button
            type="primary"
            class="invite__btn"
            :loading="accepting"
            :disabled="!countdown"
            @click="accept"
          >
            <span>Приєднатися до команди</span>
            <PhArrowRight :size="16" weight="bold" />
          </el-button>
          <button type="button" class="invite__decline" @click="router.push({ name: routeNames.rootPage })">
            Відхилити запрошення
          </button>
        </template>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import {
  PhArrowRight, PhClock, PhDiscordLogo, PhHouse, PhShield, PhStrategy, PhUser, PhUsersThree, PhWarningCircle
} from '@phosphor-icons/vue'
import { useAuthStore } from '@/store/modules/auth'
import { routeNames } from '@/router/route-names'
import { resolvePublicOrApiUrl } from '@/core/helpers'
import { invitesService, type TInviteInfo } from './invites.service'

interface IInviteError {
  code: string
  title: string
  hint: string
}

interface ICountdownPart {
  value: string
  unit: string
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const token = computed(() => route.params.token as string)
const tokenRef = computed(() => token.value.slice(0, 6).toUpperCase())

const loading = ref(true)
const accepting = ref(false)
const error = ref<IInviteError | null>(null)
const invite = ref<TInviteInfo | null>(null)

// Ticks once a second; drives the "valid for" countdown.
const now = useNow({ interval: 1000 })

const pad = (n: number) => String(Math.max(0, Math.min(n, 99))).padStart(2, '0')

const SLOT_META: Record<TInviteInfo['slot'], { label: string; icon: Component }> = {
  main: { label: 'Основний склад', icon: PhUser },
  reserved: { label: 'Запасний гравець', icon: PhUsersThree },
  coach: { label: 'Тренер', icon: PhStrategy }
}

const slotLabel = computed(() => (invite.value ? SLOT_META[invite.value.slot]?.label ?? invite.value.slot : ''))
const slotIcon = computed<Component>(() => (invite.value ? SLOT_META[invite.value.slot]?.icon ?? PhUser : PhUser))

const logoSrc = computed(() => resolvePublicOrApiUrl(invite.value?.logoUrl))

// Date and time formatted apart: the locale would otherwise join them with "о".
const expiresAtFormatted = computed(() => {
  if (!invite.value) return ''
  const at = new Date(invite.value.expiresAt)
  const date = at.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })
  const time = at.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
  return `${date} ${time}`
})

const countdown = computed(() => {
  if (!invite.value) return null
  const target = new Date(invite.value.expiresAt).getTime()
  if (Number.isNaN(target)) return null
  const total = Math.floor((target - now.value.getTime()) / 1000)
  if (total <= 0) return null

  const days = Math.floor(total / 86_400)
  const hours = Math.floor((total % 86_400) / 3_600)
  const minutes = Math.floor((total % 3_600) / 60)
  const seconds = total % 60

  const parts: ICountdownPart[] = days
    ? [
      { value: pad(days), unit: 'дн' },
      { value: pad(hours), unit: 'год' },
      { value: pad(minutes), unit: 'хв' }
    ]
    : [
      { value: pad(hours), unit: 'год' },
      { value: pad(minutes), unit: 'хв' },
      { value: pad(seconds), unit: 'сек' }
    ]

  return { parts, text: `${days} дн ${hours} год ${minutes} хв` }
})

onMounted(async () => {
  try {
    invite.value = await invitesService.getInviteInfo(token.value)
  } catch (e: any) {
    const status = e?.response?.status
    if (status === 404) {
      error.value = {
        code: 'Не знайдено',
        title: 'Запрошення не знайдено',
        hint: 'Посилання недійсне або запрошення вже використали. Попросіть капітана надіслати нове.'
      }
    } else if (status === 410) {
      error.value = {
        code: 'Термін минув',
        title: 'Запрошення прострочене',
        hint: 'Термін дії цього посилання закінчився. Попросіть капітана створити нове запрошення.'
      }
    } else {
      error.value = {
        code: 'Помилка',
        title: 'Не вдалося завантажити запрошення',
        hint: 'Спробуйте оновити сторінку. Якщо помилка повторюється — напишіть адміністрації.'
      }
    }
  } finally {
    loading.value = false
  }
})

function loginAndReturn () {
  authService.savePostLoginRedirect(route.fullPath)
  authStore.startDiscordLogin()
}

async function accept () {
  accepting.value = true
  try {
    await invitesService.acceptInvite(token.value)
    // Склад команди та teamId користувача змінились на сервері — освіжаємо /me і команду в сторах.
    await authStore.fetchUser()
    if (invite.value?.teamId) await useTeamsStore().refreshTeam(invite.value.teamId)
    ElMessage.success('Ви успішно приєдналися до команди!')
    router.push({ name: routeNames.profile })
  } catch (e: any) {
    const msg = e?.response?.data?.message ?? 'Помилка при прийнятті запрошення'
    ElMessage.error(msg)
  } finally {
    accepting.value = false
  }
}
</script>

<style scoped lang="scss">
.invite-page {
  @apply relative flex items-center justify-center px-16 py-40;
  min-height: calc(100svh - 133px);
}

// Ambient light behind the ticket.
.invite-page__glow {
  @apply pointer-events-none absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2;
  width: min(720px, 90vw);
  height: 420px;
  background:
    radial-gradient(ellipse at 50% 50%, rgba(var(--ds-primary-rgb), 0.14), transparent 60%),
    radial-gradient(ellipse at 20% 80%, rgba(var(--ds-secondary-rgb), 0.1), transparent 55%);
  filter: blur(24px);
}

// ─── Card shell ─────────────────────────────────────────────────────────────
.invite {
  @apply flex w-full max-w-[440px] flex-col gap-20 overflow-hidden p-28;
  animation: invite-in 420ms var(--ds-ease-out) both;

  &--pending,
  &--error {
    @apply items-center text-center;
  }

  &--error {
    --neon-card-line-color: var(--ds-pink-rgb);
    border-color: rgba(var(--ds-pink-rgb), 0.28);
  }

  // Content sits above the scanline overlay so buttons keep their true colour.
  > :not(.scanlines) {
    position: relative;
    z-index: 1;
  }

  // Sections rise in one after another.
  > [style*='--i'] {
    animation: invite-rise 360ms var(--ds-ease-out) both;
    animation-delay: calc(80ms + var(--i) * 60ms);
  }
}

@keyframes invite-in {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes invite-rise {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

.invite__head {
  @apply flex items-center gap-12;
}

.invite__ref {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: var(--ds-text-faint);
  cursor: default;
}

// ─── Team ───────────────────────────────────────────────────────────────────
.invite__team {
  @apply flex flex-col items-center gap-12 text-center;
}

.invite__logo {
  @apply relative block size-88 shrink-0 rounded-xl;
  box-shadow: 0 0 0 1px rgba(var(--ds-primary-rgb), 0.35), 0 0 24px rgba(var(--ds-primary-rgb), 0.18);
}

.invite__logo-img {
  // The avatar reset hard-codes 56px; pin it to the well.
  width: 88px !important;
  height: 88px !important;
  border-radius: 12px !important;
  background: rgba(255, 255, 255, 0.05);
}

.invite__name {
  @apply font-display text-2xl uppercase leading-none tracking-wide text-white no-underline;
  text-shadow: var(--ds-neon-text-subtle);
  overflow-wrap: anywhere;
  transition: color var(--ds-duration-base) ease;

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.6);
    outline-offset: 4px;
    border-radius: 4px;
  }
}

.invite__slot {
  --slot-rgb: var(--ds-primary-rgb);

  @apply inline-flex items-center gap-6 rounded-md border px-10 py-4;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgb(var(--slot-rgb));
  border-color: rgba(var(--slot-rgb), 0.35);
  background: rgba(var(--slot-rgb), 0.08);

  &.is-reserved {
    --slot-rgb: 255, 255, 255;
    color: var(--ds-text-muted);
    border-color: var(--ds-border-neutral);
    background: rgba(255, 255, 255, 0.04);
  }

  &.is-coach {
    --slot-rgb: var(--ds-gold-rgb);
  }
}

// ─── Ticket tear ────────────────────────────────────────────────────────────
// Dashed perforation with two notches cut out of the card edge.
.invite__tear {
  @apply relative block h-px;
  margin: 0 -28px;
  background: repeating-linear-gradient(
    90deg,
    rgba(var(--ds-primary-rgb), 0.35) 0 6px,
    transparent 6px 12px
  );

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--ds-background);
    box-shadow: inset 0 0 0 1px var(--ds-border);
    transform: translateY(-50%);
  }

  &::before {
    left: -9px;
  }

  &::after {
    right: -9px;
  }
}

// ─── Expiry ─────────────────────────────────────────────────────────────────
.invite__expiry {
  @apply flex flex-col items-center gap-8 text-center;
}

.invite__expiry-label {
  @apply inline-flex items-center gap-6;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.invite__digits {
  @apply flex items-end gap-4;
}

.invite__digit {
  @apply flex flex-col items-center;
  min-width: 52px;

  b {
    font-family: var(--ds-font-mono);
    font-size: 28px;
    font-weight: 700;
    line-height: 1;
    letter-spacing: -0.02em;
    color: #fff;
    font-variant-numeric: tabular-nums;
    text-shadow: var(--ds-neon-text-subtle);
  }

  small {
    margin-top: 4px;
    font-family: var(--ds-font-mono);
    font-size: 9px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--ds-text-faint);
  }
}

.invite__colon {
  padding-bottom: 17px;
  font-family: var(--ds-font-mono);
  font-size: 20px;
  line-height: 1;
  color: rgba(var(--ds-primary-rgb), 0.6);
  animation: invite-colon 1s steps(1) infinite;
}

@keyframes invite-colon {
  50% {
    opacity: 0.25;
  }
}

.invite__expired {
  @apply font-display text-lg uppercase tracking-wide;
  color: var(--ds-pink);
  text-shadow: var(--ds-neon-text-pink);
}

.invite__date {
  font-family: var(--ds-font-mono);
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--ds-text-muted);
}

// ─── Actions ────────────────────────────────────────────────────────────────
.invite__actions {
  @apply flex flex-col items-stretch gap-10;
}

.invite__note {
  @apply m-0 flex items-start gap-10 rounded-xl border p-12 text-left text-sm leading-relaxed;
  color: var(--ds-text-muted);
  border-color: rgba(88, 101, 242, 0.35);
  background: linear-gradient(135deg, rgba(88, 101, 242, 0.12), transparent 70%), rgba(7, 8, 15, 0.45);
}

.invite__btn {
  @apply w-full;
  margin-left: 0 !important;

  :deep(> span) {
    @apply inline-flex items-center gap-8;
  }
}

.invite__decline {
  @apply self-center rounded-md border-0 bg-transparent px-12 py-8;
  font-family: var(--ds-font-mono);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
  cursor: pointer;
  transition: color var(--ds-duration-base) ease, background-color var(--ds-duration-base) ease;

  &:focus-visible {
    outline: 2px solid rgba(239, 68, 68, 0.6);
    outline-offset: 2px;
  }
}

// ─── States ─────────────────────────────────────────────────────────────────
.invite__well {
  @apply inline-flex size-56 items-center justify-center rounded-xl border;
  color: var(--ds-primary);
  border-color: rgba(var(--ds-primary-rgb), 0.35);
  background: rgba(var(--ds-primary-rgb), 0.08);

  &--pulse {
    animation: invite-pulse 1.6s ease-in-out infinite;
  }

  &--error {
    color: var(--ds-pink);
    border-color: rgba(var(--ds-pink-rgb), 0.4);
    background: rgba(var(--ds-pink-rgb), 0.1);
    filter: drop-shadow(0 0 10px rgba(var(--ds-pink-rgb), 0.35));
  }
}

@keyframes invite-pulse {
  0%,
  100% {
    opacity: 0.55;
    transform: scale(0.97);
  }

  50% {
    opacity: 1;
    transform: scale(1);
  }
}

.invite__skeleton {
  @apply block rounded-md;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.05));
  background-size: 200% 100%;
  animation: invite-shimmer 1.4s linear infinite;

  &--title {
    width: 60%;
    height: 22px;
  }

  &--line {
    width: 40%;
    height: 12px;
  }
}

@keyframes invite-shimmer {
  to {
    background-position: -200% 0;
  }
}

.invite__title {
  @apply m-0 font-display text-xl uppercase leading-tight tracking-wide text-white;
}

.invite__text {
  @apply m-0 max-w-[320px] text-sm leading-relaxed;
  color: var(--ds-text-muted);
}

// ─── Pointer-only hover ─────────────────────────────────────────────────────
@media (hover: hover) and (pointer: fine) {
  // The ticket is not a link: hovering its buttons must not light the card.
  .invite:hover {
    --neon-card-line: 0.55;
    border-color: var(--ds-border);
    box-shadow: var(--ds-elevation-3), var(--ds-glow-primary-soft);
  }

  .invite--error:hover {
    border-color: rgba(var(--ds-pink-rgb), 0.28);
  }

  .invite__name:hover {
    color: var(--ds-primary);
  }

  .invite__decline:hover {
    color: var(--ds-error);
    background: rgba(239, 68, 68, 0.08);
  }
}

@media (prefers-reduced-motion: reduce) {
  .invite,
  .invite > [style*='--i'],
  .invite__well--pulse,
  .invite__skeleton,
  .invite__colon {
    animation: none;
  }
}
</style>
