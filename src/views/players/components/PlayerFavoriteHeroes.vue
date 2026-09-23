<template>
  <div class="neon-card hud-corners flex w-full flex-col items-stretch gap-14 rounded-2xl p-16 2md:p-20">
    <h3 class="section-title">
      <span class="inline-flex items-center gap-6">
        Улюблені герої
        <el-tooltip
          placement="top"
          effect="dark"
          :show-after="180"
          content="Дані беруться з OpenDota і можуть бути неактуальними."
        >
          <PhQuestion
            class="cursor-help text-white/40 transition-colors hover:text-primary"
            weight="bold"
            :size="14"
          />
        </el-tooltip>
      </span>
    </h3>

    <!-- Steam не прив'язано: легкий стан, не помилка -->
    <p
      v-if="!hasAccount"
      class="flex items-center justify-center gap-8 py-10 text-center text-sm text-gray-500"
    >
      <PhSteamLogo :size="18" weight="duotone" class="shrink-0 text-white/40" />
      Steam не прив'язано — улюблені герої недоступні.
    </p>

    <!-- Завантаження: скелет тієї ж сітки/розміру, без стрибків layout -->
    <div
      v-else-if="isPending"
      class="flex flex-wrap items-center justify-center gap-14"
    >
      <div
        v-for="i in skeletonCount"
        :key="i"
        class="hero-tile h-[136px] w-[150px] animate-pulse"
      />
    </div>

    <p
      v-else-if="isError"
      class="py-10 text-center text-sm text-error"
    >
      Не вдалося завантажити героїв з OpenDota. Спробуйте пізніше.
    </p>

    <!-- Порожній стан: ілюстрація + текст, а не одинокий рядок -->
    <el-empty
      v-else-if="isEmpty"
      description="Немає даних про героїв."
      :image-size="120"
      class="favorite-heroes-empty"
    />

    <div
      v-else
      class="flex flex-wrap items-stretch justify-center gap-14"
    >
      <div
        v-for="(h, index) in heroes"
        :key="h.heroId"
        class="hero-tile w-[150px]"
        :class="{ 'hero-tile--top': index === 0 }"
      >
        <span class="hero-tile__rank">{{ String(index + 1).padStart(2, '0') }}</span>

        <div class="hero-tile__portrait">
          <img
            v-if="h.iconUrl && !brokenHeroIcons.has(h.heroId)"
            :src="h.iconUrl"
            :alt="h.name"
            width="36"
            height="36"
            loading="lazy"
            class="size-36 object-contain"
            @error="onHeroIconError(h.heroId)"
          >
          <span
            v-else
            class="font-display text-base text-white/80"
            :aria-label="h.name"
          >
            {{ h.name.charAt(0) }}
          </span>
        </div>

        <span
          class="max-w-full truncate text-center font-display text-[11px] uppercase tracking-wide text-white"
          :title="h.name"
        >
          {{ h.name }}
        </span>

        <span class="font-mono text-[10px] tabular-nums text-white/50">
          {{ h.games }} ігор
          <template v-if="h.winrate !== null">
            ·
            <span :class="h.winrate >= 50 ? 'text-success' : 'text-error'">
              {{ h.winrate }}%
            </span>
          </template>
        </span>

        <!-- Вінрейт героя — тонка смуга по нижньому краю плитки -->
        <div
          v-if="h.winrate !== null"
          class="hero-tile__bar"
          :class="h.winrate >= 50 ? 'hero-tile__bar--win' : 'hero-tile__bar--loss'"
          aria-hidden="true"
        >
          <div class="hero-tile__bar-fill" :style="{ width: `${h.winrate}%` }" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhQuestion, PhSteamLogo } from '@phosphor-icons/vue'

interface IHero {
  heroId: string
  name: string
  iconUrl?: string | null
  games: number
  winrate: number | null
}

interface IProps {
  hasAccount: boolean
  isPending: boolean
  isError: boolean
  isEmpty: boolean
  heroes: IHero[]
  skeletonCount?: number
}

withDefaults(defineProps<IProps>(), {
  skeletonCount: 3
})

/** Іконки героїв, що не завантажились — показуємо запасний бокс. */
const brokenHeroIcons = ref<Set<string>>(new Set())

function onHeroIconError (heroId: string) {
  brokenHeroIcons.value = new Set(brokenHeroIcons.value).add(heroId)
}
</script>

<style scoped lang="scss">
// Hero tile: dark inset well, cyan hairline, portrait in a lit ring. The
// most-played hero (`--top`) holds a gold ring so the podium reads at a glance.
.hero-tile {
  @apply relative flex flex-col items-center justify-center gap-6 overflow-hidden
    rounded-xl border px-8 pb-14 pt-16;
  --tile-tone: var(--ds-primary-rgb);
  border-color: rgba(var(--tile-tone), 0.16);
  background: rgba(0, 0, 0, 0.3);
  box-shadow: inset 0 1px 0 rgba(var(--tile-tone), 0.12);
  transition:
    border-color var(--ds-duration-base) ease,
    box-shadow var(--ds-duration-base) ease,
    transform var(--ds-duration-base) var(--ds-ease-out);

  &--top {
    --tile-tone: var(--ds-gold-rgb);
  }
}

@media (hover: hover) and (pointer: fine) {
  .hero-tile:hover {
    transform: translateY(-2px);
    border-color: rgba(var(--tile-tone), 0.5);
    box-shadow: inset 0 1px 0 rgba(var(--tile-tone), 0.2), 0 0 18px rgba(var(--tile-tone), 0.22);
  }
}

.hero-tile__rank {
  @apply absolute left-8 top-6;
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.18em;
  color: rgba(var(--tile-tone), 0.7);
}

.hero-tile__portrait {
  @apply flex size-52 items-center justify-center rounded-full;
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(var(--tile-tone), 0.45);
  box-shadow: 0 0 14px rgba(var(--tile-tone), 0.25), inset 0 0 12px rgba(0, 0, 0, 0.6);
}

.hero-tile__bar {
  @apply absolute inset-x-0 bottom-0 h-3;
  background: rgba(255, 255, 255, 0.06);

  &--win .hero-tile__bar-fill {
    background: #22c55e;
    box-shadow: 0 0 8px rgba(34, 197, 94, 0.7);
  }

  &--loss .hero-tile__bar-fill {
    background: #ef4444;
    box-shadow: 0 0 8px rgba(239, 68, 68, 0.7);
  }
}

.hero-tile__bar-fill {
  @apply h-full;
}

/* Компактніший варіант глобального .el-empty під розмір картки */
.favorite-heroes-empty {
  @apply py-6;

  :deep(.el-empty__description) {
    @apply mt-2;
    font-size: 12px;
  }
}
</style>
