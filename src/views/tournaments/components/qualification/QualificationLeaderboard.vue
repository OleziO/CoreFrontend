<template>
  <aside
    class="qual-lb flex flex-col rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#141c2e] to-[#0e1420]
      shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] overflow-hidden min-h-0"
    aria-label="Турнірна таблиця кваліфікації"
  >
    <header
      class="shrink-0 px-16 py-14 border-b border-white/[0.06] bg-[#0f1626]/80 backdrop-blur-sm"
    >
      <h4 class="text-sm font-bold tracking-tight text-white">
        Лідерборд
      </h4>
      <p class="text-[11px] text-gray-500 mt-4 leading-snug">
        Розподіл за місцями. Очки з’являться після підключення розрахунку.
      </p>
    </header>

    <div
      class="flex-1 min-h-0 flex flex-col min-w-0 border-t border-white/[0.04] bg-black/[0.12] px-12 sm:px-14"
    >
      <div
        class="qual-lb-colhead shrink-0 grid grid-cols-2 gap-x-8 items-end
          qual-lb-grid-pad py-10 border-b border-white/[0.06]"
      >
        <span
          class="min-w-0 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500 leading-none pb-1"
        >
          Команда
        </span>
        <span
          class="text-[10px] mr-14 font-bold uppercase tracking-[0.16em] text-gray-500 text-right leading-none pb-1
            tabular-nums"
        >
          Очки
        </span>
      </div>

      <div
        class="qual-lb-scroll flex-1 min-h-0 overflow-y-auto custom-lb-scroll py-12 sm:py-14 flex flex-col gap-14
          max-h-[52vh] lg:max-h-[min(70vh,680px)]"
      >
        <section
          v-for="block in sectionBlocks"
          :key="block.key"
          class="rounded-xl border overflow-hidden"
          :class="block.shellClass"
        >
          <div
            class="py-8 flex items-center justify-between gap-8 border-b qual-lb-grid-pad"
            :class="block.headerRowClass"
          >
            <span class="text-[11px] font-bold uppercase tracking-[0.14em]" :class="block.labelClass">
              {{ block.label }}
            </span>
            <span class="text-[10px] text-gray-600 font-medium tabular-nums">
              {{ block.teams.length }}
              {{ pluralTeams(block.teams.length) }}
            </span>
          </div>

          <ul class="divide-y divide-white/[0.05]" role="list">
            <li
              v-for="(team, idx) in block.teams"
              :key="team.id"
              class="qual-lb-row grid grid-cols-[1.75rem_minmax(0,1fr)_2.75rem] gap-x-8 items-center qual-lb-grid-pad
                py-10 sm:py-11 transition-colors duration-150"
            >
              <span
                class="shrink-0 flex size-24 rounded-full items-center justify-center text-[12px] font-bold
                border justify-self-start"
                :class="block.rankBadgeClass"
              >
                {{ block.startRank + idx }}
              </span>
              <div class="min-w-0">
                <span class="text-[13px] sm:text-sm font-semibold text-gray-100 truncate block">
                  {{ team.name }}
                </span>
              </div>
              <span
                class="shrink-0 text-sm font-semibold tabular-nums text-gray-500 tracking-wide text-right"
              >
                —
              </span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { TTeam } from '@/api/types/api.types'

const props = defineProps<{
  teams: TTeam[]
}>()

type BlockKey = 'p1_4' | 'p5_8' | 'p9p'

interface LeaderboardBlock {
  key: BlockKey
  label: string
  teams: TTeam[]
  startRank: number
  shellClass: string
  headerRowClass: string
  labelClass: string
  rankBadgeClass: string
}

type LeaderboardMeta = Omit<LeaderboardBlock, 'teams' | 'startRank'>

const sectionBlocks = computed((): LeaderboardBlock[] => {
  const list = props.teams
  const raw: LeaderboardMeta[] = [
    {
      key: 'p1_4',
      label: '1–4 місце',
      shellClass: 'border-amber-500/15 bg-amber-500/[0.03]',
      headerRowClass: 'border-amber-500/10 bg-gradient-to-r from-amber-500/10 via-amber-500/[0.04] to-transparent',
      labelClass: 'text-amber-200/95',
      rankBadgeClass: 'border-amber-500/25 bg-amber-500/10 text-amber-100'
    },
    {
      key: 'p5_8',
      label: '5–8 місце',
      shellClass: 'border-cyan-500/15 bg-cyan-500/[0.03]',
      headerRowClass: 'border-cyan-500/10 bg-gradient-to-r from-cyan-500/10 via-cyan-500/[0.04] to-transparent',
      labelClass: 'text-cyan-200/90',
      rankBadgeClass: 'border-cyan-500/25 bg-cyan-500/10 text-cyan-100'
    },
    {
      key: 'p9p',
      label: '9+ місце',
      shellClass: 'border-white/[0.08] bg-white/[0.02]',
      headerRowClass: 'border-white/[0.06] bg-white/[0.03]',
      labelClass: 'text-gray-400',
      rankBadgeClass: 'border-white/10 bg-white/[0.05] text-gray-300'
    }
  ]

  const slices: [number, number][] = [
    [0, 4],
    [4, 8],
    [8, list.length]
  ]

  const withTeams = raw
    .map((meta, i) => {
      const [a, b] = slices[i]!
      return { ...meta, teams: list.slice(a, b) }
    })
    .filter((b) => b.teams.length > 0)

  /** Нумерація без «дірок»: після 1–2 у верхньому блоці наступний блок починається з 3, а не з 5. */
  let nextRank = 1
  return withTeams.map((block) => {
    const startRank = nextRank
    nextRank += block.teams.length
    return { ...block, startRank }
  })
})

function pluralTeams (n: number): string {
  if (n === 1) return 'команда'
  if (n >= 2 && n <= 4) return 'команди'
  return 'команд'
}
</script>

<style scoped>
.custom-lb-scroll {
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.35) transparent;
}

.custom-lb-scroll::-webkit-scrollbar {
  width: 6px;
}

.custom-lb-scroll::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.28);
  border-radius: 999px;
}

.qual-lb-row:hover {
  background: rgba(255, 255, 255, 0.03);
}

/** Один відступ для рядка колонок і рядків списку — вирівнювання «Команда» / «Очки» з даними. */
.qual-lb-grid-pad {
  padding-left: 0.75rem;
  padding-right: 0.75rem;
}

@media (min-width: 640px) {
  .qual-lb-grid-pad {
    padding-left: 0.875rem;
    padding-right: 0.875rem;
  }
}
</style>
