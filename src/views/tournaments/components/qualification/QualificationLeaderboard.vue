<template>
  <aside
    class="qual-lb hud-panel flex flex-col rounded-2xl overflow-hidden min-h-0"
    aria-label="Турнірна таблиця кваліфікації"
  >
    <header class="qual-lb__head">
      <p class="sys-label sys-label--muted m-0">Рейтинг</p>
      <h4 class="qual-lb__title">Лідерборд</h4>
      <p class="qual-lb__hint">
        Очки — сума очок гравців команди в кваліфікації.
      </p>
    </header>

    <div class="qual-lb__colhead" aria-hidden="true">
      <span>#</span>
      <span>Команда</span>
      <span class="text-right">Очки</span>
    </div>

    <div class="qual-lb__scroll custom-lb-scroll flex-1 min-h-0 overflow-y-auto">
      <section
        v-for="block in sectionBlocks"
        :key="block.key"
        class="qual-lb-tier"
        :class="`qual-lb-tier--${block.tone}`"
        :aria-label="block.label"
      >
        <div class="qual-lb-tier__head">
          <span class="qual-lb-tier__label">{{ block.label }}</span>
          <span class="qual-lb-tier__rule" aria-hidden="true" />
          <span class="qual-lb-tier__count">
            {{ block.teams.length }} {{ pluralTeams(block.teams.length) }}
          </span>
        </div>

        <ol class="qual-lb-tier__list" role="list">
          <li
            v-for="(team, idx) in block.teams"
            :key="team.id"
            class="qual-lb-row"
            :class="{ 'is-first': block.startRank + idx === 1 && (teamPointsByTeamId[team.id] ?? 0) > 0 }"
          >
            <span class="qual-lb-row__rank">
              <PhCrown
                v-if="block.startRank + idx === 1 && (teamPointsByTeamId[team.id] ?? 0) > 0"
                :size="16"
                weight="fill"
                aria-hidden="true"
              />
              <span :class="{ 'sr-only': block.startRank + idx === 1 && (teamPointsByTeamId[team.id] ?? 0) > 0 }">
                {{ block.startRank + idx }}
              </span>
            </span>

            <span class="qual-lb-row__logo" aria-hidden="true">
              <img
                v-if="logoFor(team)"
                :src="logoFor(team)"
                alt=""
                class="h-full w-full object-cover object-center select-none pointer-events-none"
                loading="lazy"
                decoding="async"
              >
              <PhUsersThree v-else :size="18" weight="duotone" />
            </span>

            <div class="qual-lb-row__main">
              <span class="qual-lb-row__name" :title="team.name">{{ team.name }}</span>
              <span class="qual-lb-row__bar" aria-hidden="true">
                <span
                  class="qual-lb-row__bar-fill"
                  :style="{ transform: `scaleX(${pointsRatio(team.id)})` }"
                />
              </span>
            </div>

            <span
              class="qual-lb-row__points"
              :class="{ 'is-zero': !(teamPointsByTeamId[team.id] ?? 0) }"
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
                class="qual-lb-info-trigger"
                :aria-label="`Очки гравців команди ${team.name}`"
              >
                <PhInfo :size="16" weight="duotone" />
              </button>
              <template #content>
                <div class="qual-lb-points-inner" :class="{ 'is-empty': !teamRoster[team.id]?.length }">
                  <div class="qual-lb-points-head">
                    <span class="qual-lb-points-eyebrow">
                      <span class="qual-lb-points-tick" aria-hidden="true" />
                      Очки гравців
                    </span>
                    <span class="qual-lb-points-title">{{ team.name }}</span>
                  </div>

                  <template v-if="teamRoster[team.id]?.length">
                    <ul class="qual-lb-tooltip-list">
                      <li
                        v-for="row in teamRoster[team.id]"
                        :key="row.playerId"
                        class="qual-lb-tooltip-row"
                      >
                        <span class="qual-lb-tooltip-avatar" aria-hidden="true">
                          <img
                            v-if="row.avatarUrl && !failedAvatarIds.has(row.playerId)"
                            :src="row.avatarUrl"
                            alt=""
                            class="qual-lb-tooltip-avatar-img"
                            loading="lazy"
                            decoding="async"
                            @error="failedAvatarIds.add(row.playerId)"
                          >
                          <PhUser v-else :size="12" weight="bold" />
                        </span>
                        <span class="qual-lb-tooltip-main">
                          <span class="qual-lb-tooltip-name">{{ row.nickname }}</span>
                          <span class="qual-lb-tooltip-bar" aria-hidden="true">
                            <span
                              class="qual-lb-tooltip-bar-fill"
                              :style="{ transform: `scaleX(${rosterRatio(team.id, row.points)})` }"
                            />
                          </span>
                        </span>
                        <span class="qual-lb-tooltip-points">{{ row.points }}</span>
                      </li>
                    </ul>
                    <div class="qual-lb-tooltip-total">
                      <span>Разом</span>
                      <span class="qual-lb-tooltip-total-value">{{ teamPointsByTeamId[team.id] ?? 0 }}</span>
                    </div>
                  </template>
                  <p v-else class="qual-lb-points-empty">
                    Очки ще не нараховані
                  </p>
                </div>
              </template>
            </el-tooltip>
          </li>
        </ol>
      </section>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { PhCrown, PhInfo, PhUser, PhUsersThree } from '@phosphor-icons/vue'
