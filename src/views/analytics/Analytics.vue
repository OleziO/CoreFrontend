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
            Соцмережі, гравці, команди, турніри й дуелі 1v1 — одним поглядом.
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
        <span class="skeleton-bone block h-[300px] !rounded-2xl" />
      </template>

      <!-- ─── Dashboard ────────────────────────────────────────────────── -->
      <template v-else-if="data">
        <!-- Потребує уваги: лише ненульові пункти; ховається, коли все гаразд -->
        <section
          v-if="attentionItems.length"
          class="analytics-alerts"
          aria-label="Потребує уваги"
        >
          <span class="sys-label sys-label--muted">// Потребує уваги</span>
          <ul class="analytics-alerts__list">
            <li v-for="item in attentionItems" :key="item.key">
              <router-link
                v-if="item.to"
                :to="item.to"
                class="analytics-alert"
                :class="`analytics-alert--${item.tone}`"
              >
                <component :is="item.icon" :size="14" weight="bold" />
                {{ item.text }}
                <PhArrowRight :size="12" weight="bold" class="analytics-alert__arrow" />
              </router-link>
              <span v-else class="analytics-alert" :class="`analytics-alert--${item.tone}`">
                <component :is="item.icon" :size="14" weight="bold" />
                {{ item.text }}
              </span>
            </li>
          </ul>
        </section>

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

        <!-- 02 · Гроші (окремий запит insights; ховається, якщо ендпоінт ще не задеплоєно) -->
        <span v-if="insightsPending" class="skeleton-bone block h-[420px] !rounded-2xl" />
        <AnalyticsPanel
          v-else-if="insights"
          code="// 02 · Гроші"
          title="Виручка та VIP"
          subtitle="Лише оплачені платежі: VIP-підписки, внески за участь у турнірах і донати"
          :delay="160"
        >
          <template #aside>
            <span class="analytics-chip">
              <PhCrown :size="12" weight="fill" />
              VIP: {{ formatAnalyticsNumber(insights.vip.active) }}
            </span>
          </template>
          <div class="analytics-trio">
            <AnalyticsStatTile
              v-for="(tile, index) in moneyTiles"
              :key="tile.key"
              :label="tile.label"
              :value="tile.value"
              :icon="tile.icon"
              :accent="tile.accent"
              :hint="tile.hint"
              :format-value="tile.format"
              :delay="160 + index * 60"
            />
          </div>
          <div class="analytics-block">
            <span class="analytics-block__caption">Виручка по місяцях — останні 6 місяців</span>
            <AnalyticsColumnChart
              :items="revenueMonthItems"
              :format-value="formatUah"
              :format-tick-value="formatUahTick"
            />
          </div>
          <div class="analytics-block">
            <span class="analytics-block__caption">
              Джерела виручки за весь час — {{ formatAnalyticsUah(revenueTotal) }}, гривні
            </span>
            <AnalyticsStackedBar :segments="revenueSourceSegments" />
          </div>
        </AnalyticsPanel>

        <!-- 03 · Соцмережі -->
        <section class="flex flex-col gap-12" aria-labelledby="analytics-socials">
          <div class="flex flex-wrap items-baseline justify-between gap-8">
            <h2 id="analytics-socials" class="sys-label sys-label--muted">// 03 · Підписники в соцмережах</h2>
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

        <!-- 04 · Ранги -->
        <AnalyticsPanel
          code="// 04 · Розподіл за рангами"
          title="Ранги гравців"
          :subtitle="`${formatAnalyticsNumber(data.totals.players)} гравців із заданим MMR за поточним рейтингом`"
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

        <!-- 05 · Команди  |  06 · Онлайн-турніри -->
        <div class="grid gap-16 lg:grid-cols-2">
          <AnalyticsPanel
            code="// 05 · Верифікація"
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
            code="// 06 · Формат турнірів"
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

        <!-- 07 · Склад і рекрутинг -->
        <span v-if="insightsPending" class="skeleton-bone block h-[420px] !rounded-2xl" />
        <AnalyticsPanel
          v-else-if="insights"
          code="// 07 · Склад і рекрутинг"
          title="Вільні гравці та позиції"
          subtitle="Гравець «у команді» — основа, запас або капітан активної команди"
          :delay="580"
        >
          <div class="analytics-hero">
            <span class="analytics-hero__value">{{ formatAnalyticsNumber(insights.roster.freeAgents) }}</span>
            <span class="analytics-hero__label">
              гравців без команди —
              {{ formatAnalyticsPercent(insights.roster.freeAgents, insights.roster.players) }} усіх,
              можна запрошувати
            </span>
          </div>
          <AnalyticsStackedBar :segments="rosterSegments" />
          <div class="analytics-block">
            <span class="analytics-block__caption">
              Позиції, які обрали гравці (можна кілька) — у тултипі скільки з них без команди
            </span>
            <AnalyticsColumnChart :items="positionItems" unit="гравців" />
          </div>
          <div class="analytics-block">
            <span class="analytics-block__caption">Заповненість профілів</span>
            <div class="analytics-trio">
              <AnalyticsStatTile
                v-for="(tile, index) in profileTiles"
                :key="tile.key"
                :label="tile.label"
                :value="tile.value"
                :icon="tile.icon"
                :accent="tile.accent"
                :hint="tile.hint"
                :delay="580 + index * 60"
              />
            </div>
          </div>
        </AnalyticsPanel>

        <!-- 08 · Дуелі 1v1 (v-if — страховка на вікно між деплоями фронту й бекенду) -->
        <AnalyticsPanel
          v-if="data.duels"
          code="// 08 · Дуелі 1v1"
          title="Дуелі та боти-хости"
          :subtitle="duelsSubtitle"
          :delay="620"
        >
          <template #aside>
            <DuelBotsStatusStrip :bots="data.duels.bots" compact />
          </template>
          <div class="analytics-duels">
            <AnalyticsStatTile
              v-for="(tile, index) in duelTiles"
              :key="tile.key"
              :label="tile.label"
              :value="tile.value"
              :icon="tile.icon"
              :accent="tile.accent"
              :hint="tile.hint"
              :delay="620 + index * 60"
            />
          </div>
          <div class="analytics-duels__outcomes">
            <span class="analytics-duels__caption">
              Результати завершених дуелей — {{ formatAnalyticsNumber(duelsFinished) }} усього
            </span>
            <AnalyticsStackedBar :segments="duelOutcomeSegments" />
          </div>
          <div v-if="insights" class="analytics-block">
            <span class="analytics-block__caption">
              Зіграні дуелі по днях — {{ formatAnalyticsNumber(duelsPlayed30d) }} за 30 днів,
              у середньому {{ duelsPerDayAverage }} на день
            </span>
            <AnalyticsColumnChart :items="duelDayItems" unit="дуелей" dense :label-every="7" />
          </div>
        </AnalyticsPanel>

        <!-- 09 · Турніри -->
        <AnalyticsPanel
          code="// 09 · Учасники турнірів"
          title="Команди в турнірах"
          :subtitle="tournamentsSubtitle"
          :delay="700"
        >
          <AnalyticsBarList
            :items="tournamentItems"
            unit="команд"
            empty-text="Турнірів ще не створено"
          />
        </AnalyticsPanel>

        <!-- 10 · Міста -->
        <AnalyticsPanel
          code="// 10 · Географія"
          title="Гравці за містами"
          :subtitle="citiesSubtitle"
          :delay="780"
        >
          <AnalyticsBarList
            :items="cityItems"
            unit="гравців"
            empty-text="Ніхто ще не вказав місто"
          />
        </AnalyticsPanel>

        <!-- 11 · Досягнення -->
        <AnalyticsPanel
          code="// 11 · Досягнення"
          title="Дошка трофеїв"
          subtitle="Усі досягнення платформи — наведіть на трофей, щоб побачити, хто його здобув"
          :delay="860"
        >
          <template #aside>
            <span v-if="achievementHoldersTotal" class="analytics-chip">
              <PhTrophy :size="12" weight="fill" />
              {{ pluralizePlayers(achievementHoldersTotal) }} з трофеями
            </span>
          </template>
          <AnalyticsTopAchievers
            v-if="!achievementsError || achievementsData"
            :achievers="achievementsData?.topAchievers ?? []"
            :is-pending="achievementsPending"
          />
          <AnalyticsAchievements
            :achievements="achievementsData?.achievements ?? []"
            :is-pending="achievementsPending"
            :is-error="!!achievementsError && !achievementsData"
          />
        </AnalyticsPanel>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import {
  PhArrowRight,
  PhArrowsClockwise,
  PhCalendarCheck,
  PhCoins,
  PhCrosshair,
  PhCrown,
  PhCrownSimple,
  PhRobot,
  PhSteamLogo,
  PhTelegramLogo,
  PhHourglassHigh,
  PhLightning,
  PhShieldCheck,
  PhSword,
  PhTimer,
  PhTrophy,
  PhUserCheck,
  PhUsersFour,
  PhUsersThree,
  PhWarningOctagon
} from '@phosphor-icons/vue'
import {
  useGetAnalyticsAchievements,
  useGetAnalyticsInsights,
  useGetAnalyticsOverview
} from '@/views/analytics/analytics.queries'
import { routeNames } from '@/router/route-names'
import { getDotaPositionLabel } from '@/components/player-tags/player.enums'
import { pluralizePlayers } from '@/views/players/player-achievements.utils'
import {
  ANALYTICS_RANK_RAMP,
  ANALYTICS_SERIES,
  analyticsTournamentStatusLabelMap,
  formatAnalyticsDay,
  formatAnalyticsMonth,
  formatAnalyticsNumber,
  formatAnalyticsPercent,
  formatAnalyticsTime,
  formatAnalyticsUah,
  getRankBucketImageSrc,
  sumAnalyticsRevenue
} from '@/views/analytics/analytics.utils'
import { getApiErrorMessage } from '@/core/utils/api-errors'
import AnalyticsPanel from './components/AnalyticsPanel.vue'
import AnalyticsStatTile from './components/AnalyticsStatTile.vue'
import AnalyticsSocialCard from './components/AnalyticsSocialCard.vue'
import AnalyticsColumnChart from './components/AnalyticsColumnChart.vue'
import AnalyticsBarList from './components/AnalyticsBarList.vue'
import AnalyticsStackedBar from './components/AnalyticsStackedBar.vue'
import AnalyticsAchievements from './components/AnalyticsAchievements.vue'
import AnalyticsTopAchievers from './components/AnalyticsTopAchievers.vue'
import DuelBotsStatusStrip from '@/views/duels/components/DuelBotsStatusStrip.vue'

