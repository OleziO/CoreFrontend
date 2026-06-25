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
        Розподіл за місцями. Очки — сума очок гравців команди в кваліфікації.
      </p>
    </header>

    <div
      class="flex-1 min-h-0 flex flex-col min-w-0 border-t border-white/[0.04] bg-black/[0.12] pl-12 sm:pl-14"
    >
      <div
        class="qual-lb-colhead shrink-0 grid grid-cols-2 gap-x-8 items-end
          qual-lb-grid-pad py-10 pr-12 sm:pr-14 border-b border-white/[0.06]"
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
        class="qual-lb-scroll flex-1 min-h-0 overflow-y-auto custom-lb-scroll py-12 sm:py-14 pr-12 sm:pr-14
          flex flex-col gap-14 max-h-[52vh] lg:max-h-[min(70vh,680px)]"
      >
        <section
          v-for="block in sectionBlocks"
          :key="block.key"
          class="rounded-xl border overflow-hidden shrink-0"
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
              class="qual-lb-row grid grid-cols-[1.75rem_minmax(0,1fr)_auto] gap-x-8 items-center qual-lb-grid-pad
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
              <div class="flex items-center justify-end gap-6">
                <span
                  class="shrink-0 text-sm font-semibold tracking-wide text-right"
                  :class="teamPointsByTeamId[team.id] ? 'text-gray-100' : 'text-gray-500'"
                >
                  {{ teamPointsByTeamId[team.id] ?? 0 }}
                </span>
                <el-tooltip
                  placement="top"
                  :show-arrow="false"
                  popper-class="qual-lb-points-popper"
                >
                  <button
                    type="button"
                    class="qual-lb-info-trigger mb-2 flex items-center justify-center text-gray-500 hover:text-cyan-300
                      transition-colors"
                    :aria-label="`Очки гравців команди ${team.name}`"
                  >
                    <PhInfo :size="16" weight="duotone" />
                  </button>
                  <template #content>
                    <div class="qual-lb-points-inner" :class="{ 'is-empty': !teamRoster[team.id]?.length }">
                      <div class="qual-lb-points-title">
                        {{ team.name }}
                      </div>

                      <ul
                        v-if="teamRoster[team.id]?.length"
                        class="qual-lb-tooltip-list"
                      >
                        <li
                          v-for="row in teamRoster[team.id]"
                          :key="row.playerId"
                          class="qual-lb-tooltip-row"
                        >
                          <span class="qual-lb-tooltip-name">{{ row.nickname }}</span>
                          <span class="qual-lb-tooltip-points">{{ row.points }}</span>
                        </li>
                      </ul>
                      <p v-else class="qual-lb-points-empty">
                        Очки ще не нараховані
                      </p>
                    </div>
                  </template>
                </el-tooltip>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { PhInfo } from '@phosphor-icons/vue'
import type { TPlayerPointsEntry } from '@/api/types/api.types'

const props = defineProps<{
  teams: TTeam[]
  playerPoints?: TPlayerPointsEntry[] | null
}>()

interface ITeamRosterRow {
  playerId: string
  nickname: string
  points: number
}

/** playerId → points; невідомі гравці отримують 0 при підсумовуванні. */
const pointsByPlayerId = computed(() => {
  const map: Record<string, number> = {}
  for (const entry of props.playerPoints ?? []) {
    map[entry.playerId] = entry.points
  }
  return map
})

function rosterFor (team: TTeam): TPlayer[] {
  const main = (team.mainPlayers ?? []) as TPlayer[]
  const reserved = (team.reservedPlayers ?? []) as TPlayer[]
  const seen = new Set<string>()
  const out: TPlayer[] = []
  for (const p of [...main, ...reserved]) {
    if (!p?.id || seen.has(p.id)) continue
    seen.add(p.id)
    out.push(p)
  }
  return out
}

function playerNickname (p: TPlayer): string {
  return p.discordName?.trim() || p.discordUsername?.trim() || p.steamId || 'Гравець'
}

/** teamId → відсортований за очками рядок для тултіпа (тільки гравці з нарахованими очками). */
const teamRoster = computed((): Record<string, ITeamRosterRow[]> => {
  const out: Record<string, ITeamRosterRow[]> = {}
  const points = pointsByPlayerId.value
  for (const team of props.teams) {
    const rows: ITeamRosterRow[] = []
    for (const p of rosterFor(team)) {
      const pts = points[p.id]
      if (pts == null) continue
      rows.push({ playerId: p.id, nickname: playerNickname(p), points: pts })
    }
    rows.sort((a, b) => b.points - a.points || a.nickname.localeCompare(b.nickname, 'uk'))
    out[team.id] = rows
  }
  return out
})

