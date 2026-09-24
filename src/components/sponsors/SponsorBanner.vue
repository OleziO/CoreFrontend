<template>
  <div
    class="sponsor-banner"
    :class="{ 'is-dense': dense }"
    role="group"
    aria-roledescription="Карусель спонсорів"
    aria-label="Спонсори"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
    @focusin="focused = true"
    @focusout="focused = false"
  >
    <!-- Шапка ПОЗА кадром: підпис і CTA ніколи не перекривають рекламний макет -->
    <div class="sponsor-banner__head">
      <span class="sys-label sys-label--gold flex min-w-0 flex-1 items-center gap-12">
        <span class="whitespace-nowrap">// {{ label }}</span>
        <span class="hud-line sponsor-banner__rule" aria-hidden="true" />
      </span>

      <a
        v-if="inviteUrl"
        :href="inviteUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="sponsor-banner__cta"
      >
        <PhHandshake :size="13" weight="fill" />
        <span>Стати спонсором</span>
        <PhArrowUpRight :size="12" weight="bold" class="sponsor-banner__cta-arrow" />
      </a>
    </div>

    <!-- Кадр: золоті HUD-кутники навколо банера -->
    <div class="sponsor-banner__frame hud-corners" :class="{ 'is-empty': isEmpty }">
      <span class="hud-corners hud-corners--mirror absolute inset-0" aria-hidden="true" />

      <div class="sponsor-banner__viewport">
        <!-- Порожній слот: продаємо місце так само, як на головній -->
        <a
          v-if="isEmpty"
          :href="inviteUrl || undefined"
          :target="inviteUrl ? '_blank' : undefined"
          :rel="inviteUrl ? 'noopener noreferrer' : undefined"
          class="sponsor-banner__open"
          :class="inviteUrl ? 'cursor-pointer' : 'cursor-default'"
          aria-label="Вільний спонсорський слот — стати спонсором"
        >
          <span class="sponsor-banner__scan" aria-hidden="true" />
          <span class="sponsor-banner__open-index">slot 01</span>
          <span class="sponsor-banner__open-state">Вільно</span>
          <span v-if="inviteUrl" class="sponsor-banner__open-hint">
            Стати спонсором <PhArrowUpRight :size="11" weight="bold" />
          </span>
        </a>

        <Transition v-else name="sponsor-slide">
          <component
            :is="activeSponsor?.websiteUrl ? 'a' : 'div'"
            :key="activeSponsor?.id"
            :href="activeSponsor?.websiteUrl || undefined"
            :target="activeSponsor?.websiteUrl ? '_blank' : undefined"
            :rel="activeSponsor?.websiteUrl ? 'noopener noreferrer' : undefined"
            class="sponsor-banner__slide"
            :class="activeSponsor?.websiteUrl ? 'cursor-pointer' : 'cursor-default'"
            :aria-label="activeSponsor?.name"
          >
            <img
              v-if="activeSponsor?.bannerUrl && !failedAssets.has(`b:${activeSponsor.id}`)"
              :src="activeSponsor.bannerUrl"
              :alt="activeSponsor.name"
              class="h-full w-full object-cover"
              @error="failedAssets.add(`b:${activeSponsor!.id}`)"
            >
            <!-- Fallback: лого на темному тлі, якщо банера немає -->
            <div v-else class="sponsor-banner__fallback">
              <span class="scanlines" aria-hidden="true" />
              <img
                v-if="activeSponsor && activeSponsor.logoUrl && !failedAssets.has(activeSponsor.id)"
                :src="resolvePublicOrApiUrl(activeSponsor.logoUrl)"
                :alt="activeSponsor.name"
                class="relative max-h-[50%] w-auto max-w-[55%] object-contain"
                @error="failedAssets.add(activeSponsor!.id)"
              >
              <span v-else class="relative font-display text-lg uppercase tracking-wider text-white/90">
                {{ activeSponsor?.name }}
              </span>
            </div>
          </component>
        </Transition>
      </div>
    </div>

    <!-- Футер: зважена смуга прогресу + керування. Теж поза кадром. -->
    <div v-if="!isEmpty" class="sponsor-banner__foot">
      <!-- Сегменти: ширина ∝ вага, активний заповнюється за реальний час показу -->
      <div v-if="hasMany" class="sponsor-banner__rail">
        <button
          v-for="(sponsor, idx) in sponsorList"
          :key="sponsor.id"
          type="button"
          class="sponsor-banner__seg"
          :class="{ 'is-active': idx === currentIndex, 'is-done': idx < currentIndex }"
          :style="{ flexGrow: getRotationWeight(sponsor) }"
          :aria-label="`Показати спонсора: ${sponsor.name}`"
          :aria-current="idx === currentIndex ? 'true' : undefined"
          @click="goTo(idx)"
        >
          <span class="sponsor-banner__seg-track">
            <span
              v-if="idx === currentIndex"
              :key="cycle"
              class="sponsor-banner__seg-fill"
              :class="{ 'is-held': isHeld, 'is-static': isStatic }"
              :style="{ animationDuration: `${dwellMs}ms` }"
            />
          </span>
        </button>
      </div>

      <div class="sponsor-banner__caption">
        <span class="sponsor-banner__tier">{{ tierLabel }}</span>
        <span class="sponsor-banner__name">{{ activeSponsor?.name }}</span>
      </div>

      <div v-if="hasMany" class="sponsor-banner__controls">
        <button type="button" class="sponsor-banner__arrow" aria-label="Попередній спонсор" @click="prev">
          <PhCaretLeft :size="14" weight="bold" />
        </button>
        <span class="sponsor-banner__counter" aria-hidden="true">
          <span class="text-white">{{ pad(currentIndex + 1) }}</span>
          <span class="mx-4 opacity-40">/</span>{{ pad(sponsorList.length) }}
        </span>
        <button type="button" class="sponsor-banner__arrow" aria-label="Наступний спонсор" @click="next">
          <PhCaretRight :size="14" weight="bold" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhCaretLeft, PhCaretRight, PhHandshake, PhArrowUpRight } from '@phosphor-icons/vue'