import { resolvePublicOrApiUrl } from '@/core/helpers'
import type { TPlayerPointsEntry } from '@/api/types/api.types'

const props = defineProps<{
  teams: TTeam[]
  playerPoints?: TPlayerPointsEntry[] | null
}>()

interface ITeamRosterRow {
  playerId: string
  nickname: string
  avatarUrl: string
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

function logoFor (team: TTeam): string {
  return resolvePublicOrApiUrl(team.logoUrl)
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
      rows.push({
        playerId: p.id,
        nickname: playerNickname(p),
        avatarUrl: resolvePublicOrApiUrl(p.avatarUrl),
        points: pts
      })
    }
    rows.sort((a, b) => b.points - a.points || a.nickname.localeCompare(b.nickname, 'uk'))
    out[team.id] = rows
  }
  return out
})

/** Аватари, що не завантажились (404 / битий URL) — замість них плейсхолдер, а не «зламана картинка». */
const failedAvatarIds = reactive(new Set<string>())

/** Частка очок гравця від найкращого в цьому ж ростері — смужка в тултіпі. */
function rosterRatio (teamId: string, points: number): number {
  const best = teamRoster.value[teamId]?.[0]?.points ?? 0
  if (!best) return 0
  return points / best
}

/** Сума очок гравців у ростері команди (за даними `playerTournamentPoints`). */
const teamPointsByTeamId = computed((): Record<string, number> => {
  const out: Record<string, number> = {}
  for (const team of props.teams) {
    const rows = teamRoster.value[team.id] ?? []
    out[team.id] = rows.reduce((acc, r) => acc + r.points, 0)
  }
  return out
})

/** Максимум очок — 100% смужки під назвою; 0, коли очок ще ні в кого немає. */
const maxPoints = computed(() => Math.max(0, ...Object.values(teamPointsByTeamId.value)))

function pointsRatio (teamId: string): number {
  if (!maxPoints.value) return 0
  return (teamPointsByTeamId.value[teamId] ?? 0) / maxPoints.value
}

type TBlockKey = 'p1_4' | 'p5_8' | 'p9p'
type TBlockTone = 'gold' | 'primary' | 'neutral'

interface ILeaderboardBlock {
  key: TBlockKey
  label: string
  tone: TBlockTone
  teams: TTeam[]
  startRank: number
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
    { key: 'p1_4', label: '1–4 місце', tone: 'gold' },
    { key: 'p5_8', label: '5–8 місце', tone: 'primary' },
    { key: 'p9p', label: '9+ місце', tone: 'neutral' }
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

<style scoped lang="scss">
// ─── Шапка ──────────────────────────────────────────────────────────────────
.qual-lb__head {
  @apply flex shrink-0 flex-col gap-6 px-16 py-14;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background:
    radial-gradient(ellipse 70% 90% at 100% 0%, rgba(var(--ds-gold-rgb), 0.07), transparent 60%),
    rgba(0, 0, 0, 0.18);
}

.qual-lb__title {
  @apply m-0 font-display uppercase text-white;
  font-size: 15px;
  line-height: 1.15;
  letter-spacing: 0.06em;
}

.qual-lb__hint {
  @apply m-0;
  font-size: 11px;
  line-height: 1.45;
  color: var(--ds-text-faint);
}

// Заголовки колонок повторюють сітку рядка: ранг · (логотип + назва) · очки (+ інфо).
.qual-lb__colhead {
  @apply grid shrink-0 items-center gap-x-10 px-14 py-8;
  grid-template-columns: 1.5rem minmax(0, 1fr) auto;
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  > :last-child {
    // Ширина колонки очок + кнопка інфо, щоб «Очки» стояли над цифрами.
    padding-right: 26px;
  }
}

.qual-lb__scroll {
  max-height: 52vh;

  @screen lg {
    max-height: min(70vh, 680px);
  }
}

.custom-lb-scroll {
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--ds-primary-rgb), 0.22) transparent;
}

