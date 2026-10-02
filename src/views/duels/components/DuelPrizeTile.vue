<template>
  <component
    :is="href ? 'a' : 'span'"
    class="dprize-tile no-underline"
    :class="[`dprize-tile--${prize.kind}`, { 'dprize-tile--link': !!href }]"
    v-bind="href ? { href, target: '_blank', rel: 'noopener noreferrer nofollow' } : {}"
    :title="`Приз за ${prize.place} місце: ${duelPrizeLabel(prize)}`"
    @click.stop
  >
    <!-- Картинка призу на підкладці (видно крізь прозорий PNG); без картинки — корона VIP або подарунок -->
    <span class="dprize-tile__media">
      <img
        v-if="imageSrc"
        :src="imageSrc"
        alt=""
        loading="lazy"
        class="dprize-tile__img"
        :class="{ 'dprize-tile__img--contain': mayBeTransparent }"
        @error="imageFailed = true"
      >
      <PhCrown v-else-if="prize.kind === 'vip'" :size="20" weight="fill" aria-hidden="true" />
      <PhGift v-else :size="20" weight="fill" aria-hidden="true" />
    </span>

    <span class="dprize-tile__title">{{ title }}</span>
  </component>
</template>

<script setup lang="ts">
import { PhCrown, PhGift } from '@phosphor-icons/vue'
import { resolvePublicOrApiUrl } from '@/core/helpers'
import { duelPrizeLabel } from '@/views/duels/duels.utils'
import type { TDuelTournamentPrize } from '@/api/types/api.types'

const props = defineProps<{
  prize: TDuelTournamentPrize
}>()

/** Формати, що можуть мати прозорість: вписуємо на підкладку, а не обрізаємо на весь квадрат. */
const TRANSPARENT_FORMATS = /\.(png|webp|svg|gif|avif)(\?|#|$)/i

const imageFailed = ref(false)
watch(() => props.prize.imageUrl, () => { imageFailed.value = false })

const imageSrc = computed(() => {
  if (props.prize.kind !== 'custom' || !props.prize.imageUrl || imageFailed.value) return ''
  return resolvePublicOrApiUrl(props.prize.imageUrl)
})

const mayBeTransparent = computed(() => TRANSPARENT_FORMATS.test(props.prize.imageUrl ?? ''))

const href = computed(() => (props.prize.kind === 'custom' && props.prize.linkUrl) || '')

const title = computed(() => (
  props.prize.kind === 'vip' ? `VIP · ${props.prize.vipMonths ?? 0} міс.` : props.prize.title || 'Приз'
))
</script>

<style scoped>
.dprize-tile {
  --tone: var(--tile-tone, var(--ds-primary-rgb));

  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  max-width: 220px;
  min-width: 0;
  height: 44px;
  padding: 3px 10px 3px 3px;
  border: 1px solid rgba(var(--tone), 0.22);
  border-radius: 10px;
  background: linear-gradient(90deg, rgba(var(--tone), 0.12), rgba(var(--tone), 0.02) 70%);
  color: var(--ds-text-strong);
  text-align: left;
  transition:
    border-color var(--ds-duration-fast) ease,
    background-color var(--ds-duration-fast) ease,
    box-shadow var(--ds-duration-fast) ease,
    transform var(--ds-duration-press) var(--ds-ease-out);
}

.dprize-tile__media {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  overflow: hidden;
  border-radius: 8px;
  /* Підкладка: світла пляма в тоні місця — прозорий PNG і іконка-заглушка не «губляться» на темному. */
  background:
    radial-gradient(circle at 50% 35%, rgba(255, 255, 255, 0.18), transparent 70%),
    linear-gradient(160deg, rgba(var(--tone), 0.35), rgba(var(--tone), 0.08));
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  color: rgb(var(--tone));
}

.dprize-tile--vip .dprize-tile__media {
  background: linear-gradient(135deg, rgba(255, 206, 84, 0.9), rgba(255, 94, 170, 0.85));
  color: #1a1206;
}

.dprize-tile__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dprize-tile__img--contain {
  padding: 3px;
  object-fit: contain;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.45));
}

.dprize-tile__title {
  display: -webkit-box;
  min-width: 0;
  overflow: hidden;
  font-family: var(--ds-font-display);
  font-size: 12px;
  line-height: 1.2;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.dprize-tile--vip .dprize-tile__title {
  color: rgb(255, 226, 150);
}

.dprize-tile--link {
  cursor: pointer;
}

.dprize-tile--link:active {
  transform: scale(0.97);
}

.dprize-tile--link:focus-visible {
  outline: 2px solid rgba(var(--ds-primary-rgb), 0.7);
  outline-offset: 2px;
}

@media (hover: hover) and (pointer: fine) {
  .dprize-tile--link:hover {
    border-color: rgba(var(--tone), 0.6);
    box-shadow: 0 0 14px rgba(var(--tone), 0.2);
  }

  .dprize-tile--link:hover .dprize-tile__title {
    color: rgb(var(--tone));
  }
}
</style>
