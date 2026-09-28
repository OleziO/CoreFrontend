<template>
  <!-- П'єдестал призерів: HUD-панель у тому ж рецепті, що й сітка плей-оф, але в золотому реєстрі -->
  <section
    class="podium hud-panel hud-corners hud-corners--fade rounded-2xl overflow-hidden"
    aria-label="Призери турніру"
  >
    <span class="hud-corners hud-corners--mirror hud-corners--fade absolute inset-0" aria-hidden="true" />
    <span class="podium__glow" aria-hidden="true" />

    <header class="podium__head podium__reveal" style="--reveal-index: 0">
      <p class="podium__eyebrow sys-label sys-label--gold">
        <PhTrophy :size="13" weight="fill" aria-hidden="true" />
        <span>Підсумки</span>
        <span class="podium__sep" aria-hidden="true">/</span>
        <span>Плей-оф</span>
      </p>
      <h2 class="podium__title">Призери турніру</h2>
    </header>

    <!-- Скелетон, доки серії сітки ще не прочитано: ті самі три тумби, щоб макет не стрибав -->
    <ol
      v-if="showSkeleton"
      class="podium__steps"
      aria-busy="true"
      aria-label="Завантаження призерів"
    >
      <li
        v-for="place in SKELETON_PLACES"
        :key="place"
        class="podium__step is-skeleton"
        :class="`is-place-${place}`"
        :style="{ '--skeleton-delay': `${(place - 1) * 140}ms` }"
      >
        <span v-if="place === 1" class="podium__crown-slot" aria-hidden="true" />
        <span class="podium__avatar skeleton-bone" aria-hidden="true" />
        <span class="skeleton-bone podium__bone-name" aria-hidden="true" />
        <span class="skeleton-bone podium__bone-label" aria-hidden="true" />
        <span class="podium__pedestal" aria-hidden="true">
          <span class="podium__pedestal-number">{{ place }}</span>
        </span>
      </li>
    </ol>

    <!-- Плей-оф триває, гранд-фінал ще не вирішено: порожні тумби чекають на призерів -->
    <div v-else-if="!entries.length" class="podium__pending podium__reveal" style="--reveal-index: 1">
      <ol class="podium__steps podium__steps--pending" aria-hidden="true">
        <li
          v-for="place in SKELETON_PLACES"
          :key="place"
          class="podium__step is-pending"
          :class="`is-place-${place}`"
        >
          <span v-if="place === 1" class="podium__crown-slot" />
          <span class="podium__avatar podium__avatar--empty">
            <PhQuestion :size="28" weight="duotone" />
          </span>
          <span class="podium__name podium__name--pending">Не визначено</span>
          <span class="podium__place-label">{{ PLACE_LABEL[place] }}</span>
          <span class="podium__pedestal">
            <span class="podium__pedestal-number">{{ place }}</span>
          </span>
        </li>
      </ol>
      <p class="podium__pending-hint" role="status">Призерів визначить гранд-фінал</p>
    </div>

    <!-- DOM-порядок 1 → 2 → 3 (для читачів екрана), візуальний — класичний 2 · 1 · 3 через order -->
    <ol v-else class="podium__steps" aria-label="Призові місця">
      <li
        v-for="entry in entries"
        :key="entry.place"
        class="podium__step podium__reveal"
        :class="`is-place-${entry.place}`"
        :style="{ '--reveal-index': REVEAL_INDEX[entry.place] }"
      >
        <PhCrown
          v-if="entry.place === 1"
          class="podium__crown"
          :size="24"
          weight="fill"
          aria-hidden="true"
        />

        <RouterLink
          :to="{ name: routeNames.team, params: { id: entry.team.id } }"
          class="podium__avatar"
          :aria-label="`Команда ${entry.team.name}`"
        >
          <img
            v-if="logoSrc(entry.team) && !failedLogos.has(entry.team.id)"
            :src="logoSrc(entry.team)"
            alt=""
            class="podium__avatar-img"
            loading="lazy"
            decoding="async"
            @error="failedLogos.add(entry.team.id)"
          >
          <PhUsersThree v-else :size="36" weight="duotone" class="podium__avatar-fallback" />
        </RouterLink>

        <RouterLink
          :to="{ name: routeNames.team, params: { id: entry.team.id } }"
          class="podium__name"
          :title="entry.team.name"
        >
          {{ entry.team.name }}
        </RouterLink>

        <span class="podium__place-label">{{ PLACE_LABEL[entry.place] }}</span>

        <span class="podium__pedestal" aria-hidden="true">
          <span class="podium__pedestal-number">{{ entry.place }}</span>
        </span>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { PhCrown, PhQuestion, PhTrophy, PhUsersThree } from '@phosphor-icons/vue'
import { resolvePublicOrApiUrl } from '@/core/helpers'
import { routeNames } from '@/router/route-names'

interface IProps {
  entries: TTournamentPodiumEntry[]
  /** Серії сітки ще читаються — показуємо скелетон замість тумб. */
  loading?: boolean
}

const props = withDefaults(defineProps<IProps>(), { loading: false })