.custom-lb-scroll::-webkit-scrollbar {
  width: 6px;
}

.custom-lb-scroll::-webkit-scrollbar-thumb {
  background: rgba(var(--ds-primary-rgb), 0.22);
  border-radius: 999px;
}

// ─── Групи місць ────────────────────────────────────────────────────────────
// Не коробка в коробці, а розділювач: підпис у тоні групи, лінія, що згасає,
// та лічильник. Тон задається кастомними властивостями і тече в рядки.
.qual-lb-tier {
  --tier-rgb: 255, 255, 255;
  --tier-color: rgba(255, 255, 255, 0.6);
  --tier-glow: none;

  &--gold {
    --tier-rgb: var(--ds-gold-rgb);
    --tier-color: var(--ds-gold);
    --tier-glow: var(--ds-neon-text-gold);
  }

  &--primary {
    --tier-rgb: var(--ds-primary-rgb);
    --tier-color: var(--ds-primary);
    --tier-glow: var(--ds-neon-text-subtle);
  }

  & + & {
    margin-top: 4px;
  }
}

.qual-lb-tier__head {
  @apply flex items-center gap-10 px-14 pb-6 pt-12;
}

.qual-lb-tier__label {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--tier-color);
  text-shadow: var(--tier-glow);
}

.qual-lb-tier__rule {
  flex: 1 1 auto;
  height: 1px;
  background: linear-gradient(90deg, rgba(var(--tier-rgb), 0.45), transparent);
}

.qual-lb-tier__count {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: var(--ds-text-faint);
}

.qual-lb-tier__list {
  @apply m-0 list-none p-0;
}

// ─── Рядок ──────────────────────────────────────────────────────────────────
.qual-lb-row {
  @apply grid items-center gap-x-10 px-14 py-8;
  grid-template-columns: 1.5rem 2.25rem minmax(0, 1fr) auto auto;
  transition: background-color 120ms ease;

  & + & {
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }

  // Лідер: золоте «повітря» зліва, щоб перший рядок читався першим і без цифри.
  &.is-first {
    background: linear-gradient(90deg, rgba(var(--ds-gold-rgb), 0.08), transparent 55%);
  }
}

@media (hover: hover) and (pointer: fine) {
  .qual-lb-row:hover {
    background-color: rgba(var(--tier-rgb), 0.06);
  }

  .qual-lb-row.is-first:hover {
    background: linear-gradient(90deg, rgba(var(--ds-gold-rgb), 0.14), rgba(var(--ds-gold-rgb), 0.04) 55%);
  }
}

.qual-lb-row__rank {
  @apply inline-flex items-center justify-center;
  font-family: var(--ds-font-mono);
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: var(--tier-color);
  text-shadow: var(--tier-glow);

  svg {
    filter: drop-shadow(0 0 6px rgba(var(--ds-gold-rgb), 0.6));
  }
}

// Квадратний логотип на всю комірку — той самий формат, що й у матриці.
.qual-lb-row__logo {
  @apply flex size-36 shrink-0 items-center justify-center overflow-hidden rounded-md;
  border: 1px solid rgba(var(--tier-rgb), 0.22);
  background: var(--ds-overlay);
  color: rgba(var(--ds-primary-rgb), 0.35);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.qual-lb-row__main {
  @apply flex min-w-0 flex-col gap-5;
}

.qual-lb-row__name {
  @apply block truncate;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--ds-text-strong);
}

// Частка від лідера: масштабується transform-ом, без перерахунку ширини.
.qual-lb-row__bar {
  display: block;
  height: 2px;
  border-radius: 9999px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.06);
}

