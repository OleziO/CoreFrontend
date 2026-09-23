<template>
  <!-- Сітка плей-оф: HUD-панель у тому ж рецепті, що й шапка кваліфікації -->
  <section
    class="bracket hud-panel hud-corners hud-corners--fade rounded-2xl overflow-hidden"
    aria-label="Сітка плей-оф"
  >
    <span class="hud-corners hud-corners--mirror hud-corners--fade absolute inset-0" aria-hidden="true" />
    <span class="bracket__glow" aria-hidden="true" />

    <header class="bracket__head">
      <div class="bracket__reveal flex min-w-0 flex-col gap-10" style="--reveal-index: 0">
        <p class="bracket__eyebrow sys-label">
          <span class="bracket__tick" aria-hidden="true" />
          <span>Етап</span>
          <span class="bracket__sep" aria-hidden="true">/</span>
          <span>Плей-оф</span>
        </p>

        <div class="flex flex-wrap items-center gap-x-12 gap-y-8">
          <h2 class="bracket__title">Сітка плей-оф</h2>
          <StatusBadge :preset="phaseStatus.preset" :label="phaseStatus.label" size="sm" />
          <span v-if="playoffTeamsCount" class="bracket__meta">
            <PhUsersThree :size="12" weight="bold" aria-hidden="true" />
            {{ playoffTeamsCount }} команд
          </span>
        </div>

        <p class="bracket__hint">{{ hint }}</p>
      </div>

      <div
        v-if="hasActions"
        class="bracket__reveal bracket__actions"
        style="--reveal-index: 1"
      >
        <el-button
          v-if="isLocalhost"
          type="warning"
          @click="emit('openTestMatchModal', 'playoff')"
        >
          Test match creation
        </el-button>
        <el-button
          v-if="canManagePlayers && isPlayoffPhase"
          type="success"
          plain
          @click="emit('openTechLossPlayoff')"
        >
          Ввести результат вручну
        </el-button>
        <el-button
          v-if="canSubmitPlayoffMatch"
          type="primary"
          @click="emit('openPlayoffSubmit')"
        >
          <PhPlus :size="18" weight="bold" class="shrink-0" />
          <span class="whitespace-nowrap">Подати результат матчу</span>
        </el-button>
      </div>
    </header>

    <hr class="hud-line hud-line--pink m-0" aria-hidden="true">

    <div class="bracket__stage bracket__reveal" style="--reveal-index: 2">
      <!-- Завантаження -->
      <div
        v-if="playoffLoading"
        class="bracket__state"
        aria-busy="true"
        aria-live="polite"
      >
        <TournamentBracketSkeleton class="bracket__state-art is-loading" />
        <p class="bracket__state-title">Завантаження сітки…</p>
      </div>

      <!-- Вбудована сітка Challonge -->
      <div v-else-if="playoffEmbedUrl" class="bracket__frame">
        <div class="bracket__toolbar">
          <span class="bracket__toolbar-label">
            <PhBracketsCurly :size="12" weight="bold" aria-hidden="true" />
            Challonge · трансляція сітки
          </span>
          <span class="bracket__toolbar-scroll" aria-hidden="true">
            <PhArrowsHorizontal :size="12" weight="bold" />
            гортайте вбік
          </span>
          <a
            v-if="challongeUrl"
            :href="challongeUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="bracket__toolbar-link"
          >
            <span>Відкрити на Challonge</span>
            <PhArrowSquareOut :size="12" weight="bold" aria-hidden="true" />
          </a>
        </div>

        <div class="bracket__viewport">
          <!-- Скелет тримає місце, доки iframe не віддасть `load` -->
          <div v-if="!iframeLoaded" class="bracket__frame-skeleton" aria-hidden="true">
            <TournamentBracketSkeleton class="bracket__state-art is-loading" />
          </div>
          <iframe
            :key="playoffEmbedUrl"
            :src="getBracketUrl(playoffEmbedUrl)"
            title="Сітка плей-оф на Challonge"
            width="100%"
            height="520"
            class="bracket__iframe"
            :class="{ 'is-loaded': iframeLoaded }"
            frameborder="0"
            scrolling="auto"
            allowtransparency="true"
            @load="iframeLoaded = true"
          />
        </div>
      </div>

      <!-- Плей-оф ще не почався -->
      <div v-else-if="!isPlayoffPhase" class="bracket__state">
        <TournamentBracketSkeleton class="bracket__state-art" />
        <p class="bracket__state-title">Сітка з'явиться після кваліфікації</p>
        <p class="bracket__state-text">
          Команди, що пройдуть відбір, будуть розсіяні в сітку плей-оф. Слідкуйте за
          матрицею матчів у вкладці «Кваліфікація».
        </p>
      </div>

      <!-- Плей-оф триває, але сітку ще не сформовано -->
      <div v-else class="bracket__state">
        <TournamentBracketSkeleton class="bracket__state-art" />
        <p class="bracket__state-title">Сітку плей-оф ще не сформовано</p>
        <p class="bracket__state-text">
          Адміністрація завершує розсіювання. Сітка з'явиться тут автоматично.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  PhArrowSquareOut,
  PhArrowsHorizontal,
  PhBracketsCurly,
  PhPlus,
  PhUsersThree
} from '@phosphor-icons/vue'
import TournamentBracketSkeleton from './TournamentBracketSkeleton.vue'

