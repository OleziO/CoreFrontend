<template>
  <div class="analytics relative flex w-full flex-col text-white">
    <!-- Атмосферний відблиск у стилі адмінки / списків -->
    <div
      class="pointer-events-none absolute inset-x-0 top-0 z-0 h-[280px]
             bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,rgba(46,229,255,0.1),transparent_70%)]"
      aria-hidden="true"
    />

    <div class="relative mx-auto flex w-full max-w-7xl flex-col gap-20 px-16 pb-40 lg:px-24">
      <!-- ─── Head ─────────────────────────────────────────────────────── -->
      <header class="analytics-head">
        <div class="flex min-w-0 flex-col gap-6">
          <span class="sys-label">// Панель керування · Аналітика</span>
          <h1 class="analytics-head__title">Аналітика ліги</h1>
          <p class="analytics-head__subtitle">
            Соцмережі, гравці, команди й турніри — одним поглядом.
          </p>
        </div>

        <div class="analytics-head__aside">
          <span v-if="generatedAt" class="analytics-head__stamp">
            <span class="analytics-head__dot" aria-hidden="true" />
            Оновлено о {{ generatedAt }}
          </span>
          <el-button
            class="analytics-head__refresh"
            :loading="isLoading"
            :disabled="isLoading"
            aria-label="Оновити дані"
            @click="refetch()"
          >
            <PhArrowsClockwise v-if="!isLoading" :size="16" weight="bold" />
            <span class="ml-6 hidden sm:inline">Оновити</span>
          </el-button>
        </div>
      </header>

      <!-- ─── Error ────────────────────────────────────────────────────── -->
      <section v-if="error && !data" class="analytics-error neon-card hud-corners rounded-2xl">
        <PhWarningOctagon :size="28" weight="duotone" class="text-pink-400" />
        <div class="flex flex-col gap-4">
          <span class="text-base font-semibold text-white">Не вдалося завантажити аналітику</span>
          <span class="text-sm text-gray-400">{{ errorMessage }}</span>
        </div>
        <el-button type="primary" class="ml-auto" @click="refetch()">
          Спробувати ще раз
        </el-button>
      </section>

      <!-- ─── Skeleton ─────────────────────────────────────────────────── -->
      <template v-else-if="isPending">
        <div class="analytics-grid analytics-grid--kpi">
          <span
            v-for="n in 6"
            :key="`kpi-${n}`"
            class="skeleton-bone block h-[128px] !rounded-2xl"
            :style="{ '--skeleton-delay': `${n * 80}ms` }"
          />
        </div>
        <div class="analytics-grid analytics-grid--socials">
          <span
            v-for="n in 6"
            :key="`social-${n}`"
            class="skeleton-bone block h-[128px] !rounded-2xl"
            :style="{ '--skeleton-delay': `${n * 80 + 200}ms` }"
          />
        </div>
        <span class="skeleton-bone block h-[340px] !rounded-2xl" />
        <div class="grid gap-16 lg:grid-cols-2">
          <span class="skeleton-bone block h-[220px] !rounded-2xl" />
          <span class="skeleton-bone block h-[220px] !rounded-2xl" />
        </div>
      </template>

      <!-- ─── Dashboard ────────────────────────────────────────────────── -->
      <template v-else-if="data">
        <!-- 01 · Лічильники -->
        <section class="flex flex-col gap-12" aria-labelledby="analytics-kpi">
          <h2 id="analytics-kpi" class="sys-label sys-label--muted">// 01 · Ліга в цифрах</h2>
          <div class="analytics-grid analytics-grid--kpi">
            <AnalyticsStatTile
              v-for="(tile, index) in kpiTiles"
              :key="tile.key"
              :label="tile.label"
              :value="tile.value"
              :icon="tile.icon"
              :accent="tile.accent"
              :hint="tile.hint"
              :delay="index * 60"
            />
          </div>
        </section>

        <!-- 02 · Соцмережі -->
        <section class="flex flex-col gap-12" aria-labelledby="analytics-socials">
          <div class="flex flex-wrap items-baseline justify-between gap-8">
            <h2 id="analytics-socials" class="sys-label sys-label--muted">// 02 · Підписники в соцмережах</h2>
            <span class="analytics-note">
              Наживо — з платформи (кеш 10 хв); вручну — значення, введене адміном.
            </span>
          </div>
          <div class="analytics-grid analytics-grid--socials">
            <AnalyticsSocialCard
              v-for="(social, index) in data.socials"
              :key="social.channel"
              :social="social"
              :delay="index * 60 + 200"
              @saved="refetch()"
            />
          </div>
        </section>

        <!-- 03 · Ранги -->
        <AnalyticsPanel
          code="// 03 · Розподіл за рангами"
          title="Ранги гравців"
          :subtitle="`${formatAnalyticsNumber(data.totals.players)} гравців за поточним рейтингом`"
          :delay="400"
        >
          <template #aside>
            <span class="analytics-chip">
              <PhCrownSimple :size="12" weight="fill" />
              Найбільше: {{ topRankLabel }}
            </span>
          </template>
          <AnalyticsColumnChart :items="rankItems" unit="гравців" />
        </AnalyticsPanel>

        <!-- 04 · Команди  |  05 · Онлайн-турніри -->
        <div class="grid gap-16 lg:grid-cols-2">
          <AnalyticsPanel
            code="// 04 · Верифікація"
            title="Верифіковані vs неверифіковані команди"
            :subtitle="`${formatAnalyticsNumber(data.totals.teams)} активних команд`"
            :delay="480"
          >
            <div class="analytics-hero">
              <span class="analytics-hero__value">{{ verifiedTeamsShare }}</span>
              <span class="analytics-hero__label">
                команд пройшли верифікацію —
                {{ formatAnalyticsNumber(data.teams.verified) }} з {{ formatAnalyticsNumber(data.totals.teams) }}
              </span>
            </div>
            <AnalyticsStackedBar :segments="teamSegments" />
          </AnalyticsPanel>

          <AnalyticsPanel
            code="// 05 · Формат турнірів"
            title="Зацікавлені в онлайн-турнірах"
            subtitle="За відповіддю «Де хочу грати» у профілі гравця"
            :delay="540"
          >
            <div class="analytics-hero">
              <span class="analytics-hero__value">{{ formatAnalyticsNumber(data.wantToPlay.online) }}</span>
              <span class="analytics-hero__label">
                гравців хочуть грати онлайн —
                {{ formatAnalyticsPercent(data.wantToPlay.online, data.totals.players) }} усіх гравців
              </span>
            </div>
            <AnalyticsStackedBar :segments="wantToPlaySegments" />
          </AnalyticsPanel>
        </div>

        <!-- 06 · Турніри -->
        <AnalyticsPanel
          code="// 06 · Учасники турнірів"
          title="Команди в турнірах"
          :subtitle="tournamentsSubtitle"
          :delay="620"
        >
          <AnalyticsBarList
            :items="tournamentItems"
            unit="команд"
            empty-text="Турнірів ще не створено"
          />
        </AnalyticsPanel>

        <!-- 07 · Міста -->
        <AnalyticsPanel
          code="// 07 · Географія"
          title="Гравці за містами"
          :subtitle="citiesSubtitle"
          :delay="700"
        >
          <AnalyticsBarList
            :items="cityItems"
            unit="гравців"
            empty-text="Ніхто ще не вказав місто"
          />
        </AnalyticsPanel>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import {
  PhArrowsClockwise,
  PhCrownSimple,
  PhLightning,
  PhShieldCheck,
  PhTrophy,
  PhUserCheck,
  PhUsersFour,
  PhUsersThree,
  PhWarningOctagon
} from '@phosphor-icons/vue'
import { useGetAnalyticsOverview } from '@/views/analytics/analytics.queries'
import {
  ANALYTICS_RANK_RAMP,
  ANALYTICS_SERIES,
  analyticsTournamentStatusLabelMap,
  formatAnalyticsNumber,
  formatAnalyticsPercent,
  formatAnalyticsTime,
  getRankBucketImageSrc
} from '@/views/analytics/analytics.utils'
import { getApiErrorMessage } from '@/core/utils/api-errors'
import AnalyticsPanel from './components/AnalyticsPanel.vue'
import AnalyticsStatTile from './components/AnalyticsStatTile.vue'
import AnalyticsSocialCard from './components/AnalyticsSocialCard.vue'
import AnalyticsColumnChart from './components/AnalyticsColumnChart.vue'
import AnalyticsBarList from './components/AnalyticsBarList.vue'
import AnalyticsStackedBar from './components/AnalyticsStackedBar.vue'

