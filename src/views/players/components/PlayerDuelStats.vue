<template>
  <div class="neon-card hud-corners flex w-full flex-col items-stretch gap-14 rounded-2xl p-16 2md:p-20">
    <div class="flex flex-wrap items-center justify-between gap-10">
      <h3 class="section-title">
        <span class="inline-flex items-center gap-6">
          1v1 Ліга
          <el-tooltip
            placement="top"
            effect="dark"
            :show-after="180"
            content="Рейтингові дуелі Solo Mid, які хостить бот ліги: +25 за перемогу, −25 за поразку."
          >
            <PhQuestion
              class="cursor-help text-white/40 transition-colors hover:text-primary"
              weight="bold"
              :size="14"
            />
          </el-tooltip>
        </span>
      </h3>
      <RouterLink :to="{ name: routeNames.duels }" class="no-underline">
        <el-button size="small">
          <PhSword :size="14" weight="bold" />
          <span class="ml-6">До ліги</span>
        </el-button>
      </RouterLink>
    </div>

    <!-- Завантаження -->
    <div v-if="isPending" class="flex flex-col gap-10">
      <span class="skeleton-bone block h-[64px] !rounded-xl" />
      <span v-for="n in 3" :key="n" class="skeleton-bone block h-[44px] !rounded-xl" />
    </div>

    <p v-else-if="isError" class="py-10 text-center text-sm text-error">
      Не вдалося завантажити 1v1 статистику. Спробуйте пізніше.
    </p>

    <!-- Ще не грав -->
    <el-empty
      v-else-if="!rating"
      description="Гравець ще не виходив на 1v1 арену."
      :image-size="100"
    />

    <template v-else>
      <!-- Зведення -->
      <div class="duel-stats__summary">
        <div class="duel-stats__cell duel-stats__cell--rating">
          <span class="duel-stats__label">Рейтинг</span>
          <DuelRatingBadge :rating="rating.rating" :streak="rating.streak" size="lg" />
        </div>
        <div class="duel-stats__cell">
          <span class="duel-stats__label">W – L</span>
          <span class="duel-stats__value">
            <span class="text-success">{{ rating.wins }}</span>
            <span class="text-white/40"> – </span>
            <span class="text-white/70">{{ rating.losses }}</span>
          </span>
        </div>
        <div class="duel-stats__cell">
          <span class="duel-stats__label">Вінрейт</span>
          <span class="duel-stats__value">{{ formatDuelPercent(rating.winrate) }}</span>
        </div>
        <div class="duel-stats__cell">
          <span class="duel-stats__label">Серія</span>
          <span
            class="duel-stats__value"
            :class="rating.streak > 0 ? 'text-success' : rating.streak < 0 ? 'text-error' : ''"
          >
            {{ formatDuelStreak(rating.streak) }}
          </span>
        </div>
      </div>

      <!-- Останні дуелі -->
      <div class="flex flex-col gap-8">
        <span class="sys-label sys-label--muted">// Останні дуелі</span>
        <DuelHistoryList :duels="recent" :player-id="playerId" empty-text="Дуелей ще не було" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { PhQuestion, PhSword } from '@phosphor-icons/vue'
import { routeNames } from '@/router/route-names'
import { useGetDuelPlayerProfile } from '@/views/duels/duels.queries'
import { formatDuelPercent, formatDuelStreak } from '@/views/duels/duels.utils'
import DuelHistoryList from '@/views/duels/components/DuelHistoryList.vue'
import DuelRatingBadge from '@/views/duels/components/DuelRatingBadge.vue'
import type { TDuel } from '@/api/types/api.types'

const props = defineProps<{
  playerId: string | null
}>()

const profile = useGetDuelPlayerProfile(() => props.playerId)

const isPending = computed(() => !!props.playerId && profile.isPending.value)
const isError = computed(() => !!props.playerId && !!profile.error.value)
const rating = computed(() => profile.data.value?.rating ?? null)
const recent = computed<TDuel[]>(() => profile.data.value?.recent ?? [])
</script>

<style scoped>
.duel-stats__summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

@media (min-width: 640px) {
  .duel-stats__summary {
    grid-template-columns: minmax(0, 1.4fr) repeat(3, minmax(0, 1fr));
  }
}

.duel-stats__cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.25);
}

.duel-stats__cell--rating {
  grid-column: 1 / -1;
}

@media (min-width: 640px) {
  .duel-stats__cell--rating {
    grid-column: auto;
  }
}

.duel-stats__label {
  font-family: var(--ds-font-mono);
  font-size: 9px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.duel-stats__value {
  font-family: var(--ds-font-mono);
  font-size: 18px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-strong);
}
</style>