interface IProps {
  playoffLoading: boolean
  playoffEmbedUrl: string
  isPlayoffPhase: boolean
  canSubmitPlayoffMatch: boolean
  canManagePlayers: boolean
  isLocalhost: boolean
  /** Кількість команд у сітці — з `PlayoffResponseDto.teams`. */
  playoffTeamsCount?: number | null
  /** Турнір завершено — сітка лишається як архів, статус не «Live». */
  isCompleted?: boolean
}

const props = withDefaults(defineProps<IProps>(), {
  playoffTeamsCount: null,
  isCompleted: false
})

const emit = defineEmits<{
  openPlayoffSubmit: []
  openTechLossPlayoff: []
  openTestMatchModal: [phase: 'qualification' | 'playoff']
}>()

const hasActions = computed(() =>
  props.canSubmitPlayoffMatch || props.isLocalhost || (props.canManagePlayers && props.isPlayoffPhase)
)

const phaseStatus = computed<{ preset: 'live' | 'upcoming' | 'completed'; label: string }>(() => {
  if (props.isCompleted) return { preset: 'completed', label: 'Завершено' }
  if (props.isPlayoffPhase) return { preset: 'live', label: 'Live' }
  return { preset: 'upcoming', label: 'Незабаром' }
})

const hint = computed(() => {
  if (props.isCompleted) return 'Підсумкова сітка турніру. Результати зафіксовано.'
  if (!props.isPlayoffPhase) return 'Сітка стане доступною, коли турнір перейде у стадію плей-оф.'
  if (props.canSubmitPlayoffMatch) {
    return 'Результат гри подається за ID матчу Dota 2 — сітка оновлюється автоматично.'
  }
  return 'Сітка оновлюється автоматично після кожного поданого матчу.'
})

// Публічна сторінка сітки — той самий URL без `/module` (модуль — лише для вбудовування).
const challongeUrl = computed(() => {
  const url = props.playoffEmbedUrl
  if (!url || !url.includes('challonge.com')) return url || ''
  return url.replace(/\/module\/?$/, '')
})

// Iframe віддає `load` навіть крос-доменно — до того тримаємо скелет і плавно проявляємо.
const iframeLoaded = ref(false)
watch(() => props.playoffEmbedUrl, () => {
  iframeLoaded.value = false
})

function getBracketUrl (url: string): string {
  if (!url) return ''
  if (url.includes('challonge.com') && !url.includes('/module')) {
    return url.replace(/\/$/, '') + '/module'
  }
  return url
}
</script>

<style scoped lang="scss">
// ─── Панель ─────────────────────────────────────────────────────────────────
.bracket {
  --hud-corner-size: 14px;
  --hud-corner-inset: 10px;
  --hud-corner-radius: 3px;
  --hud-corner-color: rgba(var(--ds-primary-rgb), 0.55);
  --hud-corner-glow: drop-shadow(0 0 6px rgba(var(--ds-primary-rgb), 0.4));
}

.bracket__glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 55% 80% at 0% 0%, rgba(var(--ds-primary-rgb), 0.1), transparent 60%),
    radial-gradient(ellipse 40% 70% at 100% 100%, rgba(var(--ds-pink-rgb), 0.06), transparent 65%);
}

// Поява каскадом: текст → дії → сцена. Глушиться під `prefers-reduced-motion` у `_tokens.scss`.
@keyframes bracket-in {
  from {
    opacity: 0;
    transform: translate3d(0, 8px, 0);
  }
}

.bracket__reveal {
  animation: bracket-in 360ms var(--ds-ease-out) both;
  animation-delay: calc(var(--reveal-index, 0) * 60ms);
}

// ─── Шапка ──────────────────────────────────────────────────────────────────
.bracket__head {
  @apply relative flex flex-col gap-16 px-36 py-30 sm:px-44 sm:py-34 lg:flex-row lg:items-start lg:justify-between
    lg:gap-32;
}

.bracket__eyebrow {
  @apply m-0 inline-flex flex-wrap items-center gap-8;
}

.bracket__tick {
  width: 16px;
  height: 2px;
  border-radius: 9999px;
  background: var(--ds-primary);
  box-shadow: 0 0 8px rgba(var(--ds-primary-rgb), 0.7);
}

.bracket__sep {
  color: rgba(var(--ds-primary-rgb), 0.45);
  text-shadow: none;
}