const SKELETON_PLACES: readonly TTournamentPodiumPlace[] = [1, 2, 3]

// Повторне читання після поданого результату не має ховати вже показаних призерів.
const showSkeleton = computed(() => props.loading && props.entries.length === 0)

const PLACE_LABEL: Record<TTournamentPodiumPlace, string> = {
  1: 'Чемпіон',
  2: 'Друге місце',
  3: 'Третє місце'
}

// Поява знизу вгору: бронза → срібло → чемпіон останнім, як на церемонії.
const REVEAL_INDEX: Record<TTournamentPodiumPlace, number> = { 1: 3, 2: 2, 3: 1 }

const failedLogos = reactive(new Set<string>())

function logoSrc (team: TTournamentPodiumTeam): string {
  return resolvePublicOrApiUrl(team.logoUrl)
}
</script>

<style scoped lang="scss">
// ─── Поява ──────────────────────────────────────────────────────────────────
// Той самий оркестрований вхід, що й у героя сторінки (крок 90 мс);
// під prefers-reduced-motion глушиться глобально в _tokens.scss.
@keyframes podium-reveal {
  from {
    opacity: 0;
    transform: translate3d(0, 18px, 0);
  }
}

@keyframes podium-crown-float {
  0%,
  100% {
    transform: translate3d(0, 0, 0) rotate(-6deg);
  }

  50% {
    transform: translate3d(0, -4px, 0) rotate(-6deg);
  }
}

@keyframes podium-champion-glow {
  0%,
  100% {
    box-shadow: 0 0 0 1px rgba(var(--place-rgb), 0.55), 0 0 22px rgba(var(--place-rgb), 0.35);
  }

  50% {
    box-shadow: 0 0 0 1px rgba(var(--place-rgb), 0.85), 0 0 36px rgba(var(--place-rgb), 0.6);
  }
}

.podium__reveal {
  animation: podium-reveal 560ms var(--ds-ease-out) both;
  animation-delay: calc(var(--reveal-index, 0) * 90ms);
}

// ─── Панель ─────────────────────────────────────────────────────────────────
.podium {
  --hud-corner-color: rgba(var(--ds-gold-rgb), 0.7);
  @apply px-16 pt-20 sm:px-24 sm:pt-24;
  border-color: rgba(var(--ds-gold-rgb), 0.22);
  background:
    linear-gradient(90deg, transparent 0%, rgba(var(--ds-gold-rgb), 0.6) 50%, transparent 100%)
      top / 100% 1px no-repeat,
    linear-gradient(160deg, rgba(20, 23, 41, 0.86) 0%, rgba(13, 15, 28, 0.92) 100%);
}

// Золоте сяйво з-під тумб — прожектор церемонії.
.podium__glow {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 55% 70% at 50% 100%, rgba(var(--ds-gold-rgb), 0.16), transparent 70%),
    radial-gradient(ellipse 30% 40% at 12% 0%, rgba(var(--ds-primary-rgb), 0.08), transparent 70%);
}

.podium__head {
  @apply relative z-[1] flex flex-col items-center gap-8 text-center;
}

.podium__eyebrow {
  @apply m-0 inline-flex items-center gap-8;
}

.podium__sep {
  color: rgba(var(--ds-gold-rgb), 0.45);
  text-shadow: none;
}

.podium__title {
  @apply m-0 font-display uppercase text-white;
  font-size: clamp(1.375rem, 0.9rem + 1.6vw, 2rem);
  line-height: 1.1;
  letter-spacing: 0.04em;
  text-shadow:
    0 2px 14px rgba(0, 0, 0, 0.7),
    0 0 24px rgba(var(--ds-gold-rgb), 0.22);
}

// ─── Сходинки ───────────────────────────────────────────────────────────────
.podium__steps {
  @apply relative z-[1] m-0 flex list-none items-end justify-center gap-6 p-0 pt-24 sm:gap-14 sm:pt-32;
}

.podium__step {
  @apply relative flex min-w-0 flex-col items-center gap-8;
  width: clamp(96px, 28vw, 180px);
  --place-color: var(--ds-gold);
  --place-rgb: var(--ds-gold-rgb);
  --pedestal-height: 96px;
  --avatar-size: 72px;

  &.is-place-1 {
    order: 2;
    --avatar-size: 88px;
  }

  &.is-place-2 {
    order: 1;
    --place-color: #cbd5e1;
    --place-rgb: 203, 213, 225;
    --pedestal-height: 68px;
  }

  &.is-place-3 {
    order: 3;
    --place-color: #d08a4a;
    --place-rgb: 208, 138, 74;
    --pedestal-height: 48px;
  }

  @screen sm {
    --pedestal-height: 128px;
    --avatar-size: 96px;

    &.is-place-1 {
      --avatar-size: 120px;
    }

    &.is-place-2 {
      --pedestal-height: 92px;
    }

    &.is-place-3 {
      --pedestal-height: 64px;
    }
  }
}

