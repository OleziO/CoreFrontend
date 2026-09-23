<template>
  <el-drawer
    v-model="modelValue"
    direction="rtl"
    :size="450"
    class="team-drawer"
    @close="close"
  >
    <!-- Шапка: логотип · назва · статус — усе найважливіше про команду одним поглядом -->
    <template #header>
      <div class="flex min-w-0 items-center gap-12">
        <div class="team-drawer__logo relative shrink-0 overflow-hidden rounded-lg">
          <img
            v-if="logoSrc && !logoLoadFailed"
            :src="logoSrc"
            alt=""
            class="h-full w-full object-cover"
            @error="logoLoadFailed = true"
          >
          <PhUsersThree
            v-else
            :size="22"
            weight="duotone"
            class="text-primary/40"
          />
        </div>

        <div class="flex min-w-0 flex-col gap-4">
          <span class="sys-label sys-label--muted !text-[9px]">Команда</span>
          <h1
            class="m-0 truncate font-display text-[16px] uppercase leading-tight tracking-wide text-white
                   neon-text-subtle"
            :title="displayTeam.name"
          >
            {{ displayTeam.name }}
          </h1>
          <div class="flex flex-wrap items-center gap-6">
            <!-- Пресети підписані в чоловічому роді (гравець); команда — жіночий -->
            <StatusBadge
              :preset="displayTeam.isVerified ? 'verified' : 'unverified'"
              :label="displayTeam.isVerified ? 'Верифікована' : 'Не верифікована'"
              size="xs"
            />
            <span v-if="verifiedAtLabel" class="font-mono text-[10px] text-white/40">
              {{ verifiedAtLabel }}
            </span>
          </div>
        </div>
      </div>
    </template>

    <div class="relative flex h-full flex-col overflow-auto [scrollbar-width:thin]">
      <div
        v-loading="rosterHydrating"
        element-loading-background="rgba(7, 8, 15, 0.7)"
        class="relative flex min-h-[100px] flex-col gap-16 pb-16"
      >
        <!-- Ключові дані: рейтинг · Dota ID · капітан · тренер -->
        <dl class="team-drawer__data">
          <div class="team-drawer__data-row">
            <dt class="team-drawer__data-label">
              <PhChartBar :size="12" weight="bold" class="text-primary/60" />
              <span>Рейтинг</span>
            </dt>
            <el-tooltip
              placement="top"
              effect="dark"
              content="Середній рейтинг гравців основи"
            >
              <dd class="team-drawer__data-value text-primary neon-text-subtle">
                {{ mainAvgRating ?? '—' }}
              </dd>
            </el-tooltip>
            <span class="team-drawer__data-action" />
          </div>

          <div class="team-drawer__data-row">
            <dt class="team-drawer__data-label">
              <PhIdentificationBadge :size="12" weight="bold" class="text-primary/60" />
              <span>Dota ID</span>
            </dt>
            <dd class="team-drawer__data-value text-white/85">
              {{ dotaTeamIdDisplay || '—' }}
            </dd>
            <span class="team-drawer__data-action">
              <template v-if="dotaTeamIdDisplay">
                <el-tooltip content="Скопіювати Dota ID" placement="top" effect="dark">
                  <button
                    type="button"
                    class="team-drawer__chip"
                    aria-label="Скопіювати Dota ID"
                    @click="copyDotaTeamId()"
                  >
                    <PhCopy :size="14" />
                  </button>
                </el-tooltip>
                <el-tooltip content="Dotabuff" placement="top" effect="dark">
                  <a
                    class="team-drawer__chip"
                    target="_blank"
                    rel="noopener noreferrer"
                    :href="getDotabuffTeamUrl(displayTeam.dotaTeamId)"
                    aria-label="Відкрити на Dotabuff"
                  >
                    <Icon :size="14" name="dotabuff" />
                  </a>
                </el-tooltip>
              </template>
            </span>
          </div>

          <div v-if="displayTeam.captain" class="team-drawer__data-row">
            <dt class="team-drawer__data-label">
              <PhCrown :size="12" weight="fill" class="text-gold/80" />
              <span>Капітан</span>
            </dt>
            <dd class="team-drawer__data-value team-drawer__data-value--text">
              <RouterLink
                :to="{ name: routeNames.player, params: { id: displayTeam.captain.id } }"
                class="team-drawer__person"
              >
                {{ displayTeam.captain.discordName || '—' }}
              </RouterLink>
            </dd>
            <span class="team-drawer__data-action" />
          </div>

          <div v-if="displayTeam.coach" class="team-drawer__data-row">
            <dt class="team-drawer__data-label">
              <PhStrategy :size="12" weight="bold" class="text-primary/60" />
              <span>Тренер</span>
            </dt>
            <dd class="team-drawer__data-value team-drawer__data-value--text">
              <RouterLink
                :to="{ name: routeNames.player, params: { id: displayTeam.coach.id } }"
                class="team-drawer__person"
              >
                {{ displayTeam.coach.discordName || '—' }}
              </RouterLink>
            </dd>
            <span class="team-drawer__data-action" />
          </div>
        </dl>

        <!-- Основний склад -->
        <section class="flex flex-col gap-8">
          <header class="team-drawer__section">
            <h2 class="section-title section-title--left">
              Основний склад
            </h2>
            <span class="team-drawer__counter" :class="{ 'is-full': mainSlotCounts === 0 }">
              {{ pad(displayTeam.mainPlayers?.length ?? 0) }}/{{ pad(MAIN_SLOTS) }}
            </span>
          </header>

          <div class="flex flex-col gap-6">
            <TeamRosterRow
              v-for="player in displayTeam.mainPlayers"
              :key="player.id"
              :player="player"
              :is-captain="player.id === displayTeam.captain?.id"
            />
            <SlotLine
              v-if="mainSlotCounts > 0"
              :free="mainSlotCounts"
              :is-admin="isAdmin"
              @add="onAddPlayerClick(true)"
            />
          </div>
        </section>

        <!-- Запас -->
        <section class="flex flex-col gap-8">
          <header class="team-drawer__section">
            <h2 class="section-title section-title--left">
              Запас
            </h2>
            <span class="team-drawer__counter" :class="{ 'is-full': reserveSlotCounts === 0 }">
              {{ pad(displayTeam.reservedPlayers?.length ?? 0) }}/{{ pad(RESERVE_SLOTS) }}
            </span>
          </header>

          <div class="flex flex-col gap-6">
            <TeamRosterRow
              v-for="player in displayTeam.reservedPlayers"
              :key="player.id"
              :player="player"
              :is-captain="player.id === displayTeam.captain?.id"
            />
            <SlotLine
              v-if="reserveSlotCounts > 0"
              :free="reserveSlotCounts"
              :is-admin="isAdmin"
              @add="onAddPlayerClick(false)"
            />
          </div>
        </section>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import type { FunctionalComponent } from 'vue'