import { resolvePublicOrApiUrl } from '@/core/helpers'
import { getBannerSponsors, getRotationWeight, type TSponsor, type TSponsorTier } from '@/config/sponsors'

const props = withDefaults(defineProps<{
  /** Спонсори для ротації. За замовч. — усі з конфігу, від найвагоміших. */
  sponsors?: TSponsor[]
  /** Зменшена висота — для вузької смуги (список турнірів). */
  dense?: boolean
  /** Підпис у шапці (після `//`). */
  label?: string
  /** Куди веде заклик «Стати спонсором». `null` — приховати CTA. */
  inviteUrl?: string | null
}>(), {
  sponsors: () => getBannerSponsors(),
  dense: false,
  label: 'Спонсори',
  inviteUrl: null
})

const TIER_LABEL: Record<TSponsorTier, string> = {
  title: 'Титульний спонсор',
  gold: 'Золотий спонсор',
  silver: 'Срібний спонсор',
  partner: 'Партнер'
}

const sponsorList = computed(() => props.sponsors)
const isEmpty = computed(() => sponsorList.value.length === 0)
const hasMany = computed(() => sponsorList.value.length > 1)

const hovered = ref(false)
const focused = ref(false)
const paused = computed(() => hovered.value || focused.value)

const { currentIndex, current, next, prev, goTo, isPaused, dwellMs, cycle } = useWeightedRotation(sponsorList, {
  weightOf: getRotationWeight,
  paused
})

const activeSponsor = computed(() => current.value ?? sponsorList.value[0])
const tierLabel = computed(() => activeSponsor.value ? TIER_LABEL[activeSponsor.value.tier] : '')

/** Користувач утримує карусель (hover/фокус) — смуга завмирає на місці. */
const isHeld = computed(() => isPaused.value && paused.value)
/** Автопрогравання вимкнене (reduced-motion тощо) — активний сегмент просто лишається заповненим. */
const isStatic = computed(() => isPaused.value && !paused.value)

// Зображення, які не завантажились — показуємо назву/лого замість «битої» картинки.
const failedAssets = reactive(new Set<string>())

function pad (n: number): string {
  return String(n).padStart(2, '0')
}
</script>

<style scoped>
/* ─── Layout ─────────────────────────────────────────────────────────────── */
.sponsor-banner {
  --sb-gold: var(--ds-gold);
  --sb-gold-rgb: var(--ds-gold-rgb);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sponsor-banner__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  padding: 0 2px;
}

/* Лінійка тягнеться від підпису до CTA і згасає праворуч */
.sponsor-banner__rule {
  flex: 1;
  min-width: 24px;
  background: linear-gradient(90deg, rgba(var(--sb-gold-rgb), 0.45), transparent);
}

.sponsor-banner__cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid rgba(var(--sb-gold-rgb), 0.32);
  background: rgba(var(--sb-gold-rgb), 0.06);
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--sb-gold);
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition:
    border-color var(--ds-duration-base) ease,
    background-color var(--ds-duration-base) ease,
    box-shadow var(--ds-duration-base) ease,
    transform var(--ds-duration-press) var(--ds-ease-out);
}

.sponsor-banner__cta:active {
  transform: scale(0.97);
}

.sponsor-banner__cta:focus-visible {
  outline: 2px solid rgba(var(--sb-gold-rgb), 0.7);
  outline-offset: 3px;
}

