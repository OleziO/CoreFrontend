<template>
  <section
    ref="heroRef"
    class="hero hud-corners hud-corners--fade relative flex min-h-[calc(100svh-144px)] flex-col overflow-hidden
           lg:h-[calc(100svh-133px)] lg:min-h-[580px]"
    @pointermove="onPointerMove"
    @pointerleave="onPointerLeave"
  >
    <span class="hud-corners hud-corners--mirror hud-corners--fade absolute inset-0 z-[3]" aria-hidden="true" />

    <!-- ── Atmosphere: parallax wrappers carry the pointer offset, inner layers breathe ── -->
    <div ref="glowCyanRef" class="hero-layer" aria-hidden="true">
      <div class="atm-glow atm-glow--cyan" />
    </div>
    <div ref="glowPurpleRef" class="hero-layer" aria-hidden="true">
      <div class="atm-glow atm-glow--purple" />
    </div>
    <div ref="gridRef" class="hero-layer" aria-hidden="true">
      <div class="atm-grid" />
    </div>

    <!-- Perspective floor: constant linear motion, one cell per loop so it never seams -->
    <div class="hero-floor" aria-hidden="true">
      <div class="hero-floor__grid" />
    </div>

    <div class="scanlines" aria-hidden="true" />
    <div class="hero-grain" aria-hidden="true" />
    <div class="atm-vignette" aria-hidden="true" />

    <!-- ── HUD frame labels: flush with the header's content edge (px-20 / lg:px-40) ── -->
    <span
      class="sys-label sys-label--muted hero-boot hero-label hero-label--left hidden !text-[9px] md:inline"
      aria-hidden="true"
    >
      SYS://CORE LEAGUE › INIT
    </span>
    <span
      class="sys-label sys-label--muted hero-fade hero-label hero-label--right hidden !text-[9px] md:inline"
      style="--i: 6"
      aria-hidden="true"
    >
      [ UA · DOTA 2 ]
    </span>

    <!-- ── Stage: copy left, arena right ── -->
    <div
      class="relative z-10 mx-auto grid w-full max-w-7xl flex-1 items-center gap-40 px-20 pb-72 pt-56
             lg:grid-cols-[1.05fr_0.95fr] lg:gap-24 lg:px-40 lg:pb-80 lg:pt-48"
    >
      <!-- Copy -->
      <div
        ref="contentRef"
        class="hero-content flex flex-col items-center text-center lg:items-start lg:text-left"
      >
        <h1
          class="hero-title font-display text-5xl uppercase leading-[0.92] tracking-wide text-white
                 sm:text-6xl lg:text-7xl xl:text-8xl"
        >
          <span class="hero-line" style="--i: 0"><span class="hero-line__text">Грай.</span></span>
          <span class="hero-line" style="--i: 1">
            <span class="hero-line__text neon-gradient-text hero-shimmer">Змагайся.</span>
          </span>
          <span class="hero-line" style="--i: 2"><span class="hero-line__text neon-text">Вигравай.</span></span>
        </h1>

        <span class="hero-fade hero-kicker hud-corners mt-24" style="--i: 3">
          <span class="hero-kicker__tag">
            <span class="hero-kicker__dot" aria-hidden="true" />
            Dota 2
          </span>
          <span class="hero-kicker__text">Українська кіберспортивна ліга</span>
        </span>

        <p class="hero-fade mt-20 max-w-[520px] text-base leading-relaxed text-gray-400 md:text-lg" style="--i: 4">
          Організовані турніри 5×5, live трансляції та справжня кіберспортивна
          інфраструктура для українських команд.
        </p>

        <div class="hero-fade mt-28 flex flex-col items-center gap-14 sm:flex-row" style="--i: 5">
          <a
            href="https://t.me/core_league_dota2"
            target="_blank"
            rel="noopener noreferrer"
            class="hero-cta hero-cta--neon"
          >
            <span class="hero-cta__clip" aria-hidden="true"><span class="hero-cta__sheen" /></span>
            <PhPaperPlaneTilt :size="20" weight="fill" class="hero-cta__plane" aria-hidden="true" />
            <span class="hero-cta__label">Слідкуй за новинами</span>
          </a>

          <RouterLink to="/tournaments" class="hero-cta hero-cta--ghost">
            <PhTrophy :size="20" weight="fill" class="hero-cta__icon" />
            <span>Переглянути турніри</span>
            <PhArrowRight :size="16" weight="bold" class="hero-cta__arrow" />
          </RouterLink>
        </div>
      </div>

      <!-- Arena -->
      <div ref="arenaRef" class="hero-arena-wrap flex justify-center lg:justify-end">
        <div class="hero-arena">
          <span class="hero-arena__ring hero-arena__ring--dashed" aria-hidden="true" />
          <span class="hero-arena__ring hero-arena__ring--sweep" aria-hidden="true" />
          <span class="hero-arena__base" aria-hidden="true" />

          <!-- Hero roster: only previous / current / next are mounted (renders are
               ~1.5 MB each), so the next one is always preloaded before its blur-masked crossfade -->
          <div class="hero-arena__figure">
            <template v-for="(hero, index) in HERO_ROSTER" :key="hero.slug">
              <img
                v-if="mountedHeroes.has(index)"
                :src="heroRenderUrl(hero.slug)"
                :alt="index === activeHero ? hero.name : ''"
                class="hero-arena__img"
                :class="{ 'is-active': index === activeHero }"
                :style="{ '--hero-scale': hero.scale }"
                draggable="false"
                decoding="async"
              >
            </template>
          </div>

          <!-- Floating HUD chips -->
          <RouterLink
            :to="featuredLink"
            class="hero-chip hero-chip--featured hero-fade"
            style="--i: 7"
            :class="{ 'is-live': featured.live }"
          >
            <span class="hero-chip__dot" aria-hidden="true" />
            <span class="flex min-w-0 flex-col items-start gap-2">
              <span class="hero-chip__kicker">{{ featured.kicker }}</span>
              <span class="hero-chip__text truncate">{{ featured.text }}</span>
            </span>
            <PhArrowUpRight :size="14" weight="bold" class="hero-chip__arrow" />
          </RouterLink>

          <a
            href="https://www.twitch.tv/core_league"
            target="_blank"
            rel="noopener noreferrer"
            class="hero-chip hero-chip--stream hero-fade"
            style="--i: 8"
          >
            <Icon name="twitch" :size="14" class="text-[#bf94ff]" />
            <span class="flex min-w-0 flex-col items-start gap-2">
              <span class="hero-chip__kicker">Трансляції</span>
              <span class="hero-chip__text">twitch.tv/core_league</span>
            </span>
          </a>

          <!-- Live metrics orbit the figure -->
          <dl
            v-for="(metric, index) in metrics"
            :key="metric.label"
            class="hero-chip hero-chip--metric hero-fade"
            :class="`hero-chip--metric-${index + 1}`"
            :style="{ '--i': 9 + index }"
          >
            <dt class="hero-chip__kicker">{{ metric.label }}</dt>
            <dd class="hero-chip__number">{{ metric.value }}</dd>
          </dl>
        </div>
      </div>
    </div>

    <!-- ── Scroll cue: a real button, right edge, scrolls to the next section ── -->
    <button
      type="button"
      class="hero-scroll absolute right-20 top-1/2 z-10 hidden -translate-y-1/2 lg:right-40 lg:flex"
      aria-label="Прокрутити до наступної секції"
      @click="scrollToNextSection"
    >
      <span class="hero-scroll__label sys-label sys-label--muted !text-[10px]">Scroll</span>
      <span class="hero-scroll__rail" aria-hidden="true"><span class="hero-scroll__dot" /></span>
      <PhCaretDown :size="16" weight="bold" class="hero-scroll__caret" aria-hidden="true" />
    </button>

    <!-- ── Ticker: live tournaments, or the league's own lines while they load ── -->
    <div class="hero-ticker" aria-hidden="true">
      <div class="hero-ticker__track">
        <span
          v-for="(item, index) in tickerLoop"
          :key="`${item.text}-${index}`"
          class="hero-ticker__item"
          :class="{ 'is-live': item.live, 'is-purple': item.tone === 'purple' }"
        >
          <span class="hero-ticker__dot" />
          <span v-if="item.kicker" class="hero-ticker__kicker">{{ item.kicker }}</span>
          <span>{{ item.text }}</span>
        </span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { PhArrowRight, PhArrowUpRight, PhCaretDown, PhPaperPlaneTilt, PhTrophy } from '@phosphor-icons/vue'