import { ElButton } from 'element-plus'
import {
  PhChartBar,
  PhCopy,
  PhCrown,
  PhIdentificationBadge,
  PhPlus,
  PhStrategy,
  PhUsersThree
} from '@phosphor-icons/vue'
import { routeNames } from '@/router/route-names'
import { getCopy, getDotabuffTeamUrl, resolvePublicOrApiUrl } from '@/core/helpers'
import { computeTeamAvgRatingRounded } from '@/components/tournaments-tags/tournament.constants'
import { hydrateTeamPlayersRanks, shallowSnapshotTeamForHydrate } from '@/views/teams/team-roster-hydrate.utils'

const MAIN_SLOTS = 5
const RESERVE_SLOTS = 3

const props = defineProps<{
  team: TTeam
}>()

const modelValue = defineModel<boolean>({ default: false })

const rosterHydrating = ref(false)

const { open } = useAppModals()
const teamsStore = useTeamsStore()

/**
 * Джерело істини — стор (якщо команда там є), інакше проп. Ростер гідратуємо (`rank`)
 * прямо в computed, тож будь-який патч у сторі одразу видно в шухляді.
 */
const displayTeam = computed<TTeam>(() =>
  hydrateTeamPlayersRanks(
    shallowSnapshotTeamForHydrate(teamsStore.teams.find((t) => t.id === props.team.id) ?? props.team)
  )
)
const authStore = useAuthStore()
const isAdmin = computed(() => authStore.isAdmin.isAdmin || authStore.isAdmin.isModerator)

