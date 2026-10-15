<template>
  <div class="media relative flex w-full flex-col text-white">
    <div class="media__backdrop" aria-hidden="true" />

    <div class="relative mx-auto flex w-full max-w-6xl flex-col gap-24 px-16 pb-48 pt-28 lg:px-24">
      <!-- ─── Hero ─────────────────────────────────────────────────────────── -->
      <header class="media-hero">
        <div class="flex min-w-0 flex-col gap-10">
          <span class="media-hero__eyebrow">
            <PhTwitchLogo :size="14" weight="fill" aria-hidden="true" />
            // Медіа-турніри
            <span v-if="liveCount" class="media-hero__live">
              <span class="media-hero__live-dot" aria-hidden="true" />
              {{ liveCount }} наживо
            </span>
          </span>
          <h1 class="media-hero__title">Турніри <span class="media-hero__accent">на стрімі</span></h1>
          <p class="media-hero__text">
            Стрімери ліги збирають гравців, а боти Core League створюють лобі під кожен матч — з випадковими героями,
            як у звичайних дуелях. Реєструйся, грай на очах у глядачів і забирай призи.
          </p>
        </div>
        <el-button v-if="tab === '1v1' && canCreate" type="primary" class="media-hero__cta" @click="openCreate">
          <PhPlus :size="16" weight="bold" />
          <span class="ml-6">Створити турнір 1v1</span>
        </el-button>
      </header>

      <!-- ─── Під-вкладки ──────────────────────────────────────────────────── -->
      <nav class="media-tabs" aria-label="Формат турнірів">
        <RouterLink
          v-for="item in tabs"
          :key="item.key"
          :to="{ name: item.route }"
          class="media-tabs__tab no-underline"
          :class="{ 'is-active': tab === item.key }"
          :aria-current="tab === item.key ? 'page' : undefined"
          active-class=""
          exact-active-class=""
        >
          <component :is="item.icon" :size="18" :weight="tab === item.key ? 'fill' : 'bold'" aria-hidden="true" />
          <span class="flex flex-col">
            <span class="media-tabs__label">{{ item.label }}</span>
            <span class="media-tabs__hint">{{ item.hint }}</span>
          </span>
        </RouterLink>
      </nav>

      <!-- ─── 1v1 ─────────────────────────────────────────────────────────── -->
      <template v-if="tab === '1v1'">
        <div v-if="isPending && !brackets.length" class="media-grid">
          <span v-for="n in 3" :key="n" class="skeleton-bone block h-[300px] !rounded-2xl" />
        </div>

        <p v-else-if="error && !brackets.length" class="media-empty text-error">
          Не вдалося завантажити турніри — оновіть сторінку.
        </p>

        <div v-else-if="!brackets.length" class="media-empty">
          <PhTrophy :size="36" weight="duotone" class="media-empty__icon" aria-hidden="true" />
          <p class="media-empty__title">Турнірів 1v1 ще не було</p>
          <p>
            Перший анонс з’явиться тут і в Discord ліги.
            <template v-if="canCreate">Створіть його — кнопка вгорі.</template>
          </p>
        </div>

        <template v-else>
          <section v-for="group in groups" :key="group.key" class="flex flex-col gap-14" :aria-label="group.title">
            <header class="flex items-center gap-10">
              <h2 class="media-section-title">{{ group.title }}</h2>
              <span class="media-count">{{ group.items.length }}</span>
            </header>
            <div class="media-grid">
              <MediaBracketCard v-for="bracket in group.items" :key="bracket.id" :bracket="bracket" />
            </div>
          </section>
        </template>
      </template>

      <!-- ─── 5v5 ─────────────────────────────────────────────────────────── -->
      <MediaTeamTournaments v-else />
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhPlus, PhSword, PhTrophy, PhTwitchLogo, PhUsersThree } from '@phosphor-icons/vue'
import type { Component } from 'vue'
import { hasPlayerRole } from '@/core/helpers'
import { routeNames } from '@/router/route-names'
import { ERole } from '@/types/general.enums'
import MediaBracketCard from '@/views/media/components/MediaBracketCard.vue'
import MediaTeamTournaments from '@/views/media/components/MediaTeamTournaments.vue'
import { useGetDuelBrackets } from '@/views/media/media.queries'
import type { TMediaTab } from '@/views/media/media.route'
import type { TDuelBracketStatus, TDuelBracketSummary } from '@/api/types/api.types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { open } = useAppModals()

const tab = computed<TMediaTab>(() => route.meta.mediaTab ?? '1v1')

const tabs: Array<{ key: TMediaTab; route: string; label: string; hint: string; icon: Component }> = [
  { key: '1v1', route: routeNames.mediaDuels, label: '1v1 турніри', hint: 'Сітка, лобі від ботів', icon: PhSword },
  { key: '5v5', route: routeNames.mediaTeams, label: '5v5 турніри', hint: 'Командні, на Twitch ліги', icon: PhUsersThree }
]

const meId = computed(() => authStore.user?.id ?? null)
/** Створюють стрімери (роль «Медіа») та адміни; керує конкретним — організатор і адміни (`canManage`). */
const canCreate = computed(() =>
  authStore.isAdmin.isAdmin || hasPlayerRole(authStore.user?.roles, ERole.MEDIA)
)

const { data, isPending, error, refetch } = useGetDuelBrackets(() => meId.value)
const brackets = computed<TDuelBracketSummary[]>(() => data.value ?? [])
const liveCount = computed(() => brackets.value.filter(b => b.status === 'LIVE').length)

