<template>
  <div
    class="user-card neon-card hud-corners group relative z-10 flex w-full !cursor-pointer flex-col gap-16
           overflow-hidden rounded-2xl px-18 py-20"
    :class="accentClass"
    :style="[{ maxWidth: `${width}px` }, vipFrameStyle]"
    @click="goToPlayerPage(user.id)"
  >
    <!-- Амбієнтне світло за аватаром: картка «дихає» кольором бренду -->
    <span class="user-card__aura" aria-hidden="true" />

    <!-- Локація: прапорець у куті, «Місто, Країна» — у підказці (висота картки незмінна) -->
    <el-tooltip
      v-if="locationLabel"
      :content="locationLabel"
      placement="top"
      effect="dark"
      :show-after="150"
    >
      <img
        :src="flagUrl"
        :srcset="`${getCountryFlagUrl(user.countryCode, 40)} 2x`"
        :alt="locationLabel"
        width="16"
        height="12"
        loading="lazy"
        draggable="false"
        class="user-card__flag absolute right-18 top-20 z-30 h-[12px] w-[16px] select-none rounded-[2px]
               object-cover ring-1 ring-white/15"
      >
    </el-tooltip>

    <!-- Ідентичність: аватар + імена -->
    <div class="relative z-10 flex items-center gap-12">
      <div class="relative shrink-0">
        <el-avatar
          :size="60"
          :src="user.avatarUrl ?? ''"
          class="user-card__avatar"
        >
          <template #default>
            <PhUser :size="26" weight="bold" class="text-white/70" />
          </template>
        </el-avatar>

        <!-- VIP займає місце бейджа верифікації: «стрічка» по нижньому краю аватара -->
        <el-tooltip
          v-if="isVip"
          content="VIP-гравець Core League"
          placement="bottom"
          effect="dark"
          :show-after="180"
        >
          <VipBadge
            size="xs"
            static
            class="user-card__vip !absolute -bottom-6 left-1/2 z-10 -translate-x-1/2"
          />
        </el-tooltip>
        <el-tooltip
          v-else
          :content="isVerified ? 'Верифікований' : 'Не верифікований'"
          placement="bottom"
          effect="dark"
          :show-after="180"
        >
          <StatusBadge
            :preset="isVerified ? 'verified' : 'unverified'"
            size="xs"
            icon-only
            class="absolute -bottom-2 -right-2 z-10"
          />
        </el-tooltip>
      </div>

      <div class="flex min-w-0 flex-1 flex-col gap-3 pr-40">
        <span class="sys-label sys-label--muted !text-[9px]">{{ cardRoleLabel }}</span>
        <el-tooltip
          :disabled="!user.discordName"
          :content="user.discordName || 'Імʼя відсутнє'"
          placement="top"
          effect="dark"
          :show-after="200"
        >
          <h2 class="user-card__name">
            {{ user.discordName || '—' }}
          </h2>
        </el-tooltip>
        <button
          v-if="user.discordUsername"
          type="button"
          class="user-card__handle !w-fit"
          :title="`Скопіювати @${user.discordUsername}`"
          @click.stop="copyDiscordName(user)"
        >
          <span class="truncate">@{{ user.discordUsername }}</span>
          <PhCopy :size="12" class="shrink-0 opacity-60" />
        </button>
        <span v-else class="font-mono text-[11px] text-white/35">—</span>
      </div>
    </div>

    <!-- HUD-смуга: ранг + MMR | індикатор позицій 1–5 -->
    <div class="user-card__stats relative z-10">
      <el-tooltip :content="ratingMmrLabel" placement="top" effect="dark" :show-after="180">
        <div class="user-card__stat">
          <img
            v-if="rankImageSrc"
            :src="rankImageSrc"
            alt=""
            class="h-36 w-auto max-w-[48px] select-none object-contain"
            width="48"
            height="36"
            loading="lazy"
            draggable="false"
          >
          <div class="flex min-w-0 flex-col items-start gap-2">
            <span class="user-card__mmr whitespace-nowrap">{{ user.rating ?? '—' }}</span>
            <span class="sys-label sys-label--muted !text-[9px]">MMR</span>
          </div>
        </div>
      </el-tooltip>

      <!-- Індикатор 1–5 говорить сам за себе; підказка не потрібна -->
      <div
        class="user-card__stat user-card__stat--positions"
        :class="{ 'is-empty': !positionsSummary.hasPositions }"
      >
        <div class="user-card__pips" role="img" :aria-label="positionsSummary.oneLine">
          <span
            v-for="n in 5"
            :key="n"
            class="user-card__pip"
            :class="{ 'is-on': positionIds.has(n) }"
          >
            {{ n }}
          </span>
        </div>
        <span class="sys-label sys-label--muted !text-[9px]">Позиції</span>
      </div>
    </div>

    <!-- Командний статус і ролі -->
    <div class="relative z-10 grid grid-cols-2 gap-8">
      <div class="min-w-0 overflow-x-auto [scrollbar-width:thin]">
        <PlayerTeamTag stretch-in-grid :user />
      </div>
      <div class="min-w-0 overflow-x-auto [scrollbar-width:thin]">
        <PlayerRoleTag stretch-in-grid :user />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { routeNames } from '@/router/route-names'
