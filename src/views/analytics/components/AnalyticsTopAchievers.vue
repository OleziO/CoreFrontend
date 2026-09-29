<template>
  <section class="top-achievers" aria-label="Найтитулованіші гравці">
    <header class="top-achievers__head">
      <span class="sys-label sys-label--gold">// Топ-3 за кількістю досягнень</span>
      <span class="top-achievers__hint">
        Рахуються різні види трофеїв; при рівності — загальна кількість і п’єдестали
      </span>
    </header>

    <!-- Скелет тієї ж сітки -->
    <div v-if="isPending" class="top-achievers__grid" aria-busy="true">
      <span
        v-for="n in 3"
        :key="n"
        class="skeleton-bone block h-[96px] !rounded-xl"
        :style="{ '--skeleton-delay': `${n * 60}ms` }"
      />
    </div>

    <p v-else-if="!achievers.length" class="top-achievers__empty">
      Ще ніхто не здобув жодного трофею.
    </p>

    <div v-else class="top-achievers__grid">
      <RouterLink
        v-for="(achiever, index) in achievers"
        :key="achiever.playerId"
        :to="{ name: routeNames.player, params: { id: achiever.playerId } }"
        class="achiever no-underline"
        :style="{ '--tile-tone': toneOf(index), '--tile-delay': `${index * 70}ms` }"
        :aria-label="`${index + 1} місце: ${displayName(achiever)}, ${pluralizeAchievements(achiever.achievements)}`"
      >
        <span class="achiever__place">
          <component :is="iconOf(index)" :size="12" weight="fill" />
          {{ index + 1 }}
        </span>

        <el-avatar :src="resolvePublicOrApiUrl(achiever.avatarUrl)" :size="44" class="achiever__avatar">
          {{ initialOf(achiever) }}
        </el-avatar>

        <span class="achiever__body">
          <span class="achiever__name truncate">{{ displayName(achiever) }}</span>
          <span v-if="achiever.discordUsername" class="achiever__handle truncate">@{{ achiever.discordUsername }}</span>
          <span class="achiever__meta">
            {{ pluralizeTrophies(achiever.trophies) }} · {{ pluralizePodiums(achiever.podiums) }}
          </span>
        </span>

        <span class="achiever__count">
          <span class="achiever__count-value">{{ achiever.achievements }}</span>
          <span class="achiever__count-label">{{ achievementsWord(achiever.achievements) }}</span>
        </span>
      </RouterLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { PhCrown, PhMedal, PhMedalMilitary } from '@phosphor-icons/vue'
import { resolvePublicOrApiUrl } from '@/core/helpers'
import { routeNames } from '@/router/route-names'
import {
  pluralizeAchievements,
  pluralizePodiums,
  pluralizeTrophies
} from '@/views/players/player-achievements.utils'

withDefaults(defineProps<{
  achievers: TAnalyticsTopAchiever[]
  isPending?: boolean
}>(), {
  isPending: false
})

const TONES = ['var(--ds-gold-rgb)', '198, 205, 220', '205, 127, 50'] as const
const ICONS: Component[] = [PhCrown, PhMedal, PhMedalMilitary]

const toneOf = (index: number) => TONES[index] ?? 'var(--ds-primary-rgb)'
const iconOf = (index: number) => ICONS[index] ?? PhMedal

function displayName (a: TAnalyticsTopAchiever): string {
  return a.discordName || a.discordUsername || 'Гравець'
}

function initialOf (a: TAnalyticsTopAchiever): string {
  return displayName(a).charAt(0).toUpperCase()
}

/** Лише слово без числа — число стоїть окремо великим кеглем. */
function achievementsWord (n: number): string {
  return pluralizeAchievements(n).replace(/^\d+\s/, '')
}
</script>

<style scoped>
.top-achievers {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 18px;
  margin-bottom: 4px;
  border-bottom: 1px solid rgba(var(--ds-gold-rgb), 0.16);
}

.top-achievers__head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px 12px;
}

.top-achievers__hint {
  font-size: 12px;
  color: var(--ds-text-faint);
}

.top-achievers__empty {
  padding: 12px 0;
  font-size: 13px;
  color: var(--ds-text-faint);
}

.top-achievers__grid {
  display: grid;
  gap: 10px;
}

@media (min-width: 768px) {
  .top-achievers__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

/* Картка призера: тон місця на обводці, кільці аватара та лічильнику. */
.achiever {
  --tile-tone: var(--ds-primary-rgb);

  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 96px;
  padding: 14px 14px 14px 16px;
  border-radius: 12px;
  border: 1px solid rgba(var(--tile-tone), 0.28);
  background:
    radial-gradient(circle at 100% 0%, rgba(var(--tile-tone), 0.14), transparent 55%),
    rgba(0, 0, 0, 0.3);
  color: inherit;
  transition:
    border-color var(--ds-duration-base) ease,
    box-shadow var(--ds-duration-base) ease,
    transform var(--ds-duration-base) var(--ds-ease-out);
}

.achiever:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(var(--tile-tone), 0.55);
}

@media (hover: hover) and (pointer: fine) {
  .achiever:hover {
    transform: translateY(-2px);
    border-color: rgba(var(--tile-tone), 0.6);
    box-shadow: 0 0 18px rgba(var(--tile-tone), 0.22);
  }
}

.achiever__place {
  position: absolute;
  top: -8px;
  left: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border-radius: 9999px;
  border: 1px solid rgba(var(--tile-tone), 0.5);
  background: var(--ds-surface);
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: rgb(var(--tile-tone));
}

.achiever__avatar {
  --el-avatar-bg-color: rgba(var(--tile-tone), 0.3);

  flex-shrink: 0;
  width: 44px;
  height: 44px;
  font-size: 16px;
  box-shadow: 0 0 0 2px var(--ds-surface), 0 0 0 3px rgba(var(--tile-tone), 0.55);
}

.achiever__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.achiever__name {
  font-size: 13px;
  font-weight: 600;
  color: var(--ds-text-strong);
}

.achiever__handle {
  font-size: 11px;
  color: var(--ds-text-faint);
}

.achiever__meta {
  margin-top: 2px;
  font-size: 11px;
  color: var(--ds-text-muted);
}

.achiever__count {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
}

.achiever__count-value {
  font-family: var(--ds-font-body);
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  color: rgb(var(--tile-tone));
  text-shadow: 0 0 12px rgba(var(--tile-tone), 0.5);
}

.achiever__count-label {
  font-family: var(--ds-font-mono);
  font-size: 9px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

@media (prefers-reduced-motion: no-preference) {
  .achiever {
    animation: achiever-in 520ms var(--ds-ease-out) both;
    animation-delay: var(--tile-delay);
  }

  @keyframes achiever-in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }

    to {
      opacity: 1;
      transform: none;
    }
  }
}
</style>