const TOURNAMENTS_LIMIT = 12
const CITIES_LIMIT = 10

const { data, error, isPending, isLoading, refetch: refetchOverview } = useGetAnalyticsOverview()
const {
  data: achievementsData,
  error: achievementsError,
  isPending: achievementsPending,
  refetch: refetchAchievements
} = useGetAnalyticsAchievements()

// Додаткові зрізи — окремий запит: його помилка (напр. бекенд ще без ендпоінта) ховає лише нові секції.
const {
  data: insightsData,
  isPending: insightsPending,
  refetch: refetchInsights
} = useGetAnalyticsInsights()
const insights = computed(() => insightsData.value ?? null)

/** Кнопка «Оновити» та повтор після помилки перечитують усі запити дошки. */
function refetch () {
  return Promise.all([refetchOverview(), refetchAchievements(), refetchInsights()])
}

const formatUah = (kopecks: number) => formatAnalyticsUah(kopecks)
const formatUahTick = (kopecks: number) => formatAnalyticsUah(kopecks, true)

// ─── 11 · Досягнення ────────────────────────────────────────────────────────
const achievementHoldersTotal = computed(() => {
  const ids = new Set<string>()
  for (const a of achievementsData.value?.achievements ?? []) {
    for (const h of a.holders) ids.add(h.playerId)
  }
  return ids.size
})

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
  format?: (value: number) => string
}