import { routeNames } from '@/router/route-names'

interface ITickerItem {
  text: string
  kicker?: string
  live?: boolean
  tone?: 'purple'
}

const props = withDefaults(defineProps<{
  /** Активні турніри (не завершені), найближчий — перший. */
  tournaments?: TTournament[]
  /** Лічильники платформи; 0 — ще не завантажено. */
  playersCount?: number
  teamsCount?: number
  discordMembers?: number
}>(), {
  tournaments: () => [],
  playersCount: 0,
  teamsCount: 0,
  discordMembers: 0
})

// ── Hero roster ───────────────────────────────────────────────────────────
// Official full-body renders from the Dota 2 CDN (1440×1440 transparent PNG,
// the same files dota2.com uses on hero pages). Slugs are Valve's internal
// hero names.
// `scale` evens out the renders: Juggernaut and Crystal Maiden already fill
// their frame, the others sit smaller inside the same 1440px canvas.
const HERO_ROSTER = [
  { slug: 'juggernaut', name: 'Juggernaut', scale: 1.08 },
  { slug: 'invoker', name: 'Invoker', scale: 1.22 },
  { slug: 'phantom_assassin', name: 'Phantom Assassin', scale: 1.22 },
  { slug: 'crystal_maiden', name: 'Crystal Maiden', scale: 1.08 },
  { slug: 'pudge', name: 'Pudge', scale: 1.32 }
] as const

const HERO_SWAP_MS = 5200

function heroRenderUrl (slug: string) {
  return `https://cdn.cloudflare.steamstatic.com/apps/dota2/videos/dota_react/heroes/renders/${slug}.png`
}

const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const activeHero = ref(0)
let swapTimer = 0

// Previous stays for its fade-out, next is fetched ahead of its fade-in.
const mountedHeroes = computed(() => {
  const n = HERO_ROSTER.length
  return new Set([(activeHero.value - 1 + n) % n, activeHero.value, (activeHero.value + 1) % n])
})

onMounted(() => {
  if (reducedMotion) return
  swapTimer = window.setInterval(() => {
    activeHero.value = (activeHero.value + 1) % HERO_ROSTER.length
  }, HERO_SWAP_MS)
})

// ── Metrics ───────────────────────────────────────────────────────────────
// Numbers tween from 0 when they arrive (easeOutExpo: fast start, long
// settle), so the strip "boots" together with the rest of the hero.
const countOptions = {
  duration: reducedMotion ? 0 : 1600,
  transition: [0.16, 1, 0.3, 1] as [number, number, number, number]
}
const playersTween = useTransition(() => props.playersCount, countOptions)
const teamsTween = useTransition(() => props.teamsCount, countOptions)
const discordTween = useTransition(() => props.discordMembers, countOptions)

