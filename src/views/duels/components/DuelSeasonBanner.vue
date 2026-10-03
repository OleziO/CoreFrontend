<template>
  <div class="dseason" :class="{ 'dseason--closing': season.closing }">
    <div class="dseason__head">
      <PhTrophy :size="18" weight="duotone" class="dseason__icon" aria-hidden="true" />
      <div class="min-w-0">
        <p class="dseason__title">{{ duelSeasonTitle(season) }}</p>
        <p class="dseason__range">{{ formatDuelSeasonRange(season) }}</p>
      </div>
      <span v-if="season.closing" class="dseason__badge dseason__badge--closing">
        Підбиваємо підсумки
      </span>
      <span v-else-if="timeLeft" class="dseason__badge">{{ timeLeft }}</span>
    </div>

    <ul v-if="season.prizes.length" class="dseason__prizes">
      <li v-for="prize in season.prizes" :key="prize.place" class="dseason__prize">
        <span class="dseason__place">#{{ prize.place }}</span>
        <DuelPrizeChip :prize="prize" />
      </li>
    </ul>
    <p v-else class="dseason__hint">Призи сезону ще не оголошено.</p>

    <p class="dseason__hint">
      Наприкінці місяця таблиця фіксується, VIP-призи видаються автоматично, а рейтинг і історія дуелей
      починаються з нуля.
    </p>
  </div>
</template>

<script setup lang="ts">
import { PhTrophy } from '@phosphor-icons/vue'
import { duelSeasonTimeLeft, duelSeasonTitle, formatDuelSeasonRange } from '@/views/duels/duels.utils'
import DuelPrizeChip from '@/views/duels/components/DuelPrizeChip.vue'
import type { TDuelSeason } from '@/api/types/api.types'

const props = defineProps<{
  season: TDuelSeason
}>()

const now = useNow({ interval: 60_000 })
const timeLeft = computed(() => duelSeasonTimeLeft(props.season.endsAt, now.value))
</script>

<style scoped>
.dseason {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid rgba(255, 206, 84, 0.22);
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(255, 206, 84, 0.08), rgba(255, 206, 84, 0.02));
}

.dseason--closing {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.03);
}

.dseason__head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dseason__icon {
  flex-shrink: 0;
  color: rgb(255, 206, 84);
}

.dseason__title {
  font-family: var(--ds-font-display);
  font-size: 16px;
  line-height: 1.2;
  letter-spacing: 0.02em;
  color: var(--ds-text-strong);
}

.dseason__range {
  font-family: var(--ds-font-mono);
  font-size: 11px;
  color: var(--ds-text-faint);
}

.dseason__badge {
  flex-shrink: 0;
  margin-left: auto;
  padding: 3px 9px;
  border-radius: 9999px;
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: rgb(255, 206, 84);
  background: rgba(255, 206, 84, 0.12);
}

.dseason__badge--closing {
  color: var(--ds-text-muted);
  background: rgba(255, 255, 255, 0.06);
}

.dseason__prizes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
}

.dseason__prize {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  max-width: 100%;
}

.dseason__place {
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-weight: 600;
  color: var(--ds-text-muted);
}

.dseason__hint {
  font-size: 12px;
  line-height: 1.45;
  color: var(--ds-text-faint);
}
</style>
