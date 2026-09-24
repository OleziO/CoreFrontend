<template>
  <article
    class="team-hero neon-card hud-corners hud-corners--fade rounded-2xl"
    :class="{ 'is-lit': team?.isVerified, 'team-hero--has-menu': canEditTeamRoster }"
  >
    <span class="hud-corners hud-corners--mirror hud-corners--fade absolute inset-0 z-[3]" aria-hidden="true" />
    <span class="team-hero__glow" aria-hidden="true" />

    <!-- Roster menu, pinned to the top-right corner -->
    <el-dropdown
      v-if="canEditTeamRoster"
      trigger="click"
      :placement="isMobile ? 'left-start' : 'bottom-end'"
      popper-class="header-dropdown"
      class="team-hero__menu"
      @click.stop
    >
      <button type="button" class="team-hero__menu-btn" aria-label="Дії з командою" @click.stop>
        <PhDotsThree :size="20" weight="bold" />
      </button>

      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item v-if="canVerifyPlayers" @click="emit('verify-players')">
            <PhUserCheck :size="20" />
            <span class="ml-8">Подати заявку на верифікацію</span>
          </el-dropdown-item>
          <el-dropdown-item @click="emit('transfer-captain')">
            <PhCrown :size="20" />
            <span class="ml-8">Передати капітанство</span>
          </el-dropdown-item>
          <el-dropdown-item class="header-user-menu__item--danger" divided @click="emit('disband-team')">
            <PhTrash :size="20" />
            <span class="ml-8">Розпустити команду</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <!-- Identity: framed logo + name + meta chips -->
    <div class="team-hero__main">
      <div class="team-hero__logo">
        <el-avatar :size="112" shape="square" :src="teamLogoSrc ?? ''" class="team-hero__avatar">
          <template #default>
            <PhUser :size="32" weight="bold" class="text-white/70" />
          </template>
        </el-avatar>

        <el-tooltip :content="team?.isVerified ? 'Верифікована команда' : 'Не верифікована команда'">
          <StatusBadge
            v-if="team"
            :preset="team.isVerified ? 'verified' : 'unverified'"
            size="md"
            icon-only
            class="team-hero__seal"
          />
        </el-tooltip>
      </div>

      <div class="team-hero__body">
        <el-tooltip placement="top" :content="team?.name">
          <h1 class="team-hero__name">{{ team?.name }}</h1>
        </el-tooltip>

        <div class="team-hero__meta">
          <!-- Dota ID: the chip is the copy button -->
          <button
            type="button"
            class="team-chip min-w-0 flex-1"
            :class="{ 'is-static': !dotaTeamIdTrimmed }"
            :disabled="!dotaTeamIdTrimmed"
            :title="dotaTeamIdTrimmed ? 'Скопіювати Dota ID' : undefined"
            @click="copyDotaTeamId"
          >
            <span class="team-chip__k">Dota ID</span>
            <span class="team-chip__v truncate">{{ dotaTeamIdTrimmed || '—' }}</span>
            <PhCopy v-if="dotaTeamIdTrimmed" :size="13" class="team-chip__icon ml-auto" />
          </button>

          <span v-if="avgRating != null" class="team-chip is-static shrink-0" title="Середній рейтинг основи">
            <span class="team-chip__k">avg</span>
            <span class="team-chip__v">{{ avgRating.toLocaleString('uk-UA') }}</span>
          </span>

          <a
            v-if="dotaTeamIdTrimmed"
            :href="getDotabuffTeamUrl(dotaTeamIdTrimmed)"
            target="_blank"
            rel="noopener noreferrer"
            class="team-chip team-chip--icon shrink-0"
            title="Профіль на Dotabuff"
            aria-label="Профіль на Dotabuff"
          >
            <Icon :size="16" name="dotabuff" class="team-chip__brand" />
          </a>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div v-if="canEditTeamProfile || (isAdmin && team)" class="team-hero__actions">
      <el-button
        v-if="canEditTeamProfile"
        type="primary"
        class="team-hero__btn team-hero__btn--edit"
        aria-label="Редагувати команду"
        @click="emit('edit-team')"
      >
        <PhPencil :size="18" />
        <span class="team-hero__btn-label">Редагувати{{ windowWidth > 650 ? ' команду' : '' }}</span>
      </el-button>

      <el-button
        v-if="isAdmin && team && !team.isVerified"
        type="success"
        class="team-hero__btn"
        :loading="verifyTeamLoading"
        @click="emit('verify-team')"
      >
        <PhSealCheck :size="18" />
        <span>Верифікувати команду</span>
      </el-button>

      <el-button
        v-else-if="isAdmin && team?.isVerified"
        type="warning"
        plain
        class="team-hero__btn"
        :loading="verifyTeamLoading"
        @click="emit('unverify-team')"
      >
        <PhSealWarning :size="18" />
        <span>Зняти верифікацію</span>
      </el-button>
    </div>
  </article>
