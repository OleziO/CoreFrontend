<template>
  <RouterLink
    :to="{ name: routeNames.team, params: { id: teamId } }"
    class="team-tile group"
    :class="{ 'team-tile--verified': team?.isVerified }"
    :aria-label="`Перейти до команди ${teamName}`"
  >
    <!-- Логотип у HUD-колодці; печатка верифікації сидить на куті, як на TeamCard -->
    <div class="team-tile__logo">
      <img
        v-if="logoSrc && !logoFailed"
        :src="logoSrc"
        alt=""
        class="pointer-events-none h-full w-full select-none object-cover"
        @error="logoFailed = true"
      >
      <div v-else class="flex h-full w-full items-center justify-center text-primary/35">
        <PhUsersThree :size="28" weight="duotone" />
      </div>
      <el-tooltip
        v-if="team"
        :content="team.isVerified ? 'Верифікована команда' : 'Не верифікована команда'"
        placement="top"
        effect="dark"
        :show-after="140"
      >
        <StatusBadge
          :preset="team.isVerified ? 'verified' : 'unverified'"
          size="xs"
          icon-only
          class="team-tile__seal"
        />
      </el-tooltip>
    </div>

    <div class="flex min-w-0 flex-1 flex-col gap-6">
      <!-- Роль гравця в складі: капітан / тренер / основа / запас -->
      <span v-if="memberRole" class="team-tile__role" :class="memberRole.tone">
        <component :is="memberRole.icon" :size="11" weight="fill" />
        {{ memberRole.label }}
      </span>

      <h3 class="team-tile__name">
        {{ teamName }}
      </h3>

      <!-- Мета: склад + Dota ID (копіюється) -->
      <div v-if="team" class="team-tile__meta">
        <span class="team-tile__chip" :title="rosterTitle">
          <PhUsersThree :size="12" weight="bold" class="text-primary/70" />
          <span class="tabular-nums">{{ mainCount }}</span>
          <span v-if="reserveCount" class="text-white/40">+{{ reserveCount }}</span>
        </span>

        <el-tooltip
          v-if="dotaTeamId"
          content="Скопіювати Dota ID"
          placement="top"
          effect="dark"
          :show-after="140"
        >
          <button
            type="button"
            class="team-tile__chip team-tile__chip--action"
            aria-label="Скопіювати Dota ID команди"
            @click.stop.prevent="getCopy(dotaTeamId, 'Dota ID команди')"
          >
            <PhIdentificationBadge :size="12" weight="bold" class="text-primary/70" />
            <span class="truncate">{{ dotaTeamId }}</span>
            <PhCopy :size="11" class="shrink-0 opacity-60" />
          </button>
        </el-tooltip>
      </div>
    </div>

    <!-- Шеврон: плитка веде на сторінку команди; на hover зсувається вправо -->
    <PhCaretRight :size="16" weight="bold" class="team-tile__caret" />
  </RouterLink>
</template>

<script setup lang="ts">
import {
  PhCaretRight,
  PhCopy,
  PhCrownSimple,
  PhIdentificationBadge,
  PhShieldCheck,
  PhStrategy,
  PhUsersThree,
  PhUserSwitch
} from '@phosphor-icons/vue'
import { getCopy, resolvePublicOrApiUrl } from '@/core/helpers'
import { routeNames } from '@/router/route-names'

interface IProps {
  /** Ідентифікатор команди для посилання; плитка показується, лише коли він є */
  teamId: string
  /** Повна команда з API; `null` поки вантажиться або якщо запит впав */
  team: TTeam | null
  /** Гравець, чий профіль відкрито — щоб підписати його роль у складі */
  playerId?: string | null
}

interface IMemberRole {
  label: string
  icon: Component
  tone: string
}

const props = defineProps<IProps>()

const logoFailed = ref(false)
watch(() => props.team?.logoUrl, () => { logoFailed.value = false })

const teamName = computed(() => props.team?.name ?? 'Команда')
const logoSrc = computed(() => resolvePublicOrApiUrl(props.team?.logoUrl))

const dotaTeamId = computed(() => {
  const raw = props.team?.dotaTeamId
  if (raw == null || String(raw).trim() === '') return null
  return String(raw).trim()
})

const mainCount = computed(() => props.team?.mainPlayers?.length ?? 0)
const reserveCount = computed(() => props.team?.reservedPlayers?.length ?? 0)
const rosterTitle = computed(() =>
  reserveCount.value
    ? `Основа: ${mainCount.value} · Запас: ${reserveCount.value}`
    : `Основа: ${mainCount.value}`
)

