<template>
  <article
    class="find-card neon-card hud-corners flex w-full flex-col gap-14 rounded-2xl px-16 py-16"
    :class="[accentClass, { 'is-mine': mine }]"
    :style="vipFrameStyle"
  >
    <!-- Гравець: аватар, імʼя, бейджі -->
    <header class="flex items-center gap-12">
      <RouterLink
        :to="{ name: routeNames.player, params: { id: player.id } }"
        class="relative shrink-0 no-underline"
        :aria-label="playerName"
      >
        <el-avatar :size="48" :src="player.avatarUrl ?? ''" class="find-card__avatar">
          <PhUser :size="22" weight="bold" class="text-white/70" />
        </el-avatar>
      </RouterLink>

      <div class="flex min-w-0 flex-1 flex-col gap-4">
        <RouterLink
          :to="{ name: routeNames.player, params: { id: player.id } }"
          class="find-card__title no-underline"
          :title="playerName"
        >
          {{ playerName }}
        </RouterLink>
        <span class="find-card__sub">
          <template v-if="player.discordUsername">@{{ player.discordUsername }}</template>
          <template v-if="locationLabel"> · {{ locationLabel }}</template>
        </span>
      </div>

      <div class="flex shrink-0 items-center gap-6">
        <el-tooltip v-if="isVip" content="VIP-гравець" placement="top" effect="dark">
          <VipBadge size="xs" static />
        </el-tooltip>
        <el-tooltip
          :content="isVerified ? 'Верифікований' : 'Не верифікований'"
          placement="top"
          effect="dark"
        >
          <StatusBadge :preset="isVerified ? 'verified' : 'unverified'" size="sm" icon-only />
        </el-tooltip>
      </div>
    </header>

    <!-- Профіль: ранг + MMR, позиції, формат -->
    <dl class="find-card__facts">
      <div class="find-card__fact">
        <dt class="sys-label sys-label--muted">MMR</dt>
        <dd class="flex items-center gap-8">
          <img
            v-if="rankImageSrc"
            :src="rankImageSrc"
            alt=""
            class="h-28 w-auto select-none object-contain"
            width="36"
            height="28"
            loading="lazy"
            draggable="false"
          >
          <span class="find-card__mono">{{ player.rating ?? '—' }}</span>
        </dd>
      </div>
      <div class="find-card__fact">
        <dt class="sys-label sys-label--muted">Позиції</dt>
        <dd class="find-card__pips" role="img" :aria-label="positionsSummary.oneLine">
          <span v-for="n in 5" :key="n" class="find-card__pip" :class="{ 'is-on': positionIds.has(n) }">
            {{ n }}
          </span>
        </dd>
      </div>
      <div class="find-card__fact find-card__fact--wide">
        <dt class="sys-label sys-label--muted">Формат</dt>
        <dd>{{ formatsLabel }}</dd>
      </div>
    </dl>

    <p v-if="listing.description" class="find-card__text">{{ listing.description }}</p>

    <div class="min-h-0 flex-1" aria-hidden="true" />

    <!-- Дії -->
    <footer class="find-card__actions">
      <template v-if="mine">
        <el-button plain class="flex-1" @click="emit('edit', listing)">
          <PhPencilSimple :size="14" weight="bold" class="mr-6" />
          Редагувати
        </el-button>
        <el-button plain type="danger" class="flex-1" :loading="busy" @click="emit('remove', listing)">
          Зняти
        </el-button>
      </template>

      <template v-else>
        <template v-if="listing.myTeamInvite">
          <span class="find-card__state">
            <PhClockCountdown :size="14" weight="bold" />
            Запрошено
          </span>
          <el-button plain class="flex-1" :loading="busy" @click="emit('cancelInvite', listing)">
            Скасувати
          </el-button>
        </template>
        <el-button v-else-if="canInvite" type="primary" class="flex-1" @click="emit('invite', listing)">
          <PhUserPlus :size="14" weight="bold" class="mr-6" />
          Запросити
        </el-button>

        <el-tooltip v-if="isAdmin" content="Видалити оголошення (модерація)" placement="top" effect="dark">
          <el-button plain type="danger" class="btn-icon" :loading="busy" @click="emit('moderate', listing)">
            <PhTrash :size="14" weight="bold" />
          </el-button>
        </el-tooltip>
      </template>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { PhClockCountdown, PhPencilSimple, PhTrash, PhUser, PhUserPlus } from '@phosphor-icons/vue'