.qual-lb-row__bar-fill {
  display: block;
  height: 100%;
  transform-origin: left center;
  background: linear-gradient(90deg, rgba(var(--tier-rgb), 0.9), rgba(var(--tier-rgb), 0.35));
  box-shadow: 0 0 6px rgba(var(--tier-rgb), 0.45);
  transition: transform 500ms var(--ds-ease-in-out);
}

.qual-lb-row__points {
  font-family: var(--ds-font-mono);
  font-size: 15px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.01em;
  font-variant-numeric: tabular-nums;
  text-align: right;
  color: var(--ds-text-strong);

  &.is-zero {
    color: var(--ds-text-faint);
    font-weight: 600;
  }
}

.qual-lb-info-trigger {
  @apply flex items-center justify-center rounded-full p-1;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--ds-text-faint);
  transition: color 120ms ease;

  &:hover {
    color: var(--ds-primary);
  }

  &:focus-visible {
    outline: 1px solid rgba(var(--ds-primary-rgb), 0.6);
    outline-offset: 2px;
  }
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

/* Панель у HUD-реєстрі: індиго-скло з ціановою волосиною і світловою лінією
   зверху (рецепт `.hud-panel`), рядки — плаский список із роздільниками, а не
   коробка в коробці. */
.qual-lb-points-inner {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid var(--ds-border);
  background:
    linear-gradient(90deg, transparent 0%, rgba(var(--ds-primary-rgb), 0.6) 50%, transparent 100%)
      top / 100% 1px no-repeat,
    radial-gradient(ellipse 80% 60% at 0% 0%, rgba(var(--ds-primary-rgb), 0.1), transparent 60%),
    linear-gradient(160deg, rgba(20, 23, 41, 0.94) 0%, rgba(7, 8, 15, 0.96) 100%);
  box-shadow: var(--ds-elevation-4), var(--ds-glow-primary-soft);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.qual-lb-points-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.qual-lb-points-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.qual-lb-points-tick {
  width: 12px;
  height: 2px;
  border-radius: 9999px;
  background: var(--ds-primary);
  box-shadow: 0 0 6px rgba(var(--ds-primary-rgb), 0.7);
}

.qual-lb-points-title {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--ds-font-display);
  font-size: 12px;
  line-height: 1.2;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ds-text-strong);
}

.qual-lb-points-empty {
  margin: 0;
  padding: 10px 12px 12px;
  width: 100%;
  text-align: center;
  font-size: 12px;
  line-height: 1.5;
  color: var(--ds-text-faint);
}

.qual-lb-tooltip-list {
  display: flex;
  flex-direction: column;
  width: 100%;
  margin: 0;
  padding: 4px 0;
  list-style: none;
}

.qual-lb-tooltip-row {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
}

.qual-lb-tooltip-row + .qual-lb-tooltip-row {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

/* Квадратний аватар на всю комірку — той самий формат, що й логотипи. */
.qual-lb-tooltip-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  overflow: hidden;
  border-radius: 5px;
  border: 1px solid rgba(var(--ds-primary-rgb), 0.2);
  background: var(--ds-overlay);
  color: rgba(var(--ds-primary-rgb), 0.45);
}

.qual-lb-tooltip-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  user-select: none;
  pointer-events: none;
}

.qual-lb-tooltip-main {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.qual-lb-tooltip-name {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--ds-text);
}

/* Частка від найкращого гравця команди. */
.qual-lb-tooltip-bar {
  display: block;
  height: 2px;
  overflow: hidden;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.06);
}

.qual-lb-tooltip-bar-fill {
  display: block;
  height: 100%;
  transform-origin: left center;
  background: linear-gradient(90deg, var(--ds-primary), rgba(var(--ds-primary-rgb), 0.35));
  box-shadow: 0 0 6px rgba(var(--ds-primary-rgb), 0.5);
}

.qual-lb-tooltip-points {
  font-family: var(--ds-font-mono);
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  text-align: right;
  color: var(--ds-primary);
  text-shadow: var(--ds-neon-text-subtle);
}

.qual-lb-tooltip-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid rgba(var(--ds-primary-rgb), 0.16);
  background: rgba(0, 0, 0, 0.25);
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.qual-lb-tooltip-total-value {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.01em;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-strong);
}
</style>
