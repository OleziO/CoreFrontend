<template>
  <div
    class="
      rounded-2xl
      border border-gray-800/90
      bg-gradient-to-br from-gray-900/90 via-gray-900/50 to-gray-950/90
      p-20 2md:p-24
      shadow-[0_10px_30px_rgba(0,0,0,0.35)] w-full
      flex flex-col items-stretch gap-16
    "
  >
    <h3
      class="text-center text-[14px] font-medium uppercase tracking-[0.22em] text-gray-500"
    >
      Статистика
    </h3>

    <div
      class="
        grid w-full grid-cols-2 gap-10 mt-20
        2md:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)_minmax(0,1fr)]
        2md:items-stretch 2md:gap-10
      "
    >
      <!-- Матчі: на мобільному на всю ширину; перемоги та поразки — в один рядок під ним -->
      <div
        class="col-span-2 2md:col-span-1 2md:min-w-0
          group flex min-h-0 min-w-0 flex-col
        "
      >
        <div
          class="
            flex h-full min-h-[96px] flex-col items-center justify-center
            gap-8 rounded-xl border border-white/10
            bg-gradient-to-b from-white/[0.08] to-white/[0.02]
            px-14 py-16
            shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]
            transition duration-200
            hover:-translate-y-px hover:border-white/15
          "
        >
          <span
            class="text-center text-[10px] font-medium uppercase leading-tight
                tracking-widest text-gray-500"
          >
            Матчі
          </span>

          <p
            class="inline-flex max-w-full flex-wrap items-baseline justify-center gap-x-1.5
              text-center text-base font-medium tabular-nums leading-none tracking-tight
              text-white/95"
          >
            <span>{{ matchStats.total }}</span>
            <span :class="matchStats.winrateClass">
              ({{ matchStats.winrateText }}%)
            </span>
          </p>
        </div>
      </div>

      <!-- Перемоги -->
      <div
        class="2md:min-w-0 group flex min-w-0 flex-col"
      >
        <div
          class="
            flex h-full min-h-[96px] flex-col items-center justify-center
            gap-8 rounded-xl border border-white/10
            bg-gradient-to-b from-white/[0.08] to-white/[0.02]
            px-14 py-16
            shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]
            transition duration-200
            hover:-translate-y-px hover:border-white/15
          "
        >
          <span
            class="text-center text-[10px] font-medium uppercase leading-tight
              tracking-widest text-gray-500"
          >
            Перемоги
          </span>
          <span
            class="text-base font-medium tabular-nums leading-none
              text-green-300/90"
          >
            {{ matchStats.wins }}
          </span>
        </div>
      </div>

      <!-- Поразки -->
      <div
        class="2md:min-w-0 group flex min-w-0 flex-col"
      >
        <div
          class="
            flex h-full min-h-[96px] flex-col items-center justify-center
            gap-8 rounded-xl border border-white/10
            bg-gradient-to-b from-white/[0.08] to-white/[0.02]
            px-14 py-16
            shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]
            transition duration-200
            hover:-translate-y-px hover:border-white/15
          "
        >
          <span
            class="text-center text-[10px] font-medium uppercase leading-tight
              tracking-widest text-gray-500"
          >
            Поразки
          </span>
          <span
            class="text-base font-medium tabular-nums leading-none
              text-red-300/90"
          >
            {{ matchStats.losses }}
          </span>
        </div>
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

defineProps<IProps>()
</script>