const memberRole = computed<IMemberRole | null>(() => {
  const team = props.team
  const id = props.playerId
  if (!team || !id) return null
  if (team.captain?.id === id) {
    return { label: 'Капітан', icon: PhCrownSimple, tone: 'team-tile__role--gold' }
  }
  if (team.coach?.id === id) {
    return { label: 'Тренер', icon: PhStrategy, tone: 'team-tile__role--info' }
  }
  if (team.mainPlayers?.some((p) => p.id === id)) {
    return { label: 'Основа', icon: PhShieldCheck, tone: 'team-tile__role--primary' }
  }
  if (team.reservedPlayers?.some((p) => p.id === id)) {
    return { label: 'Запас', icon: PhUserSwitch, tone: 'team-tile__role--muted' }
  }
  return null
})
</script>

<style scoped lang="scss">
// Плитка команди в профілі: тьмяна HUD-колодка, яка «вмикається» на hover —
// рамка й логотип світяться, шеврон зсувається. Кольори успадковують --tile-tone.
.team-tile {
  --tile-tone: var(--ds-primary-rgb);

  @apply relative flex w-full min-w-0 items-center gap-14 rounded-xl border px-12 py-12 text-left no-underline;
  border-color: rgba(var(--tile-tone), 0.16);
  background:
    linear-gradient(135deg, rgba(var(--tile-tone), 0.06), transparent 55%),
    rgba(0, 0, 0, 0.3);
  box-shadow: inset 0 1px 0 rgba(var(--tile-tone), 0.12);
  transition:
    border-color var(--ds-duration-base) ease,
    box-shadow var(--ds-duration-base) ease,
    transform var(--ds-duration-base) var(--ds-ease-out);

  &:focus-visible {
    outline: 2px solid rgba(var(--tile-tone), 0.6);
    outline-offset: 2px;
  }

  &:active {
    transform: scale(0.99);
  }
}

@media (hover: hover) and (pointer: fine) {
  .team-tile:hover {
    border-color: rgba(var(--tile-tone), 0.5);
    box-shadow: inset 0 1px 0 rgba(var(--tile-tone), 0.2), 0 0 18px rgba(var(--tile-tone), 0.18);

    .team-tile__logo {
      box-shadow: 0 0 0 1px rgba(var(--tile-tone), 0.6), var(--ds-glow-primary-soft);
    }

    .team-tile__name {
      color: var(--ds-primary);
      text-shadow: var(--ds-neon-text-subtle);
    }

    .team-tile__caret {
      color: var(--ds-primary);
      transform: translateX(3px);
    }
  }
}

.team-tile__logo {
  @apply relative size-64 shrink-0 overflow-hidden rounded-xl;
  background: rgba(0, 0, 0, 0.45);
  box-shadow: 0 0 0 1px rgba(var(--tile-tone), 0.35);
  transition: box-shadow var(--ds-duration-base) ease;
}

// Печатка виходить за край логотипа, щоб читатись на будь-якому зображенні.
.team-tile__seal {
  @apply absolute bottom-2 right-2 z-[1];
  box-shadow: 0 0 0 2px rgba(7, 8, 15, 0.9);
}

.team-tile__role {
  @apply inline-flex w-fit items-center gap-4;
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--ds-text-faint);

  &--gold {
    color: var(--ds-gold);
  }

  &--primary {
    color: var(--ds-primary);
  }

  &--info {
    color: #7dd3fc;
  }

  &--muted {
    color: var(--ds-text-muted);
  }
}

.team-tile__name {
  @apply m-0 truncate font-display text-base uppercase leading-tight tracking-wide text-white;
  transition: color var(--ds-duration-fast) ease, text-shadow var(--ds-duration-base) ease;
}

.team-tile__meta {
  @apply flex min-w-0 flex-wrap items-center gap-6;
}

.team-tile__chip {
  @apply inline-flex h-24 max-w-full min-w-0 items-center gap-6 rounded-md border px-8;
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.02em;
  color: rgba(255, 255, 255, 0.75);
  border-color: rgba(var(--ds-primary-rgb), 0.16);
  background: rgba(0, 0, 0, 0.3);
  font-variant-numeric: tabular-nums;

  &--action {
    cursor: pointer;
    transition:
      color var(--ds-duration-fast) ease,
      border-color var(--ds-duration-base) ease,
      background-color var(--ds-duration-base) ease,
      transform var(--ds-duration-press) var(--ds-ease-out);

    &:active {
      transform: scale(0.96);
    }

    &:focus-visible {
      outline: 2px solid rgba(var(--ds-primary-rgb), 0.55);
      outline-offset: 1px;
    }
  }
}

@media (hover: hover) and (pointer: fine) {
  .team-tile__chip--action:hover {
    color: var(--ds-primary);
    border-color: rgba(var(--ds-primary-rgb), 0.5);
    background: rgba(var(--ds-primary-rgb), 0.08);
  }
}

.team-tile__caret {
  @apply shrink-0 self-center text-white/30;
  transition: color var(--ds-duration-fast) ease, transform var(--ds-duration-base) var(--ds-ease-out);
}
</style>
