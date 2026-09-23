<template>
  <div
    class="team-card neon-card group/card flex w-full cursor-pointer flex-col overflow-hidden rounded-2xl"
    @click="goToTeamPage(team.id)"
  >
    <!-- Логотип: HUD-кутники обіймають рамку зовні й повторюють її заокруглення -->
    <div class="shrink-0 px-12 pt-12">
      <div
        class="team-card__logo-wrap hud-corners hud-corners--fade relative"
        :class="team.isVerified ? 'team-card__logo-wrap--verified' : 'team-card__logo-wrap--unverified'"
      >
        <!-- Друга пара кутників (верх-право / низ-ліво) -->
        <span
          class="hud-corners hud-corners--mirror hud-corners--fade absolute inset-0 z-[2]"
          aria-hidden="true"
        />
        <div class="team-card__logo relative aspect-[8/7] w-full overflow-hidden rounded-xl">
          <img
            v-if="teamLogoSrc && !logoLoadFailed"
            :src="teamLogoSrc"
            alt=""
            class="team-card__logo-img pointer-events-none h-full w-full select-none object-cover object-center"
            @error="logoLoadFailed = true"
          >
          <div
            v-else
            class="flex h-full w-full items-center justify-center bg-gradient-to-b from-primary/[0.06] to-black/30"
          >
            <PhUsersThree :size="64" weight="duotone" class="text-primary/30" />
          </div>

          <!-- Нижній скрім, щоб бейдж і край логотипа читались на будь-якому зображенні -->
          <span class="team-card__scrim" aria-hidden="true" />

          <el-tooltip
            :content="team.isVerified ? 'Верифікована команда' : 'Не верифікована команда'"
            placement="bottom"
            effect="dark"
            :show-after="140"
          >
            <StatusBadge
              :preset="team.isVerified ? 'verified' : 'unverified'"
              size="md"
              icon-only
              class="absolute bottom-8 right-8 z-[1]"
              @click.stop
            />
          </el-tooltip>
        </div>
      </div>
    </div>

    <!-- Назва -->
    <div class="shrink-0 px-12 pt-10">
      <el-tooltip placement="top" :content="team.name" effect="dark">
        <h2
          class="team-card__name line-clamp-2 w-full max-w-full px-2 text-center font-display text-[14px] uppercase
                 leading-snug tracking-wide text-white"
        >
          {{ team.name }}
        </h2>
      </el-tooltip>
    </div>

    <!-- Дані команди: панель на всю ширину, рядок = мітка · значення · дія -->
    <div class="mt-10 shrink-0 px-12">
      <dl class="team-card__data">
        <div v-if="mainAvgRating != null" class="team-card__data-row">
          <dt class="team-card__data-label">
            <PhChartBar :size="12" weight="bold" class="text-primary/60" />
            <span>Рейтинг</span>
          </dt>
          <el-tooltip
            placement="top"
            effect="dark"
            content="Середній рейтинг гравців основи"
          >
            <dd class="team-card__data-value text-primary neon-text-subtle">
              {{ mainAvgRating }}
            </dd>
          </el-tooltip>
          <el-tooltip v-if="dotaTeamIdDisplay" content="Dotabuff" placement="top" effect="dark">
            <a
              class="team-card__chip"
              target="_blank"
              rel="noopener noreferrer"
              :href="getDotabuffTeamUrl(team.dotaTeamId)"
              aria-label="Відкрити на Dotabuff"
              @click.stop
            >
              <Icon :size="14" name="dotabuff" />
            </a>
          </el-tooltip>
        </div>

        <div class="team-card__data-row">
          <dt class="team-card__data-label">
            <PhIdentificationBadge :size="12" weight="bold" class="text-primary/60" />
            <span>Dota ID</span>
          </dt>
          <dd class="team-card__data-value text-white/85">
            {{ dotaTeamIdDisplay || '—' }}
          </dd>
          <el-tooltip v-if="dotaTeamIdDisplay" content="Скопіювати Dota ID" placement="top" effect="dark">
            <button
              type="button"
              class="team-card__chip"
              aria-label="Скопіювати Dota ID"
              @click.stop="copyDotaTeamId()"
            >
              <PhCopy :size="14" />
            </button>
          </el-tooltip>
        </div>
      </dl>
    </div>

    <!-- Неонова волосяна лінія замість пунктиру -->
    <span class="hud-line mx-12 mt-10 shrink-0" aria-hidden="true" />

    <!-- Учасники: єдина суцільна кнопка картки — іконка + підпис ліворуч, лічильник і шеврон праворуч -->
    <div class="shrink-0 px-12 pb-12 pt-10">
      <el-button
        type="primary"
        class="team-card__cta w-full"
        @click.stop="openTeamDrawer(team)"
      >
        <span class="inline-flex items-center gap-8">
          <PhUsersThree :size="16" weight="bold" />
          <span>Учасники</span>
        </span>
        <span class="inline-flex items-center gap-6">
          <span
            v-if="computedPlayersCount"
            class="team-card__count"
            :aria-label="`${computedPlayersCount} гравців`"
          >
            {{ String(computedPlayersCount).padStart(2, '0') }}
          </span>
          <PhCaretRight :size="14" weight="bold" class="team-card__cta-caret" />
        </span>
      </el-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { routeNames } from '@/router/route-names'