.bracket__title {
  @apply m-0 font-display uppercase text-white;
  font-size: clamp(1.125rem, 0.95rem + 0.8vw, 1.5rem);
  line-height: 1.1;
  letter-spacing: 0.04em;
  text-shadow: 0 0 20px rgba(var(--ds-primary-rgb), 0.18);
}

.bracket__meta {
  @apply inline-flex items-center gap-6;
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-muted);

  svg {
    color: rgba(var(--ds-primary-rgb), 0.8);
  }
}

.bracket__hint {
  @apply m-0 max-w-xl;
  font-size: 13px;
  line-height: 1.5;
  color: var(--ds-text-muted);
}

.bracket__actions {
  @apply flex w-full shrink-0 flex-wrap gap-10 sm:w-auto lg:pt-4;

  :deep(.el-button > span) {
    @apply inline-flex items-center gap-8;
  }
}

// ─── Сцена ──────────────────────────────────────────────────────────────────
.bracket__stage {
  @apply relative px-16 py-16 sm:px-24 sm:py-20;
  background: rgba(0, 0, 0, 0.22);
}

// Рамка навколо вбудованої сітки: тулбар + вьюпорт із горизонтальним скролом.
.bracket__frame {
  @apply overflow-hidden rounded-xl border;
  border-color: rgba(var(--ds-primary-rgb), 0.18);
  background: rgba(7, 8, 15, 0.55);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.bracket__toolbar {
  @apply flex flex-wrap items-center gap-x-14 gap-y-6 px-14 py-10;
  border-bottom: 1px solid rgba(var(--ds-primary-rgb), 0.12);
  background: rgba(255, 255, 255, 0.02);
}

.bracket__toolbar-label,
.bracket__toolbar-scroll {
  @apply inline-flex items-center gap-6;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ds-text-faint);

  svg {
    color: rgba(var(--ds-primary-rgb), 0.75);
  }
}

// Підказка про горизонтальний скрол потрібна лише там, де сітка ширша за екран.
.bracket__toolbar-scroll {
  @apply md:hidden;
}

.bracket__toolbar-link {
  @apply ml-auto inline-flex items-center gap-6 rounded-md px-8 py-4 no-underline;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ds-primary);
  background: rgba(var(--ds-primary-rgb), 0.06);
  box-shadow: inset 0 0 0 1px rgba(var(--ds-primary-rgb), 0.25);
  transition:
    background-color var(--ds-duration-fast) ease,
    box-shadow var(--ds-duration-fast) ease,
    transform var(--ds-duration-press) var(--ds-ease-out);

  &:active {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.6);
    outline-offset: 2px;
  }
}

.bracket__viewport {
  @apply relative w-full overflow-x-auto;
  min-height: 520px;
}

.bracket__frame-skeleton {
  @apply absolute inset-0 flex items-center justify-center;
  background: rgba(7, 8, 15, 0.55);
}

.bracket__iframe {
  @apply block min-w-[640px] border-0;
  height: 520px;
  opacity: 0;
  transition: opacity 240ms var(--ds-ease-out);

  &.is-loaded {
    opacity: 1;
  }

  @screen sm {
    height: 600px;
  }

  @screen lg {
    height: 660px;
  }
}

@screen sm {
  .bracket__viewport {
    min-height: 600px;
  }
}

@screen lg {
  .bracket__viewport {
    min-height: 660px;
  }
}

// ─── Стани: завантаження / порожньо ─────────────────────────────────────────
.bracket__state {
  @apply flex flex-col items-center justify-center gap-10 rounded-xl border border-dashed px-20 py-40 text-center;
  border-color: rgba(var(--ds-primary-rgb), 0.16);
  background:
    repeating-linear-gradient(-45deg, rgba(var(--ds-primary-rgb), 0.03) 0 1px, transparent 1px 12px),
    rgba(7, 8, 15, 0.35);
}

.bracket__state-art {
  width: min(100%, 360px);
  height: auto;
  margin-bottom: 6px;
}

.bracket__state-title {
  @apply m-0 font-display uppercase text-white;
  font-size: 0.95rem;
  letter-spacing: 0.06em;
  line-height: 1.2;
}

.bracket__state-text {
  @apply m-0 max-w-md;
  font-size: 13px;
  line-height: 1.5;
  color: var(--ds-text-muted);
}

@media (hover: hover) and (pointer: fine) {
  .bracket__toolbar-link:hover {
    background: rgba(var(--ds-primary-rgb), 0.14);
    box-shadow: inset 0 0 0 1px rgba(var(--ds-primary-rgb), 0.55), var(--ds-glow-primary-soft);
  }
}

@media (prefers-reduced-motion: reduce) {
  .bracket__toolbar-link,
  .bracket__iframe {
    transition: none;
  }

  .bracket__toolbar-link:active {
    transform: none;
  }
}
</style>