import {
  formatPlayerPositionsSummary,
  formatPlayerRatingMmr,
  getCopy,
  getPlayerRankImageSrcFromPlayerRank,
  getPlayerRoleAccentClass,
  getPlayerVipFrameStyle,
  hasPlayerRole,
  isPlayerVerified,
  isPlayerVip
} from '@/core/helpers'
import { PhCopy, PhUser } from '@phosphor-icons/vue'
import VipBadge from '@/components/VipBadge.vue'
import { getCountryFlagUrl, useLocations } from '@/composables/use-locations'
import { ERole } from '@/types/general.enums'

const props = withDefaults(defineProps<{
  user: TPlayer
  width?: number
}>(), {
  width: 210
})

const router = useRouter()

const isVerified = computed(() => isPlayerVerified(props.user))

const isVip = computed(() => isPlayerVip(props.user))

/** Підпис над іменем: службова роль (медіа → адмін → ІТ), інакше «Гравець». */
const cardRoleLabel = computed(() => {
  const roles = props.user.roles
  if (hasPlayerRole(roles, ERole.MEDIA)) return 'Стрімер'
  if (hasPlayerRole(roles, ERole.ADMIN)) return 'Адмін'
  if (hasPlayerRole(roles, ERole.DEV)) return 'Програміст'
  return 'Гравець'
})

/** Акцент рамки (`.role-frame--*`): обраний VIP-колір, інакше роль (адмін — золото, медіа — фіолет). */
const accentClass = computed(() => getPlayerRoleAccentClass(props.user))
/** `--vip-frame-rgb` для `.role-frame--vip`. */
const vipFrameStyle = computed(() => getPlayerVipFrameStyle(props.user))

const rankImageSrc = computed(() => getPlayerRankImageSrcFromPlayerRank(props.user.rank))

const ratingMmrLabel = computed(() => formatPlayerRatingMmr(props.user.rating))

const positionsSummary = computed(() => formatPlayerPositionsSummary(props.user))

// ─── Локація: «Місто, Країна» українською; країна — через Intl, без мережі ───
const { countryLabel } = useLocations()
const countryCode = computed(() => String(props.user.countryCode ?? '').trim().toUpperCase())
const flagUrl = computed(() => getCountryFlagUrl(countryCode.value, 20))
const locationLabel = computed(() => {
  if (!countryCode.value) return ''
  const country = countryLabel(countryCode.value)
  const city = String(props.user.city ?? '').trim()
  return city ? `${city}, ${country}` : country
})

/** Позиції гравця як множина для індикатора 1–5. */
const positionIds = computed(() => new Set(positionsSummary.value.rows.map(row => row.id)))

function copyDiscordName (player: TPlayer) {
  getCopy(player.discordUsername, 'Discord')
}

function goToPlayerPage (id: string) {
  router.push({ name: routeNames.player, params: { id } })
}
</script>

<style scoped lang="scss">
// Player dossier card. One hero number (MMR) in the mono neon register, a
// five-pip position readout that shows the whole role profile at a glance,
// and a soft brand aura behind the avatar so the surface is not flat.

// Role frame (`.role-frame--*` in _neon.scss) tints border and corners; the
// aura follows so the whole card reads in the role colour.
.role-frame--gold .user-card__aura,
.role-frame--violet .user-card__aura,
.role-frame--vip .user-card__aura {
  background: radial-gradient(closest-side, rgba(var(--role-frame-rgb), 0.2), transparent 100%);
}