// ─── Потребує уваги ─────────────────────────────────────────────────────────
type TAttentionItem = {
  key: string
  text: string
  icon: Component
  tone: 'pink' | 'gold'
  to?: RouteLocationRaw
}

const attentionItems = computed<TAttentionItem[]>(() => {
  const items: TAttentionItem[] = []
  const review = insights.value?.duelActivity.awaitingReview ?? 0
  if (review > 0) {
    items.push({
      key: 'duelReview',
      text: `Дуелей чекають рішення адміна: ${formatAnalyticsNumber(review)}`,
      icon: PhSword,
      tone: 'pink',
      to: { name: routeNames.adminPanel }
    })
  }
  const bots = data.value?.duels?.bots
  if (bots && bots.total > 0 && bots.online === 0) {
    items.push({ key: 'bots', text: 'Жоден бот-хост не онлайн — черга дуелей стоїть', icon: PhRobot, tone: 'pink' })
  }
  const unverified = data.value?.teams.unverified ?? 0
  if (unverified > 0) {
    items.push({
      key: 'teams',
      text: `Команд без верифікації: ${formatAnalyticsNumber(unverified)}`,
      icon: PhShieldCheck,
      tone: 'gold',
      to: { name: routeNames.adminPanel }
    })
  }
  const expiring = insights.value?.vip.expiringSoon ?? 0
  if (expiring > 0) {
    items.push({
      key: 'vip',
      text: `VIP закінчується протягом 7 днів: ${formatAnalyticsNumber(expiring)}`,
      icon: PhCrown,
      tone: 'gold'
    })
  }
  return items
})

