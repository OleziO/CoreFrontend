<template>
  <a
    v-if="prize.kind === 'custom' && prize.linkUrl"
    :href="prize.linkUrl"
    target="_blank"
    rel="noopener noreferrer nofollow"
    class="dprize-chip dprize-chip--custom no-underline"
    :class="`dprize-chip--${size}`"
    :title="`Приз за ${prize.place} місце: ${duelPrizeLabel(prize)}`"
    @click.stop
  >
    <img v-if="prize.imageUrl" :src="resolvePublicOrApiUrl(prize.imageUrl)" alt="" class="dprize-chip__thumb">
    <PhGift v-else :size="iconSize" weight="fill" aria-hidden="true" />
    <span class="dprize-chip__text">{{ duelPrizeLabel(prize) }}</span>
    <PhArrowSquareOut :size="iconSize" class="dprize-chip__out" aria-hidden="true" />
  </a>

  <span
    v-else
    class="dprize-chip"
    :class="[`dprize-chip--${size}`, prize.kind === 'vip' ? 'dprize-chip--vip' : 'dprize-chip--custom']"
    :title="`Приз за ${prize.place} місце: ${duelPrizeLabel(prize)}`"
  >
    <PhCrown v-if="prize.kind === 'vip'" :size="iconSize" weight="fill" aria-hidden="true" />
    <PhGift v-else :size="iconSize" weight="fill" aria-hidden="true" />
    <span class="dprize-chip__text">
      {{ prize.kind === 'vip' ? `VIP · ${prize.vipMonths ?? 0} міс.` : duelPrizeLabel(prize) }}
    </span>
  </span>
</template>

<script setup lang="ts">
import { PhArrowSquareOut, PhCrown, PhGift } from '@phosphor-icons/vue'
import { resolvePublicOrApiUrl } from '@/core/helpers'
import { duelPrizeLabel } from '@/views/duels/duels.utils'
import type { TDuelTournamentPrize } from '@/api/types/api.types'

const props = withDefaults(defineProps<{
  prize: TDuelTournamentPrize
  size?: 'sm' | 'md'
}>(), {
  size: 'sm'
})

const iconSize = computed(() => (props.size === 'md' ? 14 : 11))
</script>

<style scoped>
.dprize-chip {
  --vip-gold: 255, 206, 84;
  --vip-rose: 255, 94, 170;

  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 5px;
  max-width: 100%;
  min-width: 0;
  border-radius: 9999px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}

.dprize-chip--sm {
  padding: 3px 8px 3px 6px;
  font-size: 11px;
}

.dprize-chip--md {
  padding: 5px 12px 5px 8px;
  font-size: 13px;
  gap: 6px;
}

.dprize-chip__text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* VIP — та сама «фольга», що й у VipBadge, щоб приз читався як справжній VIP. */
.dprize-chip--vip {
  border: 1px solid rgba(var(--vip-gold), 0.6);
  background: linear-gradient(120deg, rgba(var(--vip-gold), 0.2), rgba(var(--vip-rose), 0.18));
  color: rgb(255, 226, 150);
  text-shadow: 0 0 8px rgba(var(--vip-gold), 0.45);
}

.dprize-chip--custom {
  border: 1px solid rgba(var(--ds-primary-rgb), 0.35);
  background: rgba(var(--ds-primary-rgb), 0.1);
  color: var(--ds-text-strong);
}

a.dprize-chip--custom {
  transition: border-color var(--ds-duration-base) ease, background-color var(--ds-duration-base) ease;
}

a.dprize-chip--custom:hover {
  border-color: rgba(var(--ds-primary-rgb), 0.7);
  background: rgba(var(--ds-primary-rgb), 0.18);
}

a.dprize-chip--custom:focus-visible {
  outline: 2px solid rgba(var(--ds-primary-rgb), 0.7);
  outline-offset: 2px;
}

.dprize-chip__thumb {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  object-fit: cover;
}

.dprize-chip--md .dprize-chip__thumb {
  width: 20px;
  height: 20px;
}

.dprize-chip__out {
  flex-shrink: 0;
  opacity: 0.6;
}
</style>