const logoSrc = computed(() => resolvePublicOrApiUrl(displayTeam.value.logoUrl))
const logoLoadFailed = ref(false)
watch(logoSrc, () => {
  logoLoadFailed.value = false
})

const dotaTeamIdDisplay = computed(() => displayTeam.value.dotaTeamId?.trim() ?? '')

const mainAvgRating = computed(() => computeTeamAvgRatingRounded(displayTeam.value.mainPlayers))

const verifiedAtLabel = computed(() => {
  const iso = displayTeam.value.verifiedAt
  if (!displayTeam.value.isVerified || !iso) return ''
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : `з ${date.toLocaleDateString('uk-UA')}`
})

function pad (n: number) {
  return String(n).padStart(2, '0')
}

function copyDotaTeamId () {
  if (!dotaTeamIdDisplay.value) return
  getCopy(dotaTeamIdDisplay.value, 'Dota ID')
}

/**
 * Один рядок замість N пунктирних кнопок: адміну — «Додати гравця · N вільних»,
 * решті — тихий підпис про вільні слоти. Локальний functional-компонент, бо
 * він потрібен лише тут і має два стани.
 */
const SlotLine: FunctionalComponent<{ free: number; isAdmin: boolean }, { add: [] }> = (p, { emit }) => {
  const freeLabel = `${p.free} ${p.free === 1 ? 'вільний слот' : 'вільних слотів'}`
  if (p.isAdmin) {
    return h(
      ElButton,
      { class: 'btn-dashed team-drawer__slot w-full', onClick: () => emit('add') },
      () => [
        h(PhPlus, { size: 14, weight: 'bold' }),
        // Label + note in one baseline-aligned group: two fonts, one baseline.
        h('span', { class: 'team-drawer__slot-text' }, [
          h('span', 'Додати гравця'),
          h('span', { class: 'team-drawer__slot-free' }, `· ${freeLabel}`)
        ])
      ]
    )
  }
  return h('p', { class: 'team-drawer__slot team-drawer__slot--muted' }, freeLabel)
}
SlotLine.props = { free: Number, isAdmin: Boolean }
SlotLine.emits = ['add']

/** Після зміни складу — актуальний GET /teams/:id (для модалки та лічильників слотів). */
async function loadFreshTeamFromApi () {
  const tid = props.team?.id
  if (!tid) return
  rosterHydrating.value = true
  try {
    await teamsStore.refreshTeam(tid)
  } finally {
    rosterHydrating.value = false
  }
}

function onAddPlayerClick (isMain: boolean) {
  open('PlayerAddToTeamModal', {
    team: displayTeam.value,
    isMain,
    onAdded: loadFreshTeamFromApi
  })
}

const mainSlotCounts = computed(() => {
  return Math.max(0, MAIN_SLOTS - (displayTeam.value.mainPlayers?.length ?? 0))
})

const reserveSlotCounts = computed(() => {
  return Math.max(0, RESERVE_SLOTS - (displayTeam.value.reservedPlayers?.length ?? 0))
})

function close () {
  modelValue.value = false
}
</script>