const metrics = computed(() => [
  { label: 'Гравців', value: props.playersCount ? `${Math.round(playersTween.value)}+` : '—' },
  { label: 'Команд', value: props.teamsCount ? `${Math.round(teamsTween.value)}+` : '—' },
  { label: 'У Discord', value: props.discordMembers ? `${Math.round(discordTween.value)}+` : '—' },
  { label: 'Активних турнірів', value: String(props.tournaments.length).padStart(2, '0') }
])

// ── Featured chip: the nearest active tournament, or the season teaser ────
const featured = computed(() => {
  const t = props.tournaments[0]
  if (!t) return { kicker: 'Скоро', text: 'Новий сезон турнірів', live: false }
  return {
    kicker: 'Активні турніри',
    text: t.name,
    live: t.tournamentStatus !== 'REGISTRATION'
  }
})

const featuredLink = computed(() => {
  const t = props.tournaments[0]
  return t ? { name: routeNames.tournament, params: { id: t.id } } : { name: routeNames.tournaments }
})

// ── Ticker ────────────────────────────────────────────────────────────────
const FALLBACK_TICKER: ITickerItem[] = [
  { text: 'Турніри 5×5 для верифікованих команд' },
  { text: 'Live трансляції на Twitch', tone: 'purple' },
  { text: 'Призові фонди й рейтинг гравців' },
  { text: 'Реєстрація через Discord' }
]

const tickerItems = computed<ITickerItem[]>(() => {
  const live = props.tournaments.map(t => ({
    text: t.name,
    kicker: 'Активні турніри',
    live: t.tournamentStatus !== 'REGISTRATION'
  }))
  const base = live.length ? [...live, ...FALLBACK_TICKER.slice(0, 2)] : FALLBACK_TICKER
  // Track must be long enough to fill a wide viewport before it wraps.
  return base.length < 6 ? [...base, ...base] : base
})

// Track is rendered twice so `translateX(-50%)` loops without a seam.
const tickerLoop = computed(() => [...tickerItems.value, ...tickerItems.value])

// ── Pointer parallax ──────────────────────────────────────────────────────
// Decorative, so the offset is spring-damped rather than tied 1:1 to the
// pointer (a 1:1 map feels mechanical). Each layer gets `transform` written
// directly — no CSS variables on the parent, which would recalc every child.
const heroRef = ref<HTMLElement | null>(null)
const glowCyanRef = ref<HTMLElement | null>(null)
const glowPurpleRef = ref<HTMLElement | null>(null)
const gridRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)
const arenaRef = ref<HTMLElement | null>(null)

const parallaxEnabled =
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
  !reducedMotion

const target = { x: 0, y: 0 }
const current = { x: 0, y: 0 }
let frame = 0

function onPointerMove (event: PointerEvent) {
  if (!parallaxEnabled || !heroRef.value) return
  const rect = heroRef.value.getBoundingClientRect()
  target.x = (event.clientX - rect.left) / rect.width - 0.5
  target.y = (event.clientY - rect.top) / rect.height - 0.5
  if (!frame) frame = requestAnimationFrame(tick)
}

function onPointerLeave () {
  if (!parallaxEnabled) return
  target.x = 0
  target.y = 0
  if (!frame) frame = requestAnimationFrame(tick)
}

function tick () {
  // Critically-damped follow: ~8% of the remaining distance per frame.
  current.x += (target.x - current.x) * 0.08
  current.y += (target.y - current.y) * 0.08

  const { x, y } = current
  if (glowCyanRef.value) glowCyanRef.value.style.transform = `translate3d(${x * 48}px, ${y * 36}px, 0)`
  if (glowPurpleRef.value) glowPurpleRef.value.style.transform = `translate3d(${x * -36}px, ${y * -28}px, 0)`
  if (gridRef.value) gridRef.value.style.transform = `translate3d(${x * 14}px, ${y * 10}px, 0)`
  if (contentRef.value) contentRef.value.style.transform = `translate3d(${x * -6}px, ${y * -4}px, 0)`
  // The arena is the nearest layer, so it moves the most and against the copy.
  if (arenaRef.value) arenaRef.value.style.transform = `translate3d(${x * -22}px, ${y * -16}px, 0)`

  const settled = Math.abs(target.x - current.x) < 0.0005 && Math.abs(target.y - current.y) < 0.0005
  frame = settled ? 0 : requestAnimationFrame(tick)
}

function scrollToNextSection () {
  const next = heroRef.value?.nextElementSibling
  next?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })
}

onBeforeUnmount(() => {
  if (frame) cancelAnimationFrame(frame)
  if (swapTimer) window.clearInterval(swapTimer)
})
</script>

<style scoped lang="scss">
// ─────────────────────────────────────────────────────────────────────────────
// Broadcast title card, two columns: copy left, arena right. Everything
// animates on transform / opacity / clip-path / filter. Entrance choreography
// is one stagger scale (`--i` × 90ms) so the sequence lands in ~1.3s; ambient
// loops are slow and linear; every loop dies under prefers-reduced-motion.
// ─────────────────────────────────────────────────────────────────────────────
$stagger: 90ms;
$lead: 180ms;