const groupMeta: Array<{ key: string; title: string; statuses: TDuelBracketStatus[] }> = [
  { key: 'live', title: 'Наживо', statuses: ['LIVE'] },
  { key: 'registration', title: 'Відкрита реєстрація', statuses: ['REGISTRATION'] },
  { key: 'archive', title: 'Архів', statuses: ['FINISHED', 'CANCELLED'] }
]

/** Бекенд уже віддає в порядку «наживо → реєстрація → завершені»; тут лише групуємо. */
const groups = computed(() =>
  groupMeta
    .map(g => ({ ...g, items: brackets.value.filter(b => g.statuses.includes(b.status)) }))
    .filter(g => g.items.length)
)

function openCreate () {
  open('DuelBracketFormModal', {
    onSaved: (saved: { id: string }) => {
      refetch().catch(() => { /* тихо */ })
      router.push({ name: routeNames.mediaBracket, params: { id: saved.id } })
    }
  })
}
</script>

<style scoped>
.media {
  --tw: 145, 70, 255;
}

.media__backdrop {
  position: absolute;
  inset: 0 0 auto;
  height: 420px;
  pointer-events: none;
  background:
    radial-gradient(ellipse 50% 90% at 15% 0%, rgba(var(--tw), 0.2), transparent 70%),
    radial-gradient(ellipse 40% 70% at 90% 10%, rgba(var(--ds-pink-rgb), 0.08), transparent 70%);
}

.media-hero {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
}

.media-hero__eyebrow {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: rgb(190, 160, 255);
  text-shadow: 0 0 8px rgba(var(--tw), 0.7);
}

.media-hero__live {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  letter-spacing: 0.14em;
  color: #fff;
  text-shadow: none;
  background: linear-gradient(90deg, rgba(var(--tw), 0.9), rgba(var(--ds-pink-rgb), 0.8));
  box-shadow: 0 0 14px rgba(var(--tw), 0.55);
}

.media-hero__live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #fff;
  animation: media-pulse 1.4s ease-in-out infinite;
}

.media-hero__title {
  font-family: var(--ds-font-display);
  font-size: clamp(30px, 6vw, 48px);
  line-height: 1.05;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: var(--ds-text-strong);
}

.media-hero__accent {
  background: linear-gradient(90deg, rgb(175, 130, 255), rgb(var(--ds-pink-rgb)));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 0 14px rgba(var(--tw), 0.45));
}

.media-hero__text {
  max-width: 640px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--ds-text-muted);
}

.media-hero__cta {
  --el-button-bg-color: rgb(var(--tw));
  --el-button-border-color: rgb(var(--tw));
  --el-button-hover-bg-color: rgb(165, 100, 255);
  --el-button-hover-border-color: rgb(165, 100, 255);
  --el-button-active-bg-color: rgb(125, 55, 230);
  --el-button-text-color: #fff;
  --el-button-hover-text-color: #fff;

  box-shadow: 0 0 18px rgba(var(--tw), 0.45);
}

/* ─── Під-вкладки: дві великі плитки, активна світиться фіолетовим ───────── */
.media-tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  padding: 6px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(10, 11, 22, 0.6);
}

.media-tabs__tab {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 12px 14px;
  border-radius: 13px;
  color: var(--ds-text-muted);
  transition:
    background-color var(--ds-duration-base) ease,
    color var(--ds-duration-base) ease,
    box-shadow var(--ds-duration-base) ease;
}

.media-tabs__tab.is-active {
  color: #fff;
  background: linear-gradient(120deg, rgba(var(--tw), 0.55), rgba(var(--tw), 0.18));
  box-shadow: inset 0 0 0 1px rgba(var(--tw), 0.7), 0 0 20px rgba(var(--tw), 0.3);
}

.media-tabs__tab:focus-visible {
  outline: 2px solid rgba(var(--tw), 0.8);
  outline-offset: 2px;
}

.media-tabs__label {
  font-family: var(--ds-font-display);
  font-size: 16px;
  line-height: 1.2;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.media-tabs__hint {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  color: var(--ds-text-faint);
}

.media-tabs__tab.is-active .media-tabs__hint {
  color: rgba(255, 255, 255, 0.7);
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
  gap: 18px;
}

.media-section-title {
  font-family: var(--ds-font-display);
  font-size: 18px;
  color: var(--ds-text-strong);
}

.media-count {
  padding: 2px 8px;
  border-radius: 999px;
  font-family: var(--ds-font-mono);
  font-size: 11px;
  color: var(--ds-text-muted);
  background: rgba(255, 255, 255, 0.06);
}

.media-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 16px;
  border-radius: 18px;
  border: 1px dashed rgba(var(--tw), 0.3);
  text-align: center;
  font-size: 13px;
  color: var(--ds-text-muted);
}

.media-empty__icon {
  color: rgb(var(--tw));
}

.media-empty__title {
  font-family: var(--ds-font-display);
  font-size: 18px;
  color: var(--ds-text-strong);
}

@media (hover: hover) and (pointer: fine) {
  .media-tabs__tab:not(.is-active):hover {
    color: var(--ds-text-strong);
    background: rgba(var(--tw), 0.1);
  }
}

@media (max-width: 480px) {
  .media-tabs__tab {
    gap: 8px;
    padding: 10px;
  }

  .media-tabs__label {
    font-size: 14px;
  }
}

@keyframes media-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

@media (prefers-reduced-motion: reduce) {
  .media-hero__live-dot {
    animation: none;
  }
}
</style>