/** Сума очок гравців у ростері команди (за даними `playerTournamentPoints`). */
const teamPointsByTeamId = computed((): Record<string, number> => {
  const out: Record<string, number> = {}
  for (const team of props.teams) {
    const rows = teamRoster.value[team.id] ?? []
    out[team.id] = rows.reduce((acc, r) => acc + r.points, 0)
  }
  return out
})

type TBlockKey = 'p1_4' | 'p5_8' | 'p9p'

interface ILeaderboardBlock {
  key: TBlockKey
  label: string
  teams: TTeam[]
  startRank: number
  shellClass: string
  headerRowClass: string
  labelClass: string
  rankBadgeClass: string
}

type TLeaderboardMeta = Omit<ILeaderboardBlock, 'teams' | 'startRank'>

/** Команди в порядку лідерборду: за сумою очок ↓, далі — за початковим порядком (стабільно). */
const rankedTeams = computed((): TTeam[] => {
  const totals = teamPointsByTeamId.value
  return [...props.teams]
    .map((team, originalIndex) => ({ team, originalIndex }))
    .sort((a, b) => {
      const diff = (totals[b.team.id] ?? 0) - (totals[a.team.id] ?? 0)
      return diff !== 0 ? diff : a.originalIndex - b.originalIndex
    })
    .map(({ team }) => team)
})

const sectionBlocks = computed((): ILeaderboardBlock[] => {
  const list = rankedTeams.value
  const raw: TLeaderboardMeta[] = [
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

.qual-lb-info-trigger {
  @apply rounded-full p-1;
  background: transparent;
  border: none;
  cursor: pointer;
}

.qual-lb-info-trigger:focus-visible {
  outline: 1px solid color-mix(in srgb, var(--el-color-primary) 60%, transparent);
  outline-offset: 2px;
}
</style>

<style>
/* Шейп тултіпа дублює стилі PlayerPositionsTooltip — не імпортуємо їх через popper-class,
   щоб тултіп виглядав однаково навіть коли PlayerPositionsTooltip не змонтований на цій сторінці. */
.qual-lb-points-popper {
  width: min(260px, calc(100vw - 20px)) !important;
  min-width: min(220px, calc(100vw - 20px)) !important;
  max-width: min(260px, calc(100vw - 20px)) !important;
  border: none !important;
  background: transparent !important;
  padding: 0 !important;
  box-shadow: none !important;
  box-sizing: border-box;
}

.qual-lb-points-inner {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.6rem;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 0.8rem 0.85rem 0.85rem;
  border-radius: 1.1rem;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 20%, rgba(255, 255, 255, 0.12));
  background: linear-gradient(
    150deg,
    rgb(15 23 42 / 0.92) 0%,
    color-mix(in srgb, var(--el-color-primary) 6%, rgb(15 23 42)) 45%,
    rgb(8 10 20 / 0.94) 100%
  );
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--el-color-primary) 8%, rgba(255, 255, 255, 0.04)) inset,
    0 8px 32px -8px rgba(0, 0, 0, 0.4),
    0 2px 12px -2px color-mix(in srgb, var(--el-color-primary) 10%, rgba(0, 0, 0, 0.2));
  backdrop-filter: blur(18px) saturate(1.02);
}

.qual-lb-points-inner::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background: radial-gradient(
    100% 70% at 50% 0%,
    color-mix(in srgb, var(--el-color-primary) 7%, rgba(255, 255, 255, 0.03)) 0%,
    transparent 60%
  );
  opacity: 0.5;
}

.qual-lb-points-title {
  position: relative;
  z-index: 1;
  width: 100%;
  text-align: center;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--el-color-primary) 55%, rgb(186 201 220));
}

.qual-lb-points-empty {
  position: relative;
  z-index: 1;
  margin: 0;
  width: 100%;
  text-align: center;
  font-size: 12px;
  line-height: 1.5;
  color: color-mix(in srgb, #94a3b8 92%, var(--el-color-primary) 8%);
}

.qual-lb-points-inner.is-empty {
  padding-bottom: 0.7rem;
}

.qual-lb-tooltip-list {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  width: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
}

.qual-lb-tooltip-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0.3rem 0.5rem;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 12%, rgba(255, 255, 255, 0.06));
}

.qual-lb-tooltip-name {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 500;
  color: rgb(226 232 240);
}

.qual-lb-tooltip-points {
  flex: 0 0 auto;
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: color-mix(in srgb, var(--el-color-primary) 70%, rgb(226 232 240));
}
</style>