.hero {
  // Horizontal inset matches the header's content gutter (px-20 / lg:px-40) so
  // the brackets sit flush with the logo and the profile menu.
  --hud-corner-inset: 20px;
  --hud-corner-inset-x: 20px;
  --hud-corner-inset-y: 20px;
  --hud-corner-size: 28px;
  --hud-corner-weight: 2px;
  --hud-corner-color: rgba(var(--ds-primary-rgb), 0.55);
  --hud-corner-glow: drop-shadow(0 0 6px rgba(var(--ds-primary-rgb), 0.5));

  background: var(--ds-background);

  @screen lg {
    --hud-corner-inset-x: 40px;
  }

  // Top brackets only: the bottom pair would collide with the ticker.
  &::after,
  .hud-corners--mirror::after {
    display: none;
  }
}

// Frame labels nest inside the top brackets' L, a hair below the arm.
.hero-label {
  position: absolute;
  z-index: 10;
  top: calc(var(--hud-corner-inset-y) + 14px);

  &--left {
    left: calc(var(--hud-corner-inset-x) + 14px);
  }

  &--right {
    right: calc(var(--hud-corner-inset-x) + 14px);
  }
}

.hero-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  will-change: transform;
}

.hero-content,
.hero-arena-wrap {
  will-change: transform;
}

// ─── Atmosphere ─────────────────────────────────────────────────────────────
.atm-glow {
  position: absolute;
  pointer-events: none;
  animation: glow-breathe 9s ease-in-out infinite;

  &--cyan {
    top: -20%;
    left: -15%;
    width: 65%;
    height: 75%;
    background: radial-gradient(ellipse at center, rgba(var(--ds-primary-rgb), 0.14) 0%, transparent 68%);
  }

  &--purple {
    top: -8%;
    right: -12%;
    width: 55%;
    height: 65%;
    background: radial-gradient(ellipse at center, rgba(var(--ds-secondary-rgb), 0.11) 0%, transparent 65%);
    animation-duration: 11s;
    animation-direction: reverse;
  }
}

.atm-grid {
  position: absolute;
  inset: -24px;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 20%, black, transparent);
  -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 20%, black, transparent);
}

// Synthwave floor: a rotated grid that slides toward the viewer forever.
.hero-floor {
  position: absolute;
  inset: auto 0 0 0;
  height: 52%;
  perspective: 520px;
  perspective-origin: 50% 0%;
  overflow: hidden;
  pointer-events: none;
  mask-image: linear-gradient(to top, black 10%, transparent 95%);
  -webkit-mask-image: linear-gradient(to top, black 10%, transparent 95%);
}

.hero-floor__grid {
  position: absolute;
  inset: -100% -60% -80px;
  transform-origin: 50% 0%;
  background-image:
    linear-gradient(rgba(var(--ds-primary-rgb), 0.22) 1px, transparent 1px),
    linear-gradient(90deg, rgba(var(--ds-primary-rgb), 0.22) 1px, transparent 1px);
  background-size: 80px 80px;
  animation: floor-scroll 4s linear infinite;
}

@keyframes floor-scroll {
  from { transform: rotateX(64deg) translateY(0); }
  to { transform: rotateX(64deg) translateY(80px); }
}

// Film grain: SVG turbulence, blended, barely there.
.hero-grain {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.07;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

.atm-vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse at 50% 0%, transparent 40%, var(--ds-background) 82%);
}

@keyframes glow-breathe {
  0%, 100% { transform: scale(1) translateY(0); opacity: 1; }
  50% { transform: scale(1.06) translateY(-2%); opacity: 0.8; }
}

// ─── Entrance choreography ──────────────────────────────────────────────────
.hero-fade {
  opacity: 0;
  animation: hero-rise 700ms var(--ds-ease-out) forwards;
  animation-delay: calc(#{$lead} + var(--i, 0) * #{$stagger});
}

@keyframes hero-rise {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}

// Kicker with a live dot.
// HUD tag: solid cyan cap ("Dota 2" + live dot) and the league name in light
// mono, squared frame with two small brackets hanging off the outer corners.
.hero-kicker {
  --hud-corner-inset: -4px;
  --hud-corner-inset-x: -4px;
  --hud-corner-inset-y: -4px;
  --hud-corner-size: 9px;
  --hud-corner-weight: 1px;
  --hud-corner-color: rgba(var(--ds-primary-rgb), 0.9);

  @apply inline-flex items-stretch overflow-visible rounded-[3px] border;
  border-color: rgba(var(--ds-primary-rgb), 0.3);
  background: rgba(7, 8, 15, 0.62);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 0 18px rgba(var(--ds-primary-rgb), 0.12);
}

.hero-kicker__tag {
  @apply inline-flex items-center gap-8 px-10 py-6 font-display text-[11px] font-bold uppercase;
  letter-spacing: 0.14em;
  line-height: 1;
  color: var(--ds-background);
  background: linear-gradient(180deg, #7df0ff 0%, var(--ds-primary) 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45);
}

.hero-kicker__text {
  @apply inline-flex items-center px-14 py-6;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.82);
}

.hero-kicker__dot {
  @apply block size-6 rounded-full;
  background: var(--ds-background);
  animation: dot-pulse 2.2s ease-in-out infinite;
}

@keyframes dot-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.55; transform: scale(0.8); }
}

// Headline: each line rises out of its own mask. The wrapper clips, the inner
// span moves — so the mask stays put and the text emerges through it.
.hero-title {
  display: flex;
  flex-direction: column;
  align-items: center;

  @screen lg {
    align-items: flex-start;
  }
}

.hero-line {
  display: block;
  clip-path: inset(-0.12em -0.2em -0.18em -0.2em);
  padding: 0 0.08em;

  @screen lg {
    padding-left: 0;
    margin-left: -0.04em; // optical: pull the glyph edge onto the column line
  }
}