<style scoped lang="scss">
// Everything in the drawer shares the card vocabulary: dark wells, cyan
// hairlines, mono labels, tabular values, 28px action chips.
.team-drawer__logo {
  @apply flex size-48 items-center justify-center;
  border: 1px solid rgba(var(--ds-primary-rgb), 0.3);
  background: rgba(0, 0, 0, 0.45);
  box-shadow: var(--ds-glow-primary-soft);
}

.team-drawer__data {
  @apply m-0 flex w-full flex-col overflow-hidden rounded-lg;
  border: 1px solid rgba(var(--ds-primary-rgb), 0.16);
  background: rgba(0, 0, 0, 0.3);
  box-shadow: inset 0 1px 0 rgba(var(--ds-primary-rgb), 0.12);
}

.team-drawer__data-row {
  @apply grid min-h-[38px] items-center gap-8 px-10;
  grid-template-columns: auto minmax(0, 1fr) auto;

  & + & {
    border-top: 1px solid rgba(var(--ds-primary-rgb), 0.1);
  }
}

.team-drawer__data-label {
  @apply m-0 inline-flex items-center gap-6;
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.team-drawer__data-value {
  @apply m-0 min-w-0 truncate text-right;
  font-family: var(--ds-font-mono);
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  font-variant-numeric: tabular-nums;

  &--text {
    font-family: var(--ds-font-display);
    font-size: 12px;
    font-weight: 400;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
}

// Fixed-width action column keeps the value column aligned across rows even
// when a row has no actions.
.team-drawer__data-action {
  @apply inline-flex min-w-[28px] items-center justify-end gap-6;
}

.team-drawer__person {
  @apply text-white no-underline;
  transition: color var(--ds-duration-fast) ease;

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.55);
    outline-offset: 2px;
  }
}

.team-drawer__chip {
  @apply inline-flex size-28 items-center justify-center rounded-md border no-underline;
  color: rgba(255, 255, 255, 0.75);
  border-color: rgba(var(--ds-primary-rgb), 0.16);
  background: rgba(0, 0, 0, 0.3);
  transition:
    color var(--ds-duration-fast) ease,
    border-color var(--ds-duration-base) ease,
    box-shadow var(--ds-duration-base) ease;

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.55);
    outline-offset: 2px;
  }
}

.team-drawer__section {
  @apply flex items-center justify-between gap-12;

  // The shared title carries a gradient rule underneath; keep it tight here.
  .section-title {
    @apply m-0;
    font-size: 12px;
  }
}

.team-drawer__counter {
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-faint);

  &.is-full {
    color: var(--ds-primary);
    text-shadow: var(--ds-neon-text-subtle);
  }
}

.team-drawer__slot {
  @apply m-0 flex min-h-[40px] items-center justify-center gap-8 rounded-lg text-[12px];

  // Element Plus wraps button children in its own <span>; the gap lives there.
  :deep(> span) {
    @apply inline-flex w-full items-center justify-center gap-8;
  }

  &--muted {
    border: 1px dashed rgba(var(--ds-primary-rgb), 0.16);
    color: var(--ds-text-faint);
    font-family: var(--ds-font-mono);
    font-size: 11px;
    letter-spacing: 0.06em;
  }
}

// Different typefaces (Exo 2 label, JetBrains Mono note) never share a box
// centre, so the pair is aligned on the text baseline instead.
:deep(.team-drawer__slot-text) {
  @apply inline-flex items-baseline gap-6;
  line-height: 1;
}

:deep(.team-drawer__slot-free) {
  font-family: var(--ds-font-mono);
  font-size: 12px; // same size as the label so the pair reads as one line
  letter-spacing: 0.04em;
  color: var(--ds-text-faint);
}

@media (hover: hover) and (pointer: fine) {
  .team-drawer__person:hover {
    color: var(--ds-primary);
  }

  .team-drawer__chip:hover {
    color: var(--ds-primary);
    border-color: rgba(var(--ds-primary-rgb), 0.5);
    box-shadow: var(--ds-glow-primary-soft);
  }
}
</style>