.user-card__aura {
  position: absolute;
  inset: -40px auto auto -40px;
  width: 200px;
  height: 160px;
  pointer-events: none;
  z-index: 0;
  background: radial-gradient(closest-side, rgba(var(--ds-primary-rgb), 0.18), transparent 100%);
  opacity: 0.8;
  transition: opacity var(--ds-duration-base) ease;
}

.user-card__avatar {
  border: 1px solid rgba(var(--ds-primary-rgb), 0.35);
  background: rgba(0, 0, 0, 0.5);
  box-shadow: var(--ds-glow-primary-soft);
}

.user-card__name {
  @apply m-0 truncate font-display text-[16px] uppercase leading-tight tracking-wide text-white;
  transition: color var(--ds-duration-base) ease, text-shadow var(--ds-duration-base) ease;
}

.user-card__handle {
  @apply m-0 inline-flex max-w-full items-center gap-4 border-0 bg-transparent p-0 text-left font-mono text-[12px]
    text-white/45;
  cursor: pointer;
  transition: color var(--ds-duration-fast) ease;

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.55);
    outline-offset: 2px;
  }
}

// VIP pill sits on top of the avatar photo: the stock foil is translucent, so lay
// it over an opaque dark base to keep it legible on any picture.
.user-card .user-card__vip {
  background:
    linear-gradient(120deg, rgba(255, 206, 84, 0.38), rgba(255, 94, 170, 0.34)),
    rgb(22, 16, 24);
  box-shadow: 0 0 10px rgba(255, 206, 84, 0.35), 0 2px 6px rgba(0, 0, 0, 0.6);
}

// Country flag in the corner: quiet by default, lifts on card hover.
.user-card__flag {
  opacity: 0.85;
  transition: opacity var(--ds-duration-fast) ease;
}

// Stats strip: two cells on one dark well, split by a hairline.
.user-card__stats {
  @apply grid overflow-hidden rounded-lg;
  // The pip readout has a fixed natural width; give it exactly that and let
  // the MMR cell take the rest, so nothing is ever clipped.
  grid-template-columns: minmax(0, 1fr) auto;
  border: 1px solid rgba(var(--ds-primary-rgb), 0.16);
  background: rgba(0, 0, 0, 0.3);
  box-shadow: inset 0 1px 0 rgba(var(--ds-primary-rgb), 0.12);
}

.user-card__stat {
  @apply flex min-h-[76px] min-w-0 cursor-default items-center gap-8 px-10 py-10;

  & + & {
    border-left: 1px solid rgba(var(--ds-primary-rgb), 0.1);
  }

  &--positions {
    @apply flex-col items-center justify-center gap-8 px-12;
  }
}

.user-card__mmr {
  font-family: var(--ds-font-mono);
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;
  color: var(--ds-primary);
  text-shadow: var(--ds-neon-text-subtle);
}

// Position readout: five pips, the player's positions lit in cyan.
.user-card__pips {
  @apply flex shrink-0 items-center gap-5;
}

.user-card__pip {
  @apply inline-flex size-20 shrink-0 items-center justify-center rounded-sm;
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  color: rgba(255, 255, 255, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
  transition: color var(--ds-duration-base) ease, border-color var(--ds-duration-base) ease,
    box-shadow var(--ds-duration-base) ease;

  &.is-on {
    color: var(--ds-primary);
    border-color: rgba(var(--ds-primary-rgb), 0.6);
    background: rgba(var(--ds-primary-rgb), 0.14);
    box-shadow: 0 0 8px rgba(var(--ds-primary-rgb), 0.45), inset 0 0 6px rgba(var(--ds-primary-rgb), 0.15);
    text-shadow: var(--ds-neon-text-subtle);
  }
}

.user-card__stat--positions.is-empty .user-card__pips {
  opacity: 0.55;
}

@media (hover: hover) and (pointer: fine) {
  .user-card:hover {
    .user-card__aura {
      opacity: 1;
    }

    .user-card__name {
      color: var(--ds-primary);
      text-shadow: var(--ds-neon-text-subtle);
    }
  }

  .user-card__handle:hover {
    color: var(--ds-primary);
  }

  .user-card:hover .user-card__flag {
    opacity: 1;
  }
}
</style>