.sponsor-banner__cta-arrow {
  transition: transform var(--ds-duration-base) var(--ds-ease-out);
}

/* ─── Frame ──────────────────────────────────────────────────────────────── */
/* Кутники сидять на самій рамці (inset -2px), радіус повторює rounded-2xl. */
.sponsor-banner__frame {
  --hud-corner-size: 22px;
  --hud-corner-inset: -2px;
  --hud-corner-radius: 14px;
  --hud-corner-weight: 2px;
  --hud-corner-color: rgba(var(--sb-gold-rgb), 0.75);
  --hud-corner-glow: drop-shadow(0 0 4px rgba(var(--sb-gold-rgb), 0.35));
  position: relative;
}

.sponsor-banner__viewport {
  position: relative;
  width: 100%;
  aspect-ratio: 1200 / 260;
  max-height: 280px;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: var(--ds-surface);
  box-shadow:
    var(--ds-elevation-3),
    0 0 0 1px rgba(var(--sb-gold-rgb), 0.08);
  transition: border-color 360ms ease, box-shadow 360ms ease;
}

.is-dense .sponsor-banner__viewport {
  aspect-ratio: auto;
  height: 88px;
}

@media (min-width: 640px) {
  .is-dense .sponsor-banner__viewport {
    height: 110px;
  }
}

/* Вузька смуга: банер не обрізаємо, а вписуємо — реклама лишається читабельною */
.is-dense .sponsor-banner__slide img {
  object-fit: contain;
}

.is-empty .sponsor-banner__viewport {
  border-style: dashed;
  border-color: rgba(var(--sb-gold-rgb), 0.28);
  box-shadow: none;
}

.is-empty {
  --hud-corner-color: rgba(var(--sb-gold-rgb), 0.4);
  --hud-corner-glow: none;
}

.sponsor-banner__slide {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sponsor-banner__fallback {
  position: relative;
  display: flex;
  height: 100%;
  width: 100%;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(ellipse at center, rgba(var(--sb-gold-rgb), 0.12), transparent 70%),
    linear-gradient(135deg, var(--ds-elevated-surface), var(--ds-surface));
}

/* ─── Empty slot ─────────────────────────────────────────────────────────── */
.sponsor-banner__open {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  text-decoration: none;
  background:
    repeating-linear-gradient(-45deg, rgba(var(--sb-gold-rgb), 0.05) 0 1px, transparent 1px 10px),
    rgba(7, 8, 15, 0.45);
  overflow: hidden;
}

.sponsor-banner__scan {
  position: absolute;
  inset: 0 0 auto 0;
  height: 28px;
  background: linear-gradient(180deg, transparent, rgba(var(--sb-gold-rgb), 0.14), transparent);
  transform: translateY(-100%);
  animation: sponsor-scan 6s linear infinite;
  pointer-events: none;
}

@keyframes sponsor-scan {
  0% { transform: translateY(-100%); }
  45%, 100% { transform: translateY(1100%); }
}

.sponsor-banner__open-index {
  font-family: var(--ds-font-mono);
  font-size: 9px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: rgba(var(--sb-gold-rgb), 0.6);
}

.sponsor-banner__open-state {
  font-family: var(--ds-font-display);
  font-size: 13px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
  transition: color 360ms ease;
}

.sponsor-banner__open-hint {
  position: absolute;
  bottom: 10px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--ds-font-mono);
  font-size: 9px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--sb-gold);
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 360ms ease, transform 360ms var(--ds-ease-out);
}

.sponsor-banner__open:focus-visible {
  outline: 2px solid rgba(var(--sb-gold-rgb), 0.7);
  outline-offset: -2px;
}

/* ─── Footer: rail + caption + controls ──────────────────────────────────── */
.sponsor-banner__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 16px;
  padding: 0 2px;
}

.sponsor-banner__rail {
  display: flex;
  flex: 1 1 100%;
  gap: 4px;
  order: -1;
}

@media (min-width: 640px) {
  .sponsor-banner__rail {
    flex: 0 1 260px;
    order: 0;
  }
}

/* Сегмент — кнопка з великою зоною натискання, сама смуга тонка */
.sponsor-banner__seg {
  display: flex;
  align-items: center;
  flex-basis: 0;
  min-width: 24px;
  height: 28px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.sponsor-banner__seg:focus-visible {
  outline: 2px solid rgba(var(--sb-gold-rgb), 0.7);
  outline-offset: 2px;
  border-radius: 4px;
}

.sponsor-banner__seg-track {
  position: relative;
  display: block;
  width: 100%;
  height: 3px;
  overflow: hidden;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.14);
  transition: background-color var(--ds-duration-base) ease;
}