import { PhCaretRight, PhChartBar, PhCopy, PhIdentificationBadge, PhUsersThree } from '@phosphor-icons/vue'
import { getCopy, getDotabuffTeamUrl, resolvePublicOrApiUrl } from '@/core/helpers'
import { computeTeamAvgRatingRounded } from '@/components/tournaments-tags/tournament.constants'

const props = defineProps<{
  team: TTeam | TTournamentTeam
  width?: number
}>()

const mainAvgRating = computed(() =>
  ('avgRating' in props.team ? props.team.avgRating : null) ??
  computeTeamAvgRatingRounded(props.team.mainPlayers)
)

const router = useRouter()

const { open } = useAppModals()

const teamLogoSrc = computed(() => resolvePublicOrApiUrl(props.team.logoUrl))

const logoLoadFailed = ref(false)
watch(teamLogoSrc, () => {
  logoLoadFailed.value = false
})

const dotaTeamIdDisplay = computed(() => props.team.dotaTeamId?.trim() ?? '')

const computedPlayersCount = computed(
  () => (props.team.mainPlayers?.length ?? 0) + (props.team.reservedPlayers?.length ?? 0)
)

function copyDotaTeamId () {
  getCopy(dotaTeamIdDisplay.value, 'Dota ID')
}

function openTeamDrawer (team: TTeam | TTournamentTeam) {
  open('TeamsPlayersDrawer', { team: team as TTeam })
}

function goToTeamPage (id: string) {
  router.push({ name: routeNames.team, params: { id } })
}

</script>

<style scoped lang="scss">
// Team card internals share one vocabulary with the profile tiles: dark wells
// (`rgba(0,0,0,.3)`), a cyan hairline at 16 % that lifts to 50 % on hover, and
// glow only on real pointers. The shell (`.neon-card` + `.hud-corners`) owns
// the frame, so the logo is a plain well with a bottom scrim under the badge.
// Brackets sit flush on the logo frame's own edge (no gap) and share its
// 10px radius, so they read as a highlighted piece of the frame itself. Their
// colour encodes verification (mirrors the StatusBadge): green neon when the
// team is verified, red neon when it is not.
.team-card__logo-wrap {
  --hud-corner-inset: 0px;
  --hud-corner-size: 34px; // long arms — the fade thins them toward the tips
  --hud-corner-radius: 10px;
  --hud-corner-weight: 3px;
  --status-rgb: 34, 197, 94;
  --status-core: #4ade80; // success-400: a hotter tube than the base status colour
  // Crisp solid core; the halo lives only in wide, translucent layers (6px+)
  // so the 3px edge itself never softens while the glow reaches far out.
  --hud-corner-color: var(--status-core);
  --hud-corner-glow:
    drop-shadow(0 0 6px rgba(var(--status-rgb), 0.9))
    drop-shadow(0 0 16px rgba(var(--status-rgb), 0.65))
    drop-shadow(0 0 32px rgba(var(--status-rgb), 0.4));

  &--unverified {
    --status-rgb: 239, 68, 68;
    --status-core: #f87171; // red-400
  }

  // The frame's own hairline takes a faint status tint so the brackets read
  // as lit segments of the frame, not stickers on top of it.
  .team-card__logo {
    border-color: rgba(var(--status-rgb), 0.28);
    box-shadow: inset 0 1px 0 rgba(var(--status-rgb), 0.14);
  }
}

