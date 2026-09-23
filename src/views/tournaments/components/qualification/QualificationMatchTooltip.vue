<template>
  <div class="qual-match-tip">
    <span class="qual-match-tip__eyebrow">// Матч</span>

    <ul class="qual-match-tip__rows">
      <li class="qual-match-tip__row is-win">
        <span class="qual-match-tip__thumb">
          <img v-if="winnerLogo" :src="winnerLogo" alt="" loading="lazy" decoding="async">
          <PhUsersThree v-else :size="12" weight="duotone" />
        </span>
        <span class="qual-match-tip__name">{{ winner?.name ?? '—' }}</span>
        <span class="qual-match-tip__result">
          <PhTrophy :size="10" weight="fill" aria-hidden="true" />
          Перемога
        </span>
      </li>
      <li class="qual-match-tip__row is-loss">
        <span class="qual-match-tip__thumb">
          <img v-if="loserLogo" :src="loserLogo" alt="" loading="lazy" decoding="async">
          <PhUsersThree v-else :size="12" weight="duotone" />
        </span>
        <span class="qual-match-tip__name">{{ loser?.name ?? '—' }}</span>
        <span class="qual-match-tip__result">Поразка</span>
      </li>
    </ul>

    <a
      v-if="dotabuffUrl"
      :href="dotabuffUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="qual-match-tip__link"
    >
      <Icon name="dotabuff" :size="12" />
      <span>Dotabuff</span>
      <span class="qual-match-tip__id">#{{ match.dotaMatchId }}</span>
      <PhArrowSquareOut :size="11" weight="bold" aria-hidden="true" />
    </a>
    <span v-else class="qual-match-tip__nolink">Без ID матчу Dota 2</span>
  </div>
</template>

<script setup lang="ts">
import { PhArrowSquareOut, PhTrophy, PhUsersThree } from '@phosphor-icons/vue'
import type { TQualificationMatch } from '@/api/types/api.types'
import { getDotabuffMatchUrl, resolvePublicOrApiUrl } from '@/core/helpers'

const props = defineProps<{
  match: TQualificationMatch
}>()

const winner = computed(() => props.match.winner)

// Той, хто не переможець. Порівнюємо за id — об'єкти команд у матчі та у `winner`
// можуть бути різними інстансами після ручного мержу відповіді бекенду.
const loser = computed(() => {
  const { teamA, teamB, winner: w } = props.match
  if (!w) return null
  return teamA?.id === w.id ? teamB : teamA
})

const winnerLogo = computed(() => resolvePublicOrApiUrl(winner.value?.logoUrl))
const loserLogo = computed(() => resolvePublicOrApiUrl(loser.value?.logoUrl))

const dotabuffUrl = computed(() => getDotabuffMatchUrl(props.match.dotaMatchId))
</script>

<style scoped lang="scss">
.qual-match-tip {
  @apply flex flex-col gap-8 px-12 py-10;
  min-width: 220px;
  max-width: 280px;
}

.qual-match-tip__eyebrow {
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--ds-primary);
  text-shadow: var(--ds-neon-text-subtle);
}

.qual-match-tip__rows {
  @apply m-0 flex list-none flex-col gap-4 p-0;
}

.qual-match-tip__row {
  @apply flex items-center gap-8 rounded-lg px-8 py-6;
  --tip-tone: 255, 255, 255;
  background: rgba(var(--tip-tone), 0.06);
  box-shadow: inset 0 0 0 1px rgba(var(--tip-tone), 0.16);

  &.is-win {
    --tip-tone: 34, 197, 94;
  }

  &.is-loss {
    --tip-tone: 239, 68, 68;
  }
}

.qual-match-tip__thumb {
  @apply inline-flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: var(--ds-overlay);
  color: rgba(var(--ds-primary-rgb), 0.45);

  img {
    @apply size-full object-cover object-center;
    display: block;
  }
}

.qual-match-tip__name {
  @apply min-w-0 flex-1 truncate;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--ds-text-strong);
}

.is-loss .qual-match-tip__name {
  color: var(--ds-text-muted);
}

.qual-match-tip__result {
  @apply inline-flex shrink-0 items-center gap-4;
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(var(--tip-tone), 1);
}

.is-win .qual-match-tip__result {
  color: #4ade80;
  text-shadow: 0 0 8px rgba(34, 197, 94, 0.45);
}

.is-loss .qual-match-tip__result {
  color: #f87171;
}

// Посилання на Dotabuff — HUD-чіп на всю ширину; тултіп `enterable`, тож на нього можна навести.
.qual-match-tip__link {
  @apply inline-flex items-center gap-6 rounded-lg px-8 py-6 no-underline;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ds-primary);
  background: rgba(var(--ds-primary-rgb), 0.08);
  box-shadow: inset 0 0 0 1px rgba(var(--ds-primary-rgb), 0.3);
  transition: background-color var(--ds-duration-fast) ease, box-shadow var(--ds-duration-fast) ease;

  svg:last-child {
    margin-left: auto;
    opacity: 0.7;
  }

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.6);
    outline-offset: 2px;
  }
}

.qual-match-tip__id {
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  text-transform: none;
  color: var(--ds-text-muted);
}

.qual-match-tip__nolink {
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

@media (hover: hover) and (pointer: fine) {
  .qual-match-tip__link:hover {
    background: rgba(var(--ds-primary-rgb), 0.16);
    box-shadow: inset 0 0 0 1px rgba(var(--ds-primary-rgb), 0.6), var(--ds-glow-primary-soft);
  }
}
</style>

<style lang="scss">
// Не scoped: поппер рендериться в body. Прибираємо стандартний паддінг тултіпа
// і кладемо картку на темне скло з ціановою волосиною.
.el-popper.qual-match-tip-popper {
  padding: 0 !important;
  border-radius: 12px;
  border: 1px solid rgba(var(--ds-primary-rgb), 0.28) !important;
  background: rgba(13, 15, 28, 0.94) !important;
  box-shadow: var(--ds-elevation-3), var(--ds-glow-primary-soft);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);

  .el-popper__arrow::before {
    background: rgba(13, 15, 28, 0.94) !important;
    border-color: rgba(var(--ds-primary-rgb), 0.28) !important;
  }
}
</style>