// ─── 02 · Гроші ─────────────────────────────────────────────────────────────
const revenueTotal = computed(() => sumAnalyticsRevenue(insights.value?.revenue.total))
const revenueLast30 = computed(() => sumAnalyticsRevenue(insights.value?.revenue.last30Days))

const moneyTiles = computed<TKpiTile[]>(() => {
  const i = insights.value
  const vip = i?.vip
  const vipHint = vip
    ? [
      `${formatAnalyticsNumber(vip.autoRenew)} з автопродовженням`,
      vip.lifetime ? `${formatAnalyticsNumber(vip.lifetime)} довічних` : ''
    ].filter(Boolean).join(' · ')
    : ''
  return [
    {
      key: 'revenue30',
      label: 'Виручка за 30 днів',
      value: i ? revenueLast30.value : null,
      icon: PhCalendarCheck,
      accent: 'gold',
      hint: i
        ? `VIP ${formatAnalyticsUah(i.revenue.last30Days.vip)} · внески ${formatAnalyticsUah(i.revenue.last30Days.entryFees)}`
        : '',
      format: formatUah
    },
    {
      key: 'revenueTotal',
      label: 'Виручка за весь час',
      value: i ? revenueTotal.value : null,
      icon: PhCoins,
      accent: 'gold',
      hint: i ? `донати ${formatAnalyticsUah(i.revenue.total.donations)}` : '',
      format: formatUah
    },
    {
      key: 'vipActive',
      label: 'Активні VIP',
      value: vip?.active ?? null,
      icon: PhCrown,
      accent: 'violet',
      hint: vipHint
    }
  ]
})

const revenueMonthItems = computed<TAnalyticsChartItem[]>(() =>
  (insights.value?.revenue.monthly ?? []).map(m => ({
    key: m.month,
    label: formatAnalyticsMonth(m.month),
    value: sumAnalyticsRevenue(m),
    hint: `VIP ${formatAnalyticsUah(m.vip)} · внески ${formatAnalyticsUah(m.entryFees)}` +
      ` · донати ${formatAnalyticsUah(m.donations)}`
  }))
)

// Складена смужка рахує частки від цілого, тож гривні замість копійок нічого не спотворюють.
const revenueSourceSegments = computed<TAnalyticsStackedSegment[]>(() => {
  const t = insights.value?.revenue.total
  return [
    { key: 'vip', label: 'VIP-підписки', value: (t?.vip ?? 0) / 100, color: ANALYTICS_SERIES.secondary },
    { key: 'entryFees', label: 'Внески за турніри', value: (t?.entryFees ?? 0) / 100, color: ANALYTICS_SERIES.primary },
    { key: 'donations', label: 'Донати', value: (t?.donations ?? 0) / 100, color: ANALYTICS_SERIES.pink }
  ]
})