import { routeNames } from '@/router/route-names'
import {
  formatPlayerPositionsSummary,
  getPlayerRankImageSrcFromPlayerRank,
  getPlayerRoleAccentClass,
  getPlayerVipFrameStyle,
  getPlayerWantToPlay,
  isPlayerVerified,
  isPlayerVip
} from '@/core/helpers'
import { getTournamentFormatLabel } from '@/components/player-tags/player.enums'
import { useLocations } from '@/composables/use-locations'
import VipBadge from '@/components/VipBadge.vue'
import type { TPlayerListing } from '@/api/types/api.types'

const props = defineProps<{
  listing: TPlayerListing
  /** Моє оголошення — редагування замість запрошення. */
  mine?: boolean
  /** Глядач керує командою (або адмін) і може запросити. */
  canInvite?: boolean
  isAdmin?: boolean
  busy?: boolean
}>()

const emit = defineEmits<{
  invite: [listing: TPlayerListing]
  cancelInvite: [listing: TPlayerListing]
  edit: [listing: TPlayerListing]
  remove: [listing: TPlayerListing]
  moderate: [listing: TPlayerListing]
}>()

const player = computed(() => props.listing.player)
const playerName = computed(() => player.value.discordName || player.value.discordUsername || 'Гравець')

const isVip = computed(() => isPlayerVip(player.value))
const isVerified = computed(() => isPlayerVerified(player.value))
const accentClass = computed(() => getPlayerRoleAccentClass(player.value))
const vipFrameStyle = computed(() => getPlayerVipFrameStyle(player.value))
const rankImageSrc = computed(() => getPlayerRankImageSrcFromPlayerRank(player.value.rank))

const positionsSummary = computed(() => formatPlayerPositionsSummary(player.value))
const positionIds = computed(() => new Set(positionsSummary.value.rows.map(row => row.id)))

const formatsLabel = computed(() => {
  const formats = getPlayerWantToPlay(player.value)
  if (!formats.length) return 'Не вказано'
  const label = formats.map(getTournamentFormatLabel).join(' · ')
  const cities = player.value.lanCities ?? []
  return formats.includes('LAN') && cities.length ? `${label} (${cities.join(', ')})` : label
})

const { countryLabel } = useLocations()
const locationLabel = computed(() => {
  const code = String(player.value.countryCode ?? '').trim().toUpperCase()
  const city = String(player.value.city ?? '').trim()
  const country = code ? countryLabel(code) : ''
  return [city, country].filter(Boolean).join(', ')
})
</script>

<style scoped lang="scss">
.find-card {
  min-height: 100%;

  &.is-mine {
    border-color: rgba(var(--ds-primary-rgb), 0.5);
  }
}

.find-card__avatar {
  border: 1px solid rgba(var(--ds-primary-rgb), 0.35);
  background: rgba(0, 0, 0, 0.5);
}

.find-card__title {
  @apply truncate font-display text-[15px] uppercase leading-tight tracking-wide text-white;
  transition: color var(--ds-duration-fast) ease;
}

.find-card__sub {
  @apply truncate text-xs;
  color: var(--ds-text-faint);
}

.find-card__facts {
  @apply m-0 grid grid-cols-2 gap-10 rounded-xl border p-12;
  border-color: rgba(var(--ds-primary-rgb), 0.12);
  background: rgba(0, 0, 0, 0.3);
}

.find-card__fact {
  @apply flex min-w-0 flex-col gap-4;

  &--wide {
    @apply col-span-2;
  }

  dt {
    font-size: 9px !important;
  }

  dd {
    @apply m-0 min-w-0 text-sm;
    color: var(--ds-text);
  }
}

.find-card__mono {
  font-family: var(--ds-font-mono);
  font-size: 16px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--ds-primary);
}

.find-card__pips {
  @apply flex items-center gap-4;
}

.find-card__pip {
  @apply inline-flex size-22 items-center justify-center rounded-md border text-[11px];
  font-family: var(--ds-font-mono);
  border-color: var(--ds-border-neutral);
  color: var(--ds-text-faint);

  &.is-on {
    border-color: rgba(var(--ds-primary-rgb), 0.55);
    background: rgba(var(--ds-primary-rgb), 0.14);
    color: var(--ds-text-strong);
  }
}

.find-card__text {
  @apply m-0 line-clamp-4 whitespace-pre-line text-sm leading-relaxed;
  color: var(--ds-text-muted);
  overflow-wrap: anywhere;
}

.find-card__actions {
  @apply flex items-center gap-8;

  .el-button + .el-button {
    margin-left: 0;
  }
}

.find-card__state {
  @apply inline-flex flex-1 items-center gap-6 text-xs font-semibold;
  color: var(--ds-gold);
}

@media (hover: hover) and (pointer: fine) {
  .find-card__title:hover {
    color: var(--ds-primary);
  }
}
</style>