.team-card__logo {
  border: 1px solid rgba(var(--ds-primary-rgb), 0.16);
  background: rgba(0, 0, 0, 0.4);
  box-shadow: inset 0 1px 0 rgba(var(--ds-primary-rgb), 0.12);
  transition: border-color var(--ds-duration-base) ease;
}

.team-card__logo-img {
  transition: transform 0.5s var(--ds-ease-out);
}

.team-card__scrim {
  position: absolute;
  inset: auto 0 0 0;
  height: 44%;
  pointer-events: none;
  background: linear-gradient(180deg, transparent 0%, rgba(7, 8, 15, 0.7) 100%);
}

.team-card__name {
  transition: color var(--ds-duration-base) ease, text-shadow var(--ds-duration-base) ease;
}

// Full-width data panel. Every row is label · value · action so the eye
// scans one column of labels, one of tabular values and one of 28px chips;
// rows that lack an action keep the column with an empty slot.
.team-card__data {
  @apply m-0 flex w-full flex-col overflow-hidden rounded-lg;
  border: 1px solid rgba(var(--ds-primary-rgb), 0.16);
  background: rgba(0, 0, 0, 0.3);
  box-shadow: inset 0 1px 0 rgba(var(--ds-primary-rgb), 0.12);
}

.team-card__data-row {
  @apply grid min-h-[38px] items-center gap-8 px-10;
  grid-template-columns: auto minmax(0, 1fr) 28px;

  & + & {
    border-top: 1px solid rgba(var(--ds-primary-rgb), 0.1);
  }
}

.team-card__data-label {
  @apply m-0 inline-flex items-center gap-6;
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.team-card__data-value {
  @apply m-0 min-w-0 truncate text-right;
  font-family: var(--ds-font-mono);
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

// 28px HUD chip (copy / Dotabuff) — same recipe as the profile links.
.team-card__chip {
  @apply inline-flex size-28 items-center justify-center rounded-md border no-underline;
  color: rgba(255, 255, 255, 0.75);
  border-color: rgba(var(--ds-primary-rgb), 0.16);
  background: rgba(0, 0, 0, 0.3);
  transition:
    color var(--ds-duration-fast) ease,
    border-color var(--ds-duration-base) ease,
    box-shadow var(--ds-duration-base) ease,
    transform var(--ds-duration-press) var(--ds-ease-out);

  &:active {
    transform: scale(0.94);
  }

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.55);
    outline-offset: 2px;
  }
}

// Members CTA: the card's single solid action (filled cyan, dark text) so it
// is unmistakably a button. Label group left, counter + chevron right; the
// chevron nudges on hover to say "opens the roster".
.team-card__cta {
  font-family: var(--ds-font-display);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  box-shadow: var(--ds-glow-primary-soft);

  :deep(> span) {
    @apply flex w-full items-center justify-between;
  }
}

// Feedback only: the caret leans 4px toward the action while the card (the
// whole pointer target) is hovered or the button has keyboard focus. Press
// scale and the neon halo come from the global button system.
.team-card__cta-caret {
  transition: transform var(--ds-duration-base) var(--ds-ease-out);
}

.team-card__cta:focus-visible .team-card__cta-caret {
  transform: translateX(4px);
}

@media (prefers-reduced-motion: reduce) {
  .team-card__cta-caret,
  .team-card__cta:focus-visible .team-card__cta-caret {
    transform: none;
  }
}

// Roster size as a dark mono chip on the cyan fill.
.team-card__count {
  @apply inline-flex min-w-[26px] items-center justify-center rounded px-6 py-3;
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.06em;
  color: var(--ds-primary);
  background: rgba(7, 8, 15, 0.85);
}

@media (hover: hover) and (pointer: fine) {
  .team-card:hover {
    .team-card__logo {
      border-color: rgba(var(--status-rgb), 0.5);
    }

    .team-card__logo-img {
      transform: scale(1.04);
    }

    .team-card__name {
      color: var(--ds-primary);
      text-shadow: var(--ds-neon-text-subtle);
    }
  }

  .team-card__chip:hover {
    color: var(--ds-primary);
    border-color: rgba(var(--ds-primary-rgb), 0.5);
    box-shadow: var(--ds-glow-primary-soft);
    transform: translateY(-1px);
  }

  .team-card:hover .team-card__cta-caret {
    transform: translateX(4px);
  }
}
</style>