const TOURNAMENTS_LIMIT = 12
const CITIES_LIMIT = 10

const { data, error, isPending, isLoading, refetch } = useGetAnalyticsOverview()

const generatedAt = computed(() => formatAnalyticsTime(data.value?.generatedAt))
const errorMessage = computed(() =>
  error.value ? getApiErrorMessage(error.value, 'Перевірте з’єднання та спробуйте ще раз') : ''
)

// ─── 01 · KPI ───────────────────────────────────────────────────────────────
type TKpiTile = {
  key: string
  label: string
  value: number | null
  icon: Component
  accent: 'primary' | 'gold' | 'violet' | 'pink'
  hint?: string
}

const kpiTiles = computed<TKpiTile[]>(() => {
  const t = data.value?.totals
  return [
    { key: 'players', label: 'Гравці', value: t?.players ?? null, icon: PhUsersThree, accent: 'primary' },
    {
      key: 'verifiedPlayers',
      label: 'Верифіковані гравці',
      value: t?.verifiedPlayers ?? null,
      icon: PhUserCheck,
      accent: 'primary',
      hint: t ? `${formatAnalyticsPercent(t.verifiedPlayers, t.players)} від усіх` : ''
    },
    { key: 'teams', label: 'Команди', value: t?.teams ?? null, icon: PhUsersFour, accent: 'violet' },
    {
      key: 'verifiedTeams',
      label: 'Верифіковані команди',
      value: t?.verifiedTeams ?? null,
      icon: PhShieldCheck,
      accent: 'violet',
      hint: t ? `${formatAnalyticsPercent(t.verifiedTeams, t.teams)} від усіх` : ''
    },
    { key: 'tournaments', label: 'Турніри', value: t?.tournaments ?? null, icon: PhTrophy, accent: 'gold' },
    {
      key: 'activeTournaments',
      label: 'Активні турніри',
      value: t?.activeTournaments ?? null,
      icon: PhLightning,
      accent: 'gold',
      hint: t ? `${formatAnalyticsNumber(t.tournaments - t.activeTournaments)} завершено` : ''
    }
  ]
})

