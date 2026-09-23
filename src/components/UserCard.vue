<template>
  <div
    class="user-card neon-card hud-corners group relative z-10 flex w-full !cursor-pointer flex-col gap-16
           overflow-hidden rounded-2xl px-18 py-20"
    :class="accentClass"
    :style="{ maxWidth: `${width}px` }"
    @click="goToPlayerPage(user.id)"
  >
    <!-- Амбієнтне світло за аватаром: картка «дихає» кольором бренду -->
    <span class="user-card__aura" aria-hidden="true" />

    <!-- Dropdown три крапки (адмін / модератор) -->
    <el-dropdown
      v-if="me.isAdmin.isAdmin || me.isAdmin.isModerator"
      trigger="click"
      :placement="isMobile ? 'left-start' : 'bottom'"
      class="user-card__menu absolute right-10 top-10 z-30"
      @click.stop
    >
      <button
        type="button"
        class="user-card__menu-btn"
        aria-label="Дії адміністратора"
        @click.stop
      >
        <PhDotsThree :size="18" weight="bold" />
      </button>

      <template #dropdown>
        <div class="w-[220px] flex flex-col gap-10 p-10 rounded-lg shadow-lg">
          <el-button
            :type="isVerified ? 'warning' : 'success'"
            class="w-full justify-center shrink-0 max-sm:text-xs max-sm:!px-8"
            :loading="verificationLoading"
            @click.stop="toggleVerificationFromMenu"
          >
            <component
              :is="isVerified ? PhSealWarning : PhSealCheck"
              class="mr-8 shrink-0"
              weight="bold"
              size="16"
            />
            {{ isVerified ? 'Зняти верифікацію' : 'Верифікувати' }}
          </el-button>
        </div>
      </template>
    </el-dropdown>

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

        <el-tooltip
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

      <div class="flex min-w-0 flex-1 flex-col gap-3 pr-20">
        <span class="sys-label sys-label--muted !text-[9px]">Гравець</span>
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
          class="user-card__handle"
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
import { useWindowSize } from '@vueuse/core'

import { routeNames } from '@/router/route-names'
import {
  formatPlayerPositionsSummary,
  formatPlayerRatingMmr,
  getCopy,
  getPlayerRankImageSrcFromPlayerRank,
  getPlayerRoleAccentClass,
  isPlayerVerified
} from '@/core/helpers'
import {
  PhCopy,
  PhSealCheck,
  PhUser,
  PhSealWarning,
  PhDotsThree
} from '@phosphor-icons/vue'

const props = withDefaults(defineProps<{
  user: TPlayer
  width?: number
}>(), {
  width: 210
})

const window = useWindowSize()
const me = useAuthStore()
const router = useRouter()

const isMobile = computed(() => window.width.value < 850)
const verificationLoading = ref(false)

const isVerified = computed(() => isPlayerVerified(props.user))

/** Рольовий акцент рамки (`.role-frame--*`): адмін — золото, медіа — фіолет. */
const accentClass = computed(() => getPlayerRoleAccentClass(props.user))

const rankImageSrc = computed(() => getPlayerRankImageSrcFromPlayerRank(props.user.rank))

const ratingMmrLabel = computed(() => formatPlayerRatingMmr(props.user.rating))

const positionsSummary = computed(() => formatPlayerPositionsSummary(props.user))

/** Позиції гравця як множина для індикатора 1–5. */
const positionIds = computed(() => new Set(positionsSummary.value.rows.map(row => row.id)))

function copyDiscordName (player: TPlayer) {
  getCopy(player.discordUsername, 'Discord')
}

function goToPlayerPage (id: string) {
  router.push({ name: routeNames.player, params: { id } })
}

async function toggleVerificationFromMenu () {
  const u = props.user
  if (!u || verificationLoading.value) return
  verificationLoading.value = true
  try {
    await usePlayersStore().setPlayerVerification(u.id, !isVerified.value)
  } finally {
    verificationLoading.value = false
  }
}
</script>

<style scoped lang="scss">
// Player dossier card. One hero number (MMR) in the mono neon register, a
// five-pip position readout that shows the whole role profile at a glance,
// and a soft brand aura behind the avatar so the surface is not flat.

// Role frame (`.role-frame--*` in _neon.scss) tints border and corners; the
// aura follows so the whole card reads in the role colour.
.role-frame--gold .user-card__aura,
.role-frame--violet .user-card__aura {
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

// Admin menu trigger: a real 32px button so it is a proper touch target.
.user-card__menu-btn {
  @apply inline-flex size-32 items-center justify-center rounded-md border-0 bg-transparent p-0 text-white/60;
  transition: color var(--ds-duration-fast) ease, background-color var(--ds-duration-fast) ease;

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.55);
    outline-offset: 2px;
  }
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

  .user-card__menu-btn:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.08);
  }
}
</style>