.hero-line__text {
  display: inline-block;
  transform: translateY(112%);
  opacity: 0;
  animation: line-rise 900ms var(--ds-ease-out) forwards;
  animation-delay: calc(#{$lead} + 2 * #{$stagger} + var(--i, 0) * 110ms);
}

@keyframes line-rise {
  from { transform: translateY(112%); opacity: 0; }
  60% { opacity: 1; }
  to { transform: translateY(0); opacity: 1; }
}

// Gradient word: a slow light sweep across the cyan → pink ramp.
.hero-shimmer {
  background-size: 220% 100%;
  // The sweep eases and alternates, so the gradient glides back instead of
  // snapping to its start at every loop.
  animation:
    line-rise 900ms var(--ds-ease-out) forwards,
    shimmer 8s ease-in-out 1.6s infinite alternate;
  animation-delay: calc(#{$lead} + 2 * #{$stagger} + 110ms), 1.6s;
}

@keyframes shimmer {
  from { background-position: 0% 50%; }
  to { background-position: 200% 50%; }
}

// System label "types" in with a stepped clip and a blinking cursor.
.hero-boot {
  clip-path: inset(0 100% 0 0);
  animation: boot-type 900ms steps(26) forwards;
  animation-delay: $lead;

  &::after {
    content: '_';
    margin-left: 2px;
    animation: caret-blink 1s steps(1) infinite;
  }
}

@keyframes boot-type {
  to { clip-path: inset(0 -4px 0 0); }
}

@keyframes caret-blink {
  50% { opacity: 0; }
}

// ─── Arena ──────────────────────────────────────────────────────────────────
.hero-arena {
  position: relative;
  width: min(100%, 440px);
  aspect-ratio: 4 / 5;
  opacity: 0;
  animation: arena-in 1000ms var(--ds-ease-out) forwards;
  animation-delay: calc(#{$lead} + 2 * #{$stagger});

  @screen lg {
    width: min(100%, 480px, (100svh - 261px) * 0.8);
  }
}

@keyframes arena-in {
  from { opacity: 0; transform: scale(0.94) translateY(16px); }
  to { opacity: 1; transform: none; }
}

// Rings: a static dashed orbit and a sweeping cyan arc on top of it.
.hero-arena__ring {
  position: absolute;
  left: 50%;
  top: 46%;
  width: 82%;
  aspect-ratio: 1;
  border-radius: 50%;
  translate: -50% -50%;
  pointer-events: none;

  &--dashed {
    border: 1px dashed rgba(var(--ds-primary-rgb), 0.22);
    animation: ring-spin 60s linear infinite reverse;
  }

  &--sweep {
    background: conic-gradient(from 0deg, transparent 0 68%, rgba(var(--ds-primary-rgb), 0.85) 86%, transparent 100%);
    mask: radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 1px));
    -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 1px));
    filter: drop-shadow(0 0 8px rgba(var(--ds-primary-rgb), 0.7));
    animation: ring-spin 9s linear infinite;
  }
}

@keyframes ring-spin {
  to { rotate: 360deg; }
}

// Lit platform under the figure.
.hero-arena__base {
  position: absolute;
  left: 50%;
  bottom: 6%;
  width: 78%;
  height: 12%;
  translate: -50% 0;
  border-radius: 50%;
  pointer-events: none;
  background: radial-gradient(ellipse at center, rgba(var(--ds-primary-rgb), 0.35), transparent 70%);
  filter: blur(6px);
  animation: base-breathe 5s ease-in-out infinite;
}

@keyframes base-breathe {
  0%, 100% { opacity: 0.7; transform: scaleX(1); }
  50% { opacity: 1; transform: scaleX(1.06); }
}

// The figure floats; the images inside crossfade through a blur.
.hero-arena__figure {
  position: absolute;
  inset: 4% 6% 8%;
  animation: figure-float 6s ease-in-out infinite;
}

@keyframes figure-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.hero-arena__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center bottom;
  transform-origin: 50% 100%; // grow from the feet so every hero stands on the base
  user-select: none;
  opacity: 0;
  transform: scale(calc(var(--hero-scale, 1) * 1.04));
  filter: blur(8px) drop-shadow(0 24px 40px rgba(0, 0, 0, 0.6));
  transition:
    opacity 900ms ease,
    transform 900ms var(--ds-ease-out),
    filter 900ms ease;

  &.is-active {
    opacity: 1;
    transform: scale(var(--hero-scale, 1));
    filter: blur(0) drop-shadow(0 24px 40px rgba(0, 0, 0, 0.6)) drop-shadow(0 0 28px rgba(var(--ds-primary-rgb), 0.22));
  }

  // iOS Safari can't keep a filtered 1440px render in GPU memory and paints the
  // layer as a white square. Phones and tablets get a plain opacity crossfade.
  @media (max-width: theme('screens.lg')) {
    filter: none;
    transition: opacity 900ms ease, transform 900ms var(--ds-ease-out);

    &.is-active {
      filter: none;
    }
  }
}

