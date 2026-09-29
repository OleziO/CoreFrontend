<template>
  <div class="hero-tile" :class="{ 'is-highlighted': highlighted, 'is-empty': !hero }">
    <span class="hero-tile__label">{{ label }}</span>
    <div class="hero-tile__body">
      <span class="hero-tile__portrait">
        <img
          v-if="hero && !broken"
          :src="duelHeroImageUrl(hero)"
          :alt="hero.localizedName"
          loading="lazy"
          @error="broken = true"
        >
        <PhQuestion v-else :size="20" weight="bold" class="text-white/40" />
      </span>
      <span class="hero-tile__name">{{ hero?.localizedName ?? '—' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhQuestion } from '@phosphor-icons/vue'
import { duelHeroImageUrl } from '@/views/duels/duels.utils'
import type { TDuelHero } from '@/api/types/api.types'

const props = withDefaults(defineProps<{
  hero: TDuelHero | null
  label: string
  /** Мій герой — підсвічений основним кольором. */
  highlighted?: boolean
}>(), {
  highlighted: false
})

const broken = ref(false)
watch(() => props.hero?.heroId, () => {
  broken.value = false
})
</script>

<style scoped>
.hero-tile {
  --tone: 148, 163, 184;

  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(var(--tone), 0.25);
  background: rgba(var(--tone), 0.05);
}

.hero-tile.is-highlighted {
  --tone: var(--ds-primary-rgb);

  box-shadow: 0 0 14px rgba(var(--tone), 0.15);
}

.hero-tile__label {
  font-family: var(--ds-font-mono);
  font-size: 9px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.hero-tile__body {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.hero-tile__portrait {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 36px;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.35);
  box-shadow: inset 0 0 0 1px rgba(var(--tone), 0.4);
}

.hero-tile__portrait img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-tile__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 15px;
  font-weight: 700;
  color: var(--ds-text-strong);
}

.hero-tile.is-highlighted .hero-tile__name {
  color: var(--ds-primary);
  text-shadow: var(--ds-neon-text-subtle);
}
</style>