/* Уже показані — заповнені приглушеним золотом */
.sponsor-banner__seg.is-done .sponsor-banner__seg-track {
  background: rgba(var(--sb-gold-rgb), 0.45);
}

.sponsor-banner__seg-fill {
  position: absolute;
  inset: 0;
  display: block;
  transform-origin: left center;
  transform: scaleX(0);
  background: var(--sb-gold);
  box-shadow: 0 0 8px rgba(var(--sb-gold-rgb), 0.55);
  animation: sponsor-fill linear forwards;
}

.sponsor-banner__seg-fill.is-held {
  animation-play-state: paused;
}

.sponsor-banner__seg-fill.is-static {
  animation: none;
  transform: scaleX(1);
}

@keyframes sponsor-fill {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

.sponsor-banner__caption {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  align-items: baseline;
  gap: 10px;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  white-space: nowrap;
}

.sponsor-banner__tier {
  color: rgba(var(--sb-gold-rgb), 0.75);
}

.sponsor-banner__name {
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--ds-text-faint);
}

.sponsor-banner__controls {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
}

.sponsor-banner__counter {
  min-width: 52px;
  text-align: center;
  font-family: var(--ds-font-mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  color: var(--ds-text-faint);
  font-variant-numeric: tabular-nums;
}

.sponsor-banner__arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition:
    color var(--ds-duration-base) ease,
    border-color var(--ds-duration-base) ease,
    background-color var(--ds-duration-base) ease,
    transform var(--ds-duration-press) var(--ds-ease-out);
}

.sponsor-banner__arrow:active {
  transform: scale(0.94);
}

.sponsor-banner__arrow:focus-visible {
  outline: 2px solid rgba(var(--sb-gold-rgb), 0.7);
  outline-offset: 2px;
}

/* ─── Slide transition: crossfade with blur so two frames read as one ─────── */
.sponsor-slide-enter-active {
  transition:
    opacity 460ms var(--ds-ease-out),
    transform 460ms var(--ds-ease-out),
    filter 460ms var(--ds-ease-out);
}

.sponsor-slide-leave-active {
  transition: opacity 260ms ease, filter 260ms ease;
}

.sponsor-slide-enter-from {
  opacity: 0;
  transform: scale(1.03);
  filter: blur(6px);
}

.sponsor-slide-leave-to {
  opacity: 0;
  filter: blur(6px);
}

/* ─── Hover (pointer only — touch never gets a stuck lit state) ──────────── */
@media (hover: hover) and (pointer: fine) {
  .sponsor-banner:hover .sponsor-banner__viewport {
    border-color: rgba(var(--sb-gold-rgb), 0.28);
    box-shadow:
      var(--ds-elevation-3),
      0 0 0 1px rgba(var(--sb-gold-rgb), 0.18),
      var(--ds-glow-gold);
  }

  .sponsor-banner:hover .sponsor-banner__frame:not(.is-empty) {
    --hud-corner-color: var(--sb-gold);
    --hud-corner-glow: drop-shadow(0 0 6px rgba(var(--sb-gold-rgb), 0.7));
  }

  .sponsor-banner__cta:hover {
    border-color: rgba(var(--sb-gold-rgb), 0.6);
    background: rgba(var(--sb-gold-rgb), 0.12);
    box-shadow: 0 0 14px rgba(var(--sb-gold-rgb), 0.18);
  }

  .sponsor-banner__cta:hover .sponsor-banner__cta-arrow {
    transform: translate(2px, -2px);
  }

  .sponsor-banner__open:hover .sponsor-banner__open-state {
    color: var(--ds-text);
  }

  .sponsor-banner__open:hover .sponsor-banner__open-hint {
    opacity: 1;
    transform: translateY(0);
  }

  .sponsor-banner__seg:hover .sponsor-banner__seg-track {
    background: rgba(255, 255, 255, 0.28);
  }

  .sponsor-banner__seg.is-done:hover .sponsor-banner__seg-track {
    background: rgba(var(--sb-gold-rgb), 0.65);
  }

  .sponsor-banner__arrow:hover {
    color: #fff;
    border-color: rgba(var(--sb-gold-rgb), 0.5);
    background: rgba(var(--sb-gold-rgb), 0.08);
  }
}

/* ─── Reduced motion: keep the fades, drop movement/blur/scan ────────────── */
@media (prefers-reduced-motion: reduce) {
  .sponsor-slide-enter-active,
  .sponsor-slide-leave-active {
    transition: opacity 200ms ease;
  }

  .sponsor-slide-enter-from,
  .sponsor-slide-leave-to {
    transform: none;
    filter: none;
  }

  .sponsor-banner__scan {
    animation: none;
  }
}
</style>