</template>

<script setup lang="ts">
import {
  PhCopy, PhCrown, PhDotsThree, PhPencil, PhSealCheck, PhSealWarning, PhTrash,
  PhUser, PhUserCheck
} from '@phosphor-icons/vue'
import { getCopy, resolvePublicOrApiUrl, getDotabuffTeamUrl } from '@/core/helpers'
import { getTeamAvgRating } from '@/views/teams/teams-filters.utils'

const props = defineProps<{
  team: TTeam | null
  canEditTeamProfile: boolean
  canEditTeamRoster: boolean
  isAdmin: boolean
  canVerifyPlayers: boolean
  verifyTeamLoading: boolean
  isMobile: boolean
  windowWidth: number
}>()

const emit = defineEmits<{
  'edit-team': []
  'verify-players': []
  'verify-team': []
  'unverify-team': []
  'transfer-captain': []
  'disband-team': []
}>()

const teamLogoSrc = computed(() => resolvePublicOrApiUrl(props.team?.logoUrl))
const dotaTeamIdTrimmed = computed(() => props.team?.dotaTeamId?.trim() ?? '')
// Основа без запасних — так само, як рахує бекенд і як показує картка команди.
const avgRating = computed(() => (props.team ? getTeamAvgRating(props.team) : null))

function copyDotaTeamId () {
  if (dotaTeamIdTrimmed.value) getCopy(dotaTeamIdTrimmed.value, 'Dota ID')
}
</script>

<style lang="scss" scoped>
.team-hero {
  --hud-corner-inset: 10px;
  // Arms end at 26px, inside the 28px padding, so a full-width action button
  // or the roster menu never sits on top of a bracket.
  --hud-corner-size: 16px;
  --hud-corner-weight: 2px;

  @apply relative flex w-full flex-col gap-18 overflow-hidden p-28;
}

// Soft cyan bloom behind the logo so the identity block has a light source.
.team-hero__glow {
  position: absolute;
  top: -30%;
  left: -12%;
  width: 55%;
  height: 120%;
  background: radial-gradient(ellipse at center, rgba(var(--ds-primary-rgb), 0.16), transparent 62%);
  filter: blur(28px);
  pointer-events: none;
}

// ─── Menu ───────────────────────────────────────────────────────────────────
// The button takes the top-right corner slot, so the mirrored bracket there is
// dropped — otherwise its arms (10–32px) peek out from behind the 32px button.
.team-hero__menu {
  @apply absolute right-12 top-12 z-[4];
}

.team-hero--has-menu > .hud-corners--mirror::before {
  display: none;
}

.team-hero__menu-btn {
  @apply inline-flex size-32 cursor-pointer items-center justify-center rounded-lg border;
  color: rgba(255, 255, 255, 0.75);
  border-color: var(--ds-border);
  background: rgba(7, 8, 15, 0.45);
  transition:
    color var(--ds-duration-base) ease,
    border-color var(--ds-duration-base) ease,
    background-color var(--ds-duration-base) ease,
    transform var(--ds-duration-press) var(--ds-ease-out);

  &:active {
    transform: scale(0.94);
  }

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.7);
    outline-offset: 2px;
  }
}