// ─── 03 · Ранги ─────────────────────────────────────────────────────────────
const rankItems = computed<TAnalyticsChartItem[]>(() =>
  (data.value?.ranks ?? []).map((bucket, index) => ({
    key: String(bucket.rankNumber),
    label: bucket.nameUk,
    value: bucket.players,
    image: getRankBucketImageSrc(bucket.rankNumber),
    color: ANALYTICS_RANK_RAMP[index] ?? ANALYTICS_SERIES.primary
  }))
)

const topRankLabel = computed(() => {
  const ranks = data.value?.ranks ?? []
  if (!ranks.length) return '—'
  const top = ranks.reduce((best, bucket) => (bucket.players > best.players ? bucket : best), ranks[0])
  return top.players ? `${top.nameUk} (${formatAnalyticsNumber(top.players)})` : '—'
})

// ─── 04 · Команди ───────────────────────────────────────────────────────────
const teamSegments = computed<TAnalyticsStackedSegment[]>(() => [
  { key: 'verified', label: 'Верифіковані', value: data.value?.teams.verified ?? 0, color: ANALYTICS_SERIES.primary },
  { key: 'unverified', label: 'Без верифікації', value: data.value?.teams.unverified ?? 0, color: ANALYTICS_SERIES.muted }
])

const verifiedTeamsShare = computed(() =>
  formatAnalyticsPercent(data.value?.teams.verified ?? 0, data.value?.totals.teams ?? 0)
)

// ─── 05 · Онлайн / LAN ──────────────────────────────────────────────────────
const wantToPlaySegments = computed<TAnalyticsStackedSegment[]>(() => {
  const w = data.value?.wantToPlay
  return [
    { key: 'onlineOnly', label: 'Тільки онлайн', value: w?.onlineOnly ?? 0, color: ANALYTICS_SERIES.primary },
    { key: 'both', label: 'Онлайн + LAN', value: w?.both ?? 0, color: ANALYTICS_SERIES.secondary },
    { key: 'lanOnly', label: 'Тільки LAN', value: w?.lanOnly ?? 0, color: ANALYTICS_SERIES.pink },
    { key: 'unset', label: 'Не вказали', value: (w?.none ?? 0) + (w?.unset ?? 0), color: ANALYTICS_SERIES.muted }
  ]
})

