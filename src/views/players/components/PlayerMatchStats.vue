<template>
  <div class="neon-card hud-corners flex w-full flex-col items-stretch gap-16 rounded-2xl p-20 2md:p-24">
    <h3 class="section-title">
      Статистика
    </h3>

    <div
      class="
        grid w-full grid-cols-2 gap-10
        2md:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)_minmax(0,1fr)]
        2md:items-stretch
      "
    >
      <!-- Матчі: на мобільному на всю ширину; перемоги та поразки — в один рядок під ним -->
      <div class="stat-tile col-span-2 2md:col-span-1">
        <span class="sys-label sys-label--muted !text-[9px]">Матчі</span>
        <p class="stat-tile__value inline-flex max-w-full flex-wrap items-baseline justify-center gap-x-8">
          <span class="text-white">{{ matchStats.total }}</span>
          <span class="stat-tile__pct" :class="matchStats.winrateClass">{{ matchStats.winrateText }}%</span>
        </p>
      </div>

      <!-- Перемоги -->
      <div class="stat-tile stat-tile--win">
        <span class="sys-label sys-label--muted !text-[9px]">Перемоги</span>
        <span class="stat-tile__value text-success">{{ matchStats.wins }}</span>
      </div>

      <!-- Поразки -->
      <div class="stat-tile stat-tile--loss">
        <span class="sys-label sys-label--muted !text-[9px]">Поразки</span>
        <span class="stat-tile__value text-error">{{ matchStats.losses }}</span>
      </div>
    </div>

    <!-- Вінрейт: перемоги (зелений) проти поразок (червоний) в одній смузі -->
    <div class="flex flex-col gap-6">
      <div class="flex items-center justify-between">
        <span class="sys-label sys-label--muted !text-[9px]">Вінрейт</span>
        <span class="font-mono text-[11px] tabular-nums text-white/70">
          {{ matchStats.wins }}W · {{ matchStats.losses }}L
        </span>
      </div>
      <div
        class="winrate-bar"
        role="progressbar"
        :aria-valuenow="winratePct"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-label="`Вінрейт ${matchStats.winrateText}%`"
      >
        <div class="winrate-bar__fill" :style="{ width: `${winratePct}%` }" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface IMatchStats {
  total: number
  wins: number
  losses: number
  winrateText: string | number
  winrateClass: string
}

interface IProps {
  matchStats: IMatchStats
}

const props = defineProps<IProps>()

const winratePct = computed(() => {
  const { wins, total } = props.matchStats
  return total > 0 ? Math.round((wins * 100) / total) : 0
})
</script>

<style scoped lang="scss">
// HUD tile: dark inset well with a cyan hairline; win / loss tiles tint the
// hairline and carry a faint halo in their status colour.
.stat-tile {
  @apply flex h-full min-h-[96px] min-w-0 flex-col items-center justify-center gap-10
    rounded-xl border px-14 py-16 text-center;
  --tile-tone: var(--ds-primary-rgb);
  border-color: rgba(var(--tile-tone), 0.16);
  background: rgba(0, 0, 0, 0.3);
  box-shadow: inset 0 1px 0 rgba(var(--tile-tone), 0.12);
  transition:
    border-color var(--ds-duration-base) ease,
    box-shadow var(--ds-duration-base) ease,
    transform var(--ds-duration-base) var(--ds-ease-out);

  &--win {
    --tile-tone: 34, 197, 94;
  }

  &--loss {
    --tile-tone: 239, 68, 68;
  }
}

@media (hover: hover) and (pointer: fine) {
  .stat-tile:hover {
    transform: translateY(-1px);
    border-color: rgba(var(--tile-tone), 0.45);
    box-shadow: inset 0 1px 0 rgba(var(--tile-tone), 0.2), 0 0 16px rgba(var(--tile-tone), 0.18);
  }
}

.stat-tile__value {
  font-family: var(--ds-font-display);
  font-size: 26px;
  line-height: 1;
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 12px rgba(var(--tile-tone), 0.35);
}

.stat-tile__pct {
  font-family: var(--ds-font-mono);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.winrate-bar {
  @apply relative h-6 w-full overflow-hidden rounded-full;
  background: rgba(239, 68, 68, 0.28);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
}

.winrate-bar__fill {
  @apply h-full rounded-full;
  background: linear-gradient(90deg, #16a34a, #22c55e 60%, #4ade80);
  box-shadow: 0 0 10px rgba(34, 197, 94, 0.55);
  transition: width 0.6s var(--ds-ease-out);
}
</style>