// ─── 07 · Склад і рекрутинг ─────────────────────────────────────────────────
const rosterSegments = computed<TAnalyticsStackedSegment[]>(() => {
  const r = insights.value?.roster
  return [
    { key: 'inTeam', label: 'У команді', value: r?.inTeam ?? 0, color: ANALYTICS_SERIES.primary },
    { key: 'freeAgents', label: 'Без команди', value: r?.freeAgents ?? 0, color: ANALYTICS_SERIES.secondary }
  ]
})

const positionItems = computed<TAnalyticsChartItem[]>(() =>
  (insights.value?.roster.positions ?? []).map(p => ({
    key: String(p.position),
    label: `${p.position} · ${getDotaPositionLabel(p.position)}`,
    value: p.players,
    hint: `без команди: ${formatAnalyticsNumber(p.freeAgents)}`
  }))
)

const profileTiles = computed<TKpiTile[]>(() => {
  const r = insights.value?.roster
  const share = (part: number) => (r ? `${formatAnalyticsPercent(part, r.players)} гравців` : '')
  return [
    {
      key: 'steam',
      label: 'Прив’язали Steam',
      value: r?.steamLinked ?? null,
      icon: PhSteamLogo,
      accent: 'primary',
      hint: share(r?.steamLinked ?? 0)
    },
    {
      key: 'telegram',
      label: 'Прив’язали Telegram',
      value: r?.telegramLinked ?? null,
      icon: PhTelegramLogo,
      accent: 'violet',
      hint: share(r?.telegramLinked ?? 0)
    },
    {
      key: 'positions',
      label: 'Обрали позицію',
      value: r?.withPositions ?? null,
      icon: PhCrosshair,
      accent: 'gold',
      hint: share(r?.withPositions ?? 0)
    }
  ]
})

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

// ─── 04 · Ранги ─────────────────────────────────────────────────────────────
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

// ─── 05 · Команди ───────────────────────────────────────────────────────────
const teamSegments = computed<TAnalyticsStackedSegment[]>(() => [
  { key: 'verified', label: 'Верифіковані', value: data.value?.teams.verified ?? 0, color: ANALYTICS_SERIES.primary },
  { key: 'unverified', label: 'Без верифікації', value: data.value?.teams.unverified ?? 0, color: ANALYTICS_SERIES.muted }
])

const verifiedTeamsShare = computed(() =>
  formatAnalyticsPercent(data.value?.teams.verified ?? 0, data.value?.totals.teams ?? 0)
)

// ─── 06 · Онлайн / LAN ──────────────────────────────────────────────────────
const wantToPlaySegments = computed<TAnalyticsStackedSegment[]>(() => {
  const w = data.value?.wantToPlay
  return [
    { key: 'onlineOnly', label: 'Тільки онлайн', value: w?.onlineOnly ?? 0, color: ANALYTICS_SERIES.primary },
    { key: 'both', label: 'Онлайн + LAN', value: w?.both ?? 0, color: ANALYTICS_SERIES.secondary },
    { key: 'lanOnly', label: 'Тільки LAN', value: w?.lanOnly ?? 0, color: ANALYTICS_SERIES.pink },
    { key: 'unset', label: 'Не вказали', value: (w?.none ?? 0) + (w?.unset ?? 0), color: ANALYTICS_SERIES.muted }
  ]
})

// ─── 08 · Дуелі 1v1 ─────────────────────────────────────────────────────────
const duelTiles = computed<TKpiTile[]>(() => {
  const d = data.value?.duels
  return [
    {
      key: 'played',
      label: 'Зіграно дуелей',
      value: d?.played ?? null,
      icon: PhSword,
      accent: 'pink',
      hint: d ? `з ${formatAnalyticsNumber(d.total)} створених` : ''
    },
    {
      key: 'active',
      label: 'Дуелі зараз',
      value: d?.active ?? null,
      icon: PhTimer,
      accent: 'primary',
      hint: d ? `${formatAnalyticsNumber(d.live)} у грі` : ''
    },
    {
      key: 'inQueue',
      label: 'Гравців у черзі',
      value: d?.inQueue ?? null,
      icon: PhHourglassHigh,
      accent: 'violet',
      hint: d ? `${formatAnalyticsNumber(d.bots.free)} вільних ботів` : ''
    }
  ]
})