// ─── Identity ───────────────────────────────────────────────────────────────
.team-hero__main {
  @apply relative z-[2] flex items-start gap-18;
}

.team-hero__logo {
  @apply relative shrink-0;
}

.team-hero__avatar {
  @apply rounded-2xl;
  width: 112px !important;
  height: 112px !important;
  background: rgba(255, 255, 255, 0.06);
  box-shadow:
    0 0 0 1px rgba(var(--ds-primary-rgb), 0.35),
    0 12px 28px rgba(0, 0, 0, 0.45),
    inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.team-hero__seal {
  @apply absolute -bottom-6 -right-6 z-[2];
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.5));
}

.team-hero__body {
  @apply flex min-w-0 flex-1 flex-col gap-12 pt-2;
}

.team-hero__name {
  @apply pr-40 font-display text-[24px] uppercase leading-[1.05] tracking-wide text-white md:text-[28px];
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  overflow-wrap: anywhere;
  text-shadow: var(--ds-neon-text-subtle);
}

.team-hero__meta {
  @apply flex flex-nowrap items-center gap-8;
}

// HUD chip: label / value / trailing icon. Buttons and links share the look;
// `.is-static` is a read-only fact.
.team-chip {
  @apply inline-flex h-30 items-center gap-8 rounded-lg border px-10 no-underline;
  color: rgba(255, 255, 255, 0.82);
  border-color: rgba(var(--ds-primary-rgb), 0.2);
  background: rgba(7, 8, 15, 0.5);
  font-family: var(--ds-font-mono);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  transition:
    color var(--ds-duration-base) ease,
    border-color var(--ds-duration-base) ease,
    background-color var(--ds-duration-base) ease,
    transform var(--ds-duration-press) var(--ds-ease-out);

  &:active:not(.is-static) {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.7);
    outline-offset: 2px;
  }

  &.is-static {
    cursor: default;
  }
}

.team-chip--icon {
  @apply w-30 justify-center px-0;
}

.team-chip__k {
  flex-shrink: 0;
  white-space: nowrap;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.team-chip__v {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.team-chip__brand {
  color: var(--ds-primary);
}

.team-chip__icon {
  flex-shrink: 0;
  color: var(--ds-text-faint);
  transition: color var(--ds-duration-base) ease, transform var(--ds-duration-base) var(--ds-ease-out);
}

// ─── Actions ────────────────────────────────────────────────────────────────
// Один рядок: кнопки ділять ширину, а на телефоні «Редагувати» стискається до
// квадратної іконки в кінці рядка — як у профілі гравця.
.team-hero__actions {
  @apply relative z-[2] flex gap-10;
}

.team-hero__btn {
  @apply min-w-0 flex-1;
  margin-left: 0 !important;

  :deep(> span) {
    @apply inline-flex items-center gap-8;
  }
}

.team-hero__btn--edit {
  @apply max-xs:order-last max-xs:flex-none max-xs:aspect-square max-xs:px-0;
}

.team-hero__btn-label {
  @apply max-xs:hidden;
}

// ─── Pointer-only hover ─────────────────────────────────────────────────────
@media (hover: hover) and (pointer: fine) {
  .team-hero__menu-btn:hover {
    color: #fff;
    border-color: rgba(var(--ds-primary-rgb), 0.5);
    background: rgba(var(--ds-primary-rgb), 0.08);
  }

  .team-chip:not(.is-static):hover {
    color: #fff;
    border-color: rgba(var(--ds-primary-rgb), 0.55);
    background: rgba(var(--ds-primary-rgb), 0.08);

    .team-chip__icon {
      color: var(--ds-primary);
    }
  }

  a.team-chip:hover .team-chip__icon {
    transform: translate(1px, -1px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .team-chip,
  .team-chip__icon,
  .team-hero__menu-btn {
    transition: none;
  }

  a.team-chip:hover .team-chip__icon {
    transform: none;
  }
}
</style>