// ─── 06 · Турніри ───────────────────────────────────────────────────────────
const tournamentItems = computed<TAnalyticsChartItem[]>(() =>
  (data.value?.tournaments ?? []).slice(0, TOURNAMENTS_LIMIT).map(t => ({
    key: t.id,
    label: t.name,
    value: t.teams,
    capacity: t.slots,
    hint: analyticsTournamentStatusLabelMap[t.status] ?? t.status,
    color: t.status === 'COMPLETED' ? 'rgba(46, 229, 255, 0.45)' : ANALYTICS_SERIES.primary
  }))
)

const tournamentsSubtitle = computed(() => {
  const total = data.value?.tournaments.length ?? 0
  const shown = Math.min(total, TOURNAMENTS_LIMIT)
  const base = 'Зареєстровані команди проти кількості слотів'
  return total > shown ? `${base} · останні ${shown} з ${total}` : base
})

// ─── 07 · Міста ─────────────────────────────────────────────────────────────
const cityItems = computed<TAnalyticsChartItem[]>(() => {
  const cities = data.value?.cities ?? []
  const top = cities.slice(0, CITIES_LIMIT).map(c => ({
    key: c.city,
    label: c.city,
    value: c.players
  }))
  const rest = cities.slice(CITIES_LIMIT).reduce((sum, c) => sum + c.players, 0)
  if (rest > 0) {
    top.push({ key: '__other', label: `Інші міста (${cities.length - CITIES_LIMIT})`, value: rest })
  }
  return top.map(item => item.key === '__other' ? { ...item, color: ANALYTICS_SERIES.muted } : item)
})

const citiesSubtitle = computed(() => {
  const cities = data.value?.cities ?? []
  const withCity = cities.reduce((sum, c) => sum + c.players, 0)
  const players = data.value?.totals.players ?? 0
  if (!players) return 'Місто з профілю гравця'
  return `${formatAnalyticsNumber(withCity)} гравців (${formatAnalyticsPercent(withCity, players)}) вказали місто`
})
</script>

<style scoped>
.analytics-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding-top: 28px;
}

.analytics-head__title {
  font-family: var(--ds-font-display);
  font-size: 28px;
  line-height: 1.1;
  letter-spacing: 0.02em;
  color: var(--ds-text-strong);
  text-shadow: var(--ds-neon-text-subtle);
}

@media (min-width: 768px) {
  .analytics-head__title {
    font-size: 34px;
  }
}

.analytics-head__subtitle {
  font-size: 14px;
  color: var(--ds-text-muted);
}

.analytics-head__aside {
  display: flex;
  align-items: center;
  gap: 12px;
}

.analytics-head__stamp {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.analytics-head__dot {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background: var(--ds-primary);
  box-shadow: 0 0 8px rgba(var(--ds-primary-rgb), 0.9);
}

.analytics-note {
  font-size: 12px;
  color: var(--ds-text-faint);
}

.analytics-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (min-width: 768px) {
  .analytics-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1280px) {
  .analytics-grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}

.analytics-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 9999px;
  border: 1px solid rgba(var(--ds-gold-rgb), 0.35);
  background: rgba(var(--ds-gold-rgb), 0.08);
  font-family: var(--ds-font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  white-space: nowrap;
  color: var(--ds-gold);
}

/* Головна цифра секції — той самий санс, що й решта; без табличних цифр. */
.analytics-hero {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px 12px;
  margin-bottom: 18px;
}

.analytics-hero__value {
  font-family: var(--ds-font-body);
  font-size: 40px;
  font-weight: 700;
  line-height: 1;
  color: var(--ds-text-strong);
  text-shadow: var(--ds-neon-text-subtle);
}

.analytics-hero__label {
  font-size: 13px;
  line-height: 1.4;
  color: var(--ds-text-muted);
}

.analytics-error {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
}
</style>