/** Завершені дуелі — з результатом, скасовані та зі збоєм; активні сюди не входять. */
const duelsFinished = computed(() => {
  const d = data.value?.duels
  return d ? d.played + d.cancelled + d.failed : 0
})

const duelOutcomeSegments = computed<TAnalyticsStackedSegment[]>(() => {
  const d = data.value?.duels
  return [
    { key: 'played', label: 'Зіграно', value: d?.played ?? 0, color: ANALYTICS_SERIES.primary },
    { key: 'cancelled', label: 'Скасовано', value: d?.cancelled ?? 0, color: ANALYTICS_SERIES.muted },
    { key: 'failed', label: 'Збій', value: d?.failed ?? 0, color: ANALYTICS_SERIES.pink }
  ]
})

const duelsSubtitle = computed(() => {
  const d = data.value?.duels
  if (!d) return 'Рейтингові матчі 1v1 Solo Mid і пул ботів-хостів'
  const bots = d.bots.online
    ? `ботів онлайн ${formatAnalyticsNumber(d.bots.online)} з ${formatAnalyticsNumber(d.bots.total)}`
    : 'жоден бот-хост не онлайн — черга заблокована'
  return `${formatAnalyticsPercent(d.played, duelsFinished.value)} завершених дуелей дійшли до результату · ${bots}`
})

const duelDayItems = computed<TAnalyticsChartItem[]>(() =>
  (insights.value?.duelActivity.daily ?? []).map(d => ({
    key: d.date,
    label: formatAnalyticsDay(d.date),
    value: d.played,
    hint: d.notPlayed ? `без результату: ${formatAnalyticsNumber(d.notPlayed)}` : ''
  }))
)

const duelsPlayed30d = computed(() => duelDayItems.value.reduce((sum, d) => sum + d.value, 0))
const duelsPerDayAverage = computed(() => {
  const days = duelDayItems.value.length
  if (!days) return '0'
  return (duelsPlayed30d.value / days).toLocaleString('uk-UA', { maximumFractionDigits: 1 })
})

// ─── 09 · Турніри ───────────────────────────────────────────────────────────
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

// ─── 10 · Міста ─────────────────────────────────────────────────────────────
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

/* Плитки дуелей: три в ряд від планшета, стовпчиком на телефоні. */
.analytics-duels {
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(0, 1fr);
  margin-bottom: 18px;
}

@media (min-width: 640px) {
  .analytics-duels {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.analytics-duels__outcomes {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.analytics-duels__caption {
  font-size: 13px;
  line-height: 1.4;
  color: var(--ds-text-muted);
}

/* Три плитки в ряд від планшета (гроші, профілі). */
.analytics-trio {
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(0, 1fr);
}

@media (min-width: 640px) {
  .analytics-trio {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.analytics-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 22px;
}

.analytics-block__caption {
  font-size: 13px;
  line-height: 1.4;
  color: var(--ds-text-muted);
}

.analytics-alerts {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.analytics-alerts__list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.analytics-alert {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  padding: 6px 12px;
  border-radius: 9999px;
  border: 1px solid var(--alert-border);
  background: var(--alert-bg);
  font-size: 13px;
  line-height: 1.3;
  color: var(--alert-ink);
  transition: background-color var(--ds-duration-base) ease;
}

.analytics-alert--pink {
  --alert-border: rgba(240, 15, 192, 0.4);
  --alert-bg: rgba(240, 15, 192, 0.08);
  --alert-ink: #ff8ae2;
}

.analytics-alert--gold {
  --alert-border: rgba(var(--ds-gold-rgb), 0.4);
  --alert-bg: rgba(var(--ds-gold-rgb), 0.08);
  --alert-ink: var(--ds-gold);
}

a.analytics-alert:hover,
a.analytics-alert:focus-visible {
  --alert-bg: rgba(255, 255, 255, 0.06);

  outline: none;
}

.analytics-alert__arrow {
  opacity: 0.7;
}

.analytics-error {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
}
</style>