// Floating HUD chips anchored to the arena corners.
.hero-chip {
  @apply absolute z-10 inline-flex max-w-[240px] items-center gap-10 rounded-lg border px-12 py-8 no-underline;
  color: rgba(255, 255, 255, 0.9);
  border-color: rgba(var(--ds-primary-rgb), 0.25);
  background: rgba(7, 8, 15, 0.72);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: var(--ds-elevation-3), inset 0 1px 0 rgba(var(--ds-primary-rgb), 0.12);
  transition: border-color var(--ds-duration-base) ease, box-shadow var(--ds-duration-base) ease,
    transform var(--ds-duration-press) var(--ds-ease-out);

  &:active {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.7);
    outline-offset: 3px;
  }

  // Shared accent treatment; `--chip-rgb` picks the hue.
  &--featured,
  &--stream {
    --chip-rgb: var(--ds-primary-rgb);
    overflow: hidden;
    border-color: rgba(var(--chip-rgb), 0.55);
    background:
      linear-gradient(135deg, rgba(var(--chip-rgb), 0.2) 0%, rgba(var(--chip-rgb), 0.04) 60%, transparent 100%),
      rgba(7, 8, 15, 0.78);
    box-shadow:
      var(--ds-elevation-3),
      inset 0 1px 0 rgba(var(--chip-rgb), 0.35),
      0 0 18px rgba(var(--chip-rgb), 0.22);

    &::before {
      content: '';
      position: absolute;
      inset: 0 auto 0 0;
      width: 2px;
      background: rgb(var(--chip-rgb));
      box-shadow: 0 0 8px rgba(var(--chip-rgb), 0.9);
    }
  }

  &--featured {
    left: -6%;
    top: 6%;
    animation-name: hero-rise, chip-drift;
    animation-duration: 700ms, 7s;
    animation-timing-function: var(--ds-ease-out), ease-in-out;
    animation-iteration-count: 1, infinite;
    animation-fill-mode: forwards, none;
    animation-delay: calc(#{$lead} + 7 * #{$stagger}), 1.6s;
  }

  &--stream {
    --chip-rgb: var(--ds-secondary-rgb);
    right: -4%;
    bottom: 8%;
    animation-name: hero-rise, chip-drift;

    .hero-chip__kicker {
      color: #bf94ff;
    }
    animation-duration: 700ms, 8s;
    animation-timing-function: var(--ds-ease-out), ease-in-out;
    animation-iteration-count: 1, infinite;
    animation-fill-mode: forwards, none;
    animation-delay: calc(#{$lead} + 8 * #{$stagger}), 2.2s;
    animation-direction: normal, reverse;
  }
}

// Metric chips: label over a big mono number, six slots around the ring.
// Each slot drifts on its own period so the cloud never moves in lockstep.
.hero-chip--metric {
  @apply m-0 flex-col items-start gap-3 px-12 py-8;
  cursor: default;
  user-select: none;
  animation-name: hero-rise, chip-drift;
  animation-duration: 700ms, 7s;
  animation-timing-function: var(--ds-ease-out), ease-in-out;
  animation-iteration-count: 1, infinite;
  animation-fill-mode: forwards, none;

  &-1 {
    right: 4%;
    top: 6%;
    animation-delay: calc(#{$lead} + 9 * #{$stagger}), 1.2s;
  }

  &-2 {
    left: -10%;
    top: 44%;
    animation-duration: 700ms, 8s;
    animation-delay: calc(#{$lead} + 10 * #{$stagger}), 2.8s;
  }

  &-3 {
    right: -10%;
    top: 46%;
    animation-duration: 700ms, 9s;
    animation-delay: calc(#{$lead} + 11 * #{$stagger}), 0.6s;
  }

  &-4 {
    left: -2%;
    bottom: 10%;
    animation-duration: 700ms, 7.5s;
    animation-delay: calc(#{$lead} + 12 * #{$stagger}), 2s;
  }
}

// Phones: the arena spans the whole column, so negative offsets push chips past
// the screen edge (the section clips them). Pull the orbit in tight to the figure.
@media (max-width: theme('screens.md')) {
  .hero-chip--featured {
    left: 0;
    top: 4%;
    max-width: 62%;
  }

  .hero-chip--stream {
    right: 0;
    bottom: 10%;
  }

  .hero-chip--metric-1 {
    right: 0;
    top: 4%;
  }

  .hero-chip--metric-2 {
    left: 0;
    top: 40%;
  }

  .hero-chip--metric-3 {
    right: 0;
    top: 40%;
  }

  .hero-chip--metric-4 {
    left: 0;
    bottom: 24%;
  }
}

.hero-chip__number {
  @apply m-0;
  font-family: var(--ds-font-mono);
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;
  color: #fff;
  text-shadow: var(--ds-neon-text-subtle);
}

@keyframes chip-drift {
  0%, 100% { translate: 0 0; }
  50% { translate: 0 -6px; }
}

.hero-chip__dot {
  @apply block size-6 shrink-0 rounded-full;
  background: var(--ds-primary);
  box-shadow: 0 0 8px rgba(var(--ds-primary-rgb), 0.9);

  .is-live & {
    background: var(--ds-pink);
    box-shadow: 0 0 8px rgba(var(--ds-pink-rgb), 0.9);
    animation: dot-pulse 1.6s ease-in-out infinite;
  }
}

.hero-chip__kicker {
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--ds-primary);
  text-shadow: var(--ds-neon-text-subtle);

  .is-live & {
    color: var(--ds-pink);
    text-shadow: var(--ds-neon-text-pink);
  }
}

.hero-chip__text {
  @apply max-w-[180px] font-display text-[12px] uppercase tracking-wide;
  color: #fff;
}

.hero-chip__arrow {
  color: rgba(255, 255, 255, 0.5);
  transition: transform var(--ds-duration-base) var(--ds-ease-out), color var(--ds-duration-fast) ease;
}

// ─── CTAs ───────────────────────────────────────────────────────────────────
.hero-cta {
  @apply relative inline-flex items-center gap-12 rounded-xl px-28 py-16 text-base font-bold;
  color: #fff;
  border: 1px solid transparent;
  cursor: pointer;
  isolation: isolate;
  transition:
    background-color var(--ds-duration-fast) ease,
    border-color var(--ds-duration-fast) ease,
    box-shadow var(--ds-duration-base) ease,
    transform var(--ds-duration-press) var(--ds-ease-out);

  &:not(:disabled):active {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.7);
    outline-offset: 3px;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  // Neon accent: solid brand cyan, near-black display type, and a blurred
  // cyan halo behind the box that breathes (opacity only). The one lit
  // surface in the hero, so it is the obvious first tap.
  &--neon {
    @apply gap-12 px-32 py-16 font-display text-[14px] uppercase tracking-[0.1em];
    color: var(--ds-background);
    background: linear-gradient(180deg, #7df0ff 0%, var(--ds-primary) 55%, #14cfe9 100%);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.55),
      inset 0 -1px 0 rgba(0, 0, 0, 0.15),
      0 0 0 1px rgba(var(--ds-primary-rgb), 0.7),
      var(--ds-glow-primary);

    &::before {
      content: '';
      position: absolute;
      inset: -6px;
      z-index: -1;
      border-radius: 18px;
      background: var(--ds-primary);
      filter: blur(18px);
      opacity: 0.55;
      pointer-events: none;
      animation: cta-halo 2.6s ease-in-out infinite;
    }
  }

  &--ghost {
    border-color: rgba(var(--ds-primary-rgb), 0.35);
    background: rgba(var(--ds-primary-rgb), 0.04);
  }
}

// Paper plane: idles with a slow scale pulse, grows on hover. The pulse
// drives the individual `scale` property so the hover `transform` composes
// with it instead of overriding it. Label is engraved (dark type, light
// bottom edge).
.hero-cta__plane {
  flex-shrink: 0;
  filter: drop-shadow(0 1px 0 rgba(255, 255, 255, 0.35));
  animation: plane-pulse 2.4s ease-in-out infinite;
  transition: transform 220ms var(--ds-ease-out);
}

@keyframes plane-pulse {
  0%, 100% { scale: 1; opacity: 0.86; }
  50% { scale: 1.14; opacity: 1; }
}

.hero-cta__label {
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.45);
  transition: transform var(--ds-duration-base) var(--ds-ease-out);
}

// The sheen runs inside its own clipped layer (the button itself no longer
// clips, so the halo can bleed past its edge).
.hero-cta__clip {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: inherit;
  pointer-events: none;
}

// One-shot light sweep across the primary CTA right after it lands.
.hero-cta__sheen {
  position: absolute;
  inset: -20% auto -20% -40%;
  width: 40%;
  pointer-events: none;
  background: linear-gradient(105deg, transparent 0%, rgba(255, 255, 255, 0.55) 50%, transparent 100%);
  transform: translateX(-120%) skewX(-12deg);
  animation: sheen-loop 5s var(--ds-ease-in-out) infinite;
  animation-delay: calc(#{$lead} + 5 * #{$stagger} + 500ms);
}

// Sweep for the first 18% of the cycle, rest for the remainder.
@keyframes sheen-loop {
  0% { transform: translateX(-120%) skewX(-12deg); }
  18%, 100% { transform: translateX(420%) skewX(-12deg); }
}

@keyframes cta-halo {
  0%, 100% { opacity: 0.45; }
  50% { opacity: 0.85; }
}

.hero-cta__icon {
  color: var(--ds-primary);
  filter: drop-shadow(0 0 6px rgba(var(--ds-primary-rgb), 0.5));
}

.hero-cta__arrow {
  color: rgba(255, 255, 255, 0.6);
  transition: transform var(--ds-duration-base) var(--ds-ease-out), color var(--ds-duration-fast) ease;
}

// ─── Scroll cue ─────────────────────────────────────────────────────────────
// Vertical control on the right rail: rotated label, a long track with a
// falling light, a caret. It is a button with a 44px hit area, so it can be
// tabbed to and pressed, not just looked at.
.hero-scroll {
  flex-direction: column;
  align-items: center;
  gap: 12px;
  min-width: 44px;
  padding: 8px 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  opacity: 0;
  animation: hero-fade-only 600ms ease forwards;
  animation-delay: calc(#{$lead} + 9 * #{$stagger});
  transition: transform var(--ds-duration-press) var(--ds-ease-out);

  // Vertical centring comes from the utility translate; the press must keep it.
  &:active {
    transform: translateY(-50%) scale(0.96);
  }

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.7);
    outline-offset: 4px;
    border-radius: 8px;
  }
}

.hero-scroll__label {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  transition: color var(--ds-duration-fast) ease;
}

.hero-scroll__rail {
  position: relative;
  display: block;
  width: 2px;
  height: 72px;
  overflow: hidden;
  border-radius: 2px;
  background: rgba(var(--ds-primary-rgb), 0.16);
  transition: background-color var(--ds-duration-base) ease;
}

.hero-scroll__dot {
  position: absolute;
  inset: 0 0 auto 0;
  height: 24px;
  border-radius: 2px;
  background: linear-gradient(180deg, transparent, var(--ds-primary));
  box-shadow: 0 0 8px rgba(var(--ds-primary-rgb), 0.8);
  animation: scroll-drop 1.8s var(--ds-ease-in-out) infinite;
}

.hero-scroll__caret {
  color: rgba(var(--ds-primary-rgb), 0.7);
  transition: transform var(--ds-duration-base) var(--ds-ease-out), color var(--ds-duration-fast) ease;
}

@keyframes scroll-drop {
  from { transform: translateY(-100%); }
  to { transform: translateY(400%); }
}

// ─── Ticker ─────────────────────────────────────────────────────────────────
.hero-ticker {
  position: absolute;
  inset: auto 0 0 0;
  z-index: 10;
  height: 36px;
  overflow: hidden;
  border-top: 1px solid rgba(var(--ds-primary-rgb), 0.12);
  background: rgba(7, 8, 15, 0.55);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  mask-image: linear-gradient(90deg, transparent, black 8%, black 92%, transparent);
  -webkit-mask-image: linear-gradient(90deg, transparent, black 8%, black 92%, transparent);
}

.hero-ticker__track {
  display: flex;
  width: max-content;
  height: 100%;
  align-items: center;
  animation: ticker 46s linear infinite;
}

@keyframes ticker {
  to { transform: translateX(-50%); }
}

.hero-ticker__item {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 0 28px;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  white-space: nowrap;
  color: rgba(255, 255, 255, 0.5);

  &.is-purple {
    color: #bf94ff;
    text-shadow: 0 0 10px rgba(var(--ds-secondary-rgb), 0.5);
  }
}

.hero-ticker__dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(var(--ds-primary-rgb), 0.6);

  .is-live & {
    background: var(--ds-pink);
    box-shadow: 0 0 8px rgba(var(--ds-pink-rgb), 0.8);
  }

  .is-purple & {
    background: #bf94ff;
    box-shadow: 0 0 8px rgba(var(--ds-secondary-rgb), 0.8);
  }
}

.hero-ticker__kicker {
  color: var(--ds-primary);
  text-shadow: var(--ds-neon-text-subtle);

  .is-live & {
    color: var(--ds-pink);
    text-shadow: var(--ds-neon-text-pink);
  }
}

// ─── Pointer-only hover ─────────────────────────────────────────────────────
@media (hover: hover) and (pointer: fine) {
  .hero-cta--neon:hover {
    background: linear-gradient(180deg, #a6f5ff 0%, #66ecff 55%, var(--ds-primary) 100%);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.65),
      inset 0 -1px 0 rgba(0, 0, 0, 0.15),
      0 0 0 1px rgba(var(--ds-primary-rgb), 0.9),
      0 0 24px rgba(var(--ds-primary-rgb), 0.7),
      0 0 64px rgba(var(--ds-primary-rgb), 0.3);

    &::before {
      opacity: 1;
    }

    .hero-cta__plane {
      transform: scale(1.18);
    }

    .hero-cta__label {
      transform: translateX(2px);
    }
  }

  .hero-cta--ghost:hover {
    border-color: rgba(var(--ds-primary-rgb), 0.7);
    background: rgba(var(--ds-primary-rgb), 0.1);
    box-shadow: var(--ds-glow-primary-soft);

    .hero-cta__arrow {
      color: var(--ds-primary);
      transform: translateX(4px);
    }
  }

  .hero-chip:hover {
    border-color: rgba(var(--ds-primary-rgb), 0.6);
    box-shadow: var(--ds-elevation-3), var(--ds-glow-primary-soft);

    .hero-chip__arrow {
      color: var(--ds-primary);
      transform: translate(2px, -2px);
    }
  }

  // Link chips: hover stays in the chip's own hue (cyan / Twitch purple) and
  // pushes the tint, edge and halo up a notch.
  .hero-chip--featured:hover,
  .hero-chip--stream:hover {
    border-color: rgba(var(--chip-rgb), 0.95);
    background:
      linear-gradient(135deg, rgba(var(--chip-rgb), 0.34) 0%, rgba(var(--chip-rgb), 0.1) 60%, transparent 100%),
      rgba(7, 8, 15, 0.82);
    box-shadow:
      var(--ds-elevation-3),
      inset 0 1px 0 rgba(var(--chip-rgb), 0.6),
      0 0 0 1px rgba(var(--chip-rgb), 0.35),
      0 0 28px rgba(var(--chip-rgb), 0.45);
  }

  .hero-chip--stream:hover .hero-chip__arrow,
  .hero-chip--featured:hover .hero-chip__arrow {
    color: rgb(var(--chip-rgb));
  }

  .hero-scroll:hover {
    .hero-scroll__label {
      color: var(--ds-primary);
    }

    .hero-scroll__rail {
      background: rgba(var(--ds-primary-rgb), 0.35);
    }

    .hero-scroll__caret {
      color: var(--ds-primary);
      transform: translateY(3px);
    }
  }
}

// ─── Reduced motion: keep the fades, drop every loop and every slide ───────
@media (prefers-reduced-motion: reduce) {
  .hero-fade,
  .hero-line__text,
  .hero-arena,
  .hero-chip {
    animation: hero-fade-only 300ms ease forwards;
    transform: none;
  }

  .hero-boot {
    clip-path: none;
    animation: hero-fade-only 300ms ease forwards;

    &::after {
      display: none;
    }
  }

  .hero-shimmer {
    animation: hero-fade-only 300ms ease forwards;
  }

  .atm-glow,
  .hero-floor__grid,
  .hero-scroll__dot,
  .hero-ticker__track,
  .hero-cta__sheen,
  .hero-kicker__dot,
  .hero-chip__dot,
  .hero-arena__ring,
  .hero-arena__base,
  .hero-arena__figure {
    animation: none;
  }

  .hero-floor__grid {
    transform: rotateX(64deg);
  }

  .hero-cta__sheen {
    display: none;
  }

  .hero-cta--neon::before {
    animation: none;
  }

  .hero-cta__plane,
  .hero-cta__label {
    animation: none;
    transition: none;
    transform: none !important;
  }

  .hero-arena__img {
    transition: none;
  }
}

@keyframes hero-fade-only {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