.podium__crown {
  color: var(--ds-gold);
  filter: drop-shadow(0 0 8px rgba(var(--ds-gold-rgb), 0.75));
  animation: podium-crown-float 2.6s ease-in-out infinite;
}

// Аватар — клікабельна картка команди; рамка й сяйво в кольорі місця.
.podium__avatar {
  @apply relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl;
  width: var(--avatar-size);
  height: var(--avatar-size);
  border: 1px solid rgba(var(--place-rgb), 0.55);
  background: var(--ds-overlay);
  box-shadow: 0 0 0 1px rgba(var(--place-rgb), 0.25), 0 0 18px rgba(var(--place-rgb), 0.22);
  transition:
    transform var(--ds-duration-base) var(--ds-ease-out),
    box-shadow var(--ds-duration-base) ease,
    border-color var(--ds-duration-base) ease;

  &:hover,
  &:focus-visible {
    transform: translate3d(0, -3px, 0) scale(1.04);
    border-color: var(--place-color);
    box-shadow: 0 0 0 1px rgba(var(--place-rgb), 0.6), 0 0 32px rgba(var(--place-rgb), 0.5);
  }

  &:focus-visible {
    outline: 2px solid var(--place-color);
    outline-offset: 3px;
  }

  .is-place-1 & {
    animation: podium-champion-glow 2.8s ease-in-out infinite;
  }

  .is-place-1 &:hover,
  .is-place-1 &:focus-visible {
    animation-play-state: paused;
  }
}

// Скелетон і порожній стан повторюють геометрію готового п'єдесталу (корона, аватар,
// назва, підпис, тумба), щоб перемикання станів не зсувало сторінку.
.podium__crown-slot {
  display: block;
  height: 24px;
}

// Висота рядків = висота назви (14px × 1.25) і підпису (10px) у готовому стані.
.podium__bone-name {
  height: 18px;
  width: 70%;
  border-radius: 9999px;
}

.podium__bone-label {
  height: 10px;
  width: 44%;
  border-radius: 9999px;
}

// Специфічність вища за `.podium__name` (нижче), інакше білий колір назви переважить.
.is-pending .podium__name--pending {
  color: var(--ds-text-faint);
  pointer-events: none;
}

.is-skeleton,
.is-pending {
  // Перекриває `.is-place-1 .podium__avatar` (сяйво чемпіона) — тут місце ще нічиє.
  .podium__avatar {
    border-color: rgba(255, 255, 255, 0.14);
    box-shadow: none;
    animation: none;
  }

  .podium__avatar--empty {
    color: rgba(255, 255, 255, 0.28);
    border-style: dashed;
    background: rgba(255, 255, 255, 0.03);
  }

  .podium__place-label {
    color: var(--ds-text-faint);
    text-shadow: none;
  }

  .podium__pedestal {
    border-top-color: rgba(255, 255, 255, 0.16);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.015) 70%, transparent 100%);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  .podium__pedestal-number {
    color: rgba(255, 255, 255, 0.14);
    text-shadow: none;
  }
}

.podium__pending {
  @apply relative z-[1] flex flex-col items-center;
}

.podium__pending-hint {
  @apply absolute bottom-16 m-0 px-12 py-6 rounded-full border;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--ds-text-muted);
  border-color: rgba(255, 255, 255, 0.14);
  background: rgba(7, 8, 15, 0.8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.podium__avatar-img {
  @apply pointer-events-none h-full w-full select-none object-cover object-center;
}

.podium__avatar-fallback {
  color: rgba(var(--place-rgb), 0.55);
}

.podium__name {
  @apply line-clamp-2 w-full max-w-full text-center font-display uppercase text-white no-underline;
  font-size: 12px;
  line-height: 1.25;
  letter-spacing: 0.04em;
  overflow-wrap: anywhere;
  transition: color var(--ds-duration-base) ease;

  &:hover,
  &:focus-visible {
    color: var(--place-color);
  }

  @screen sm {
    font-size: 14px;
  }
}

.podium__place-label {
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--place-color);
  text-shadow: 0 0 8px rgba(var(--place-rgb), 0.45);

  @screen sm {
    font-size: 10px;
  }
}

// Тумба: верхня грань світиться кольором місця, тіло розчиняється донизу;
// велика цифра читається як гравіювання.
.podium__pedestal {
  @apply relative mt-4 flex w-full items-start justify-center overflow-hidden rounded-t-lg;
  height: var(--pedestal-height);
  border-top: 2px solid var(--place-color);
  background:
    linear-gradient(180deg, rgba(var(--place-rgb), 0.3) 0%, rgba(var(--place-rgb), 0.06) 70%, transparent 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 -6px 24px -8px rgba(var(--place-rgb), 0.55);
  transition: height 400ms var(--ds-ease-out);
}

.podium__pedestal-number {
  @apply font-display;
  margin-top: 4px;
  font-size: clamp(1.5rem, 1rem + 2vw, 2.75rem);
  line-height: 1;
  color: rgba(var(--place-rgb), 0.55);
  text-shadow: 0 0 14px rgba(var(--place-rgb), 0.35);
  font-variant-numeric: tabular-nums;
}
</style>
