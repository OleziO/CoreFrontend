<template>
  <el-dialog
    v-model="visible"
    align-center
    append-to-body
    destroy-on-close
    :show-close="false"
    width="min(1120px, 94vw)"
    class="proof-lightbox"
    @opened="scrollActiveThumbIntoView"
  >
    <!-- Шапка: системний ярлик, заголовок, лічильник і закриття -->
    <template #header>
      <div class="proof-lightbox__head">
        <div class="flex min-w-0 flex-col gap-4">
          <span class="sys-label">// Адмін · MMR</span>
          <h2 class="proof-lightbox__title">Докази</h2>
        </div>

        <div class="proof-lightbox__head-right">
          <span class="proof-lightbox__counter" aria-live="polite">
            <span class="proof-lightbox__counter-current">{{ pad(activeIndex + 1) }}</span>
            <span class="proof-lightbox__counter-sep" aria-hidden="true">/</span>
            <span>{{ pad(proofs.length) }}</span>
          </span>
          <button type="button" class="proof-lightbox__close" aria-label="Закрити" @click="close">
            <PhX :size="16" weight="bold" />
          </button>
        </div>
      </div>
    </template>

    <!-- Сцена: зображення на темному тлі з сіткою, стрілки по краях -->
    <div class="proof-lightbox__stage" :class="{ 'is-single': !hasMany }">
      <span class="proof-lightbox__corner is-tl" aria-hidden="true" />
      <span class="proof-lightbox__corner is-tr" aria-hidden="true" />
      <span class="proof-lightbox__corner is-bl" aria-hidden="true" />
      <span class="proof-lightbox__corner is-br" aria-hidden="true" />

      <Transition :name="transitionName" mode="out-in">
        <div :key="activeProof?.id ?? activeIndex" class="proof-lightbox__frame">
          <el-image
            v-if="activeProof"
            :src="activeProof.url"
            :alt="activeProof.name"
            :preview-src-list="proofUrls"
            :initial-index="activeIndex"
            fit="contain"
            preview-teleported
            hide-on-click-modal
            class="proof-lightbox__image"
          >
            <template #placeholder>
              <div class="proof-lightbox__loading" aria-busy="true">
                <span class="proof-lightbox__loading-bar" />
              </div>
            </template>
            <template #error>
              <div class="proof-lightbox__error" role="alert">
                <PhImageBroken :size="28" weight="duotone" aria-hidden="true" />
                <span>Не вдалося завантажити зображення</span>
              </div>
            </template>
          </el-image>
        </div>
      </Transition>

      <button
        v-if="hasMany"
        type="button"
        class="proof-lightbox__nav is-prev"
        aria-label="Попередній доказ"
        @click="step(-1)"
      >
        <PhCaretLeft :size="20" weight="bold" />
      </button>
      <button
        v-if="hasMany"
        type="button"
        class="proof-lightbox__nav is-next"
        aria-label="Наступний доказ"
        @click="step(1)"
      >
        <PhCaretRight :size="20" weight="bold" />
      </button>
    </div>

    <!-- Стрічка мініатюр -->
    <div
      v-if="hasMany"
      ref="filmstripRef"
      class="proof-lightbox__filmstrip"
      role="tablist"
      aria-label="Мініатюри доказів"
    >
      <button
        v-for="(proof, idx) in proofs"
        :key="proof.id"
        type="button"
        role="tab"
        class="proof-lightbox__thumb"
        :class="{ 'is-active': idx === activeIndex }"
        :aria-selected="idx === activeIndex"
        :aria-label="`Доказ ${idx + 1}: ${proof.name}`"
        :data-index="idx"
        @click="goTo(idx)"
      >
        <img :src="proof.url" alt="" loading="lazy" draggable="false">
        <span class="proof-lightbox__thumb-index">{{ pad(idx + 1) }}</span>
      </button>
    </div>

    <template #footer>
      <div class="proof-lightbox__foot">
        <span class="proof-lightbox__file" :title="activeProof?.name">
          <PhFileImage :size="14" weight="bold" aria-hidden="true" />
          <span class="truncate">{{ activeProof?.name || '—' }}</span>
        </span>

        <div class="proof-lightbox__foot-right">
          <span class="proof-lightbox__hint" aria-hidden="true">
            <template v-if="hasMany">
              <kbd>←</kbd><kbd>→</kbd> перемикати ·
            </template>
            клік — збільшити
          </span>
          <a
            v-if="activeProof"
            :href="activeProof.url"
            target="_blank"
            rel="noopener noreferrer"
            class="proof-lightbox__open"
          >
            Оригінал
            <PhArrowSquareOut :size="13" weight="bold" aria-hidden="true" />
          </a>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { PhX, PhCaretLeft, PhCaretRight, PhImageBroken, PhFileImage, PhArrowSquareOut } from '@phosphor-icons/vue'
import type { TMmrProof } from '@/views/players/mmr-requests.service'

const props = withDefaults(defineProps<{
  proofs: TMmrProof[]
  initialIndex?: number
}>(), {
  initialIndex: 0
})

const visible = defineModel<boolean>({ default: false })

const activeIndex = ref(0)
const filmstripRef = ref<HTMLElement | null>(null)

const hasMany = computed(() => props.proofs.length > 1)
const activeProof = computed<TMmrProof | undefined>(() => props.proofs[activeIndex.value])
const proofUrls = computed(() => props.proofs.map((p) => p.url))

const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
const transitionName = computed(() => (prefersReducedMotion.value ? 'proof-fade' : 'proof-swap'))

function pad (value: number): string {
  return String(value).padStart(2, '0')
}

function clampIndex (idx: number): number {
  const total = props.proofs.length
  if (!total) return 0
  return ((idx % total) + total) % total
}

function goTo (idx: number) {
  activeIndex.value = clampIndex(idx)
  nextTick(scrollActiveThumbIntoView)
}

function step (delta: number) {
  if (!hasMany.value) return
  goTo(activeIndex.value + delta)
}

function close () {
  visible.value = false
}

// Активна мініатюра завжди у видимій частині стрічки.
function scrollActiveThumbIntoView () {
  const strip = filmstripRef.value
  if (!strip) return
  const thumb = strip.querySelector<HTMLElement>(`[data-index="${activeIndex.value}"]`)
  thumb?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: prefersReducedMotion.value ? 'auto' : 'smooth' })
}

// Стрілки клавіатури працюють лише поки відкрито вікно і НЕ відкрито
// вбудований el-image-viewer (у нього власна навігація тими ж клавішами).
function isImageViewerOpen (): boolean {
  return Boolean(document.querySelector('.el-image-viewer__wrapper'))
}

onKeyStroke(['ArrowLeft', 'ArrowRight'], (e) => {
  if (!visible.value || isImageViewerOpen()) return
  e.preventDefault()
  step(e.key === 'ArrowLeft' ? -1 : 1)
})

// Кожне відкриття стартує з мініатюри, на яку клікнули в таблиці.
watch(visible, (open) => {
  if (open) activeIndex.value = clampIndex(props.initialIndex)
}, { immediate: true })
</script>

<!--
  Не scoped: el-dialog з append-to-body телепортується в <body>,
  тому scoped :deep() селектори не доходять до нього.
  Стилі прив'язані до унікального класу .proof-lightbox.
-->
<style lang="scss">
.el-dialog.proof-lightbox {
  margin: 0 auto;
  max-height: 94vh;
  background: rgba(10, 12, 22, 0.78);
  backdrop-filter: blur(24px) saturate(130%);
  -webkit-backdrop-filter: blur(24px) saturate(130%);

  .el-dialog__header {
    border-bottom: 1px solid rgba(var(--ds-primary-rgb), 0.12);
  }

  .el-dialog__body {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px !important;
    overflow: hidden;
  }

  .el-dialog__footer {
    border-top: 1px solid rgba(var(--ds-primary-rgb), 0.12);
    padding: 10px 16px 12px !important;
  }

  // Знімаємо нижній градієнт базового діалогу — він мутить стрічку мініатюр.
  &::after {
    display: none;
  }

  .proof-lightbox__close:focus-visible,
  .proof-lightbox__nav:focus-visible,
  .proof-lightbox__thumb:focus-visible,
  .proof-lightbox__open:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.6) !important;
    outline-offset: 2px;
  }
}

// ─── Шапка ──────────────────────────────────────────────────────────────────
.proof-lightbox__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.proof-lightbox__title {
  margin: 0;
  font-family: var(--ds-font-display);
  font-size: 20px;
  line-height: 1;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #fff;
}

.proof-lightbox__head-right {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}

// Лічильник у HUD-регістрі: поточний номер світиться, загальна кількість — тьмяна.
.proof-lightbox__counter {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  font-family: var(--ds-font-mono);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-faint);
}

.proof-lightbox__counter-current {
  font-size: 16px;
  color: var(--ds-primary);
  text-shadow: var(--ds-neon-text-subtle);
}

.proof-lightbox__counter-sep {
  color: rgba(255, 255, 255, 0.22);
}

.proof-lightbox__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: rgba(255, 255, 255, 0.55);
  cursor: pointer;
  transition: color var(--ds-duration-fast) ease, background-color var(--ds-duration-fast) ease,
    transform var(--ds-duration-press) var(--ds-ease-out);

  &:active {
    transform: scale(0.94);
  }
}

// ─── Сцена ──────────────────────────────────────────────────────────────────
// Висота прив'язана до вьюпорту: шапка + стрічка + футер ≈ 250px.
.proof-lightbox__stage {
  position: relative;
  height: clamp(280px, calc(94vh - 250px), 720px);
  overflow: hidden;
  border: 1px solid rgba(var(--ds-primary-rgb), 0.14);
  border-radius: 10px;
  background-color: #05060c;
  background-image:
    radial-gradient(ellipse at center, rgba(var(--ds-primary-rgb), 0.07) 0%, transparent 62%),
    linear-gradient(rgba(var(--ds-primary-rgb), 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(var(--ds-primary-rgb), 0.045) 1px, transparent 1px);
  background-size: 100% 100%, 32px 32px, 32px 32px;
  background-position: center, center, center;
  box-shadow: inset 0 0 80px rgba(0, 0, 0, 0.65);

  &.is-single {
    height: clamp(280px, calc(94vh - 180px), 760px);
  }
}

// Кутові маркери — рамка "кадру доказу".
.proof-lightbox__corner {
  position: absolute;
  width: 14px;
  height: 14px;
  pointer-events: none;
  border-color: rgba(var(--ds-primary-rgb), 0.55);
  border-style: solid;
  border-width: 0;
  z-index: 2;

  &.is-tl { top: 8px; left: 8px; border-top-width: 1px; border-left-width: 1px; }
  &.is-tr { top: 8px; right: 8px; border-top-width: 1px; border-right-width: 1px; }
  &.is-bl { bottom: 8px; left: 8px; border-bottom-width: 1px; border-left-width: 1px; }
  &.is-br { bottom: 8px; right: 8px; border-bottom-width: 1px; border-right-width: 1px; }
}

.proof-lightbox__frame {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  pointer-events: none;
}

.proof-lightbox__image {
  width: 100%;
  height: 100%;
  cursor: zoom-in;
  pointer-events: auto;
  filter: drop-shadow(0 12px 32px rgba(0, 0, 0, 0.6));

  .el-image__inner {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .el-image__wrapper,
  .el-image__placeholder,
  .el-image__error {
    background: transparent;
  }
}

.proof-lightbox__loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.proof-lightbox__loading-bar {
  width: 120px;
  height: 2px;
  overflow: hidden;
  border-radius: 1px;
  background: rgba(var(--ds-primary-rgb), 0.15);

  &::after {
    content: '';
    display: block;
    width: 40%;
    height: 100%;
    background: var(--ds-primary);
    box-shadow: var(--ds-glow-primary-soft);
    animation: proof-lightbox-scan 900ms var(--ds-ease-in-out) infinite alternate;
  }
}

@keyframes proof-lightbox-scan {
  from { transform: translateX(0); }
  to { transform: translateX(150%); }
}

.proof-lightbox__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-family: var(--ds-font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

// Стрілки: скляні кружки по краях сцени, підсвічуються на hover.
.proof-lightbox__nav {
  position: absolute;
  top: 50%;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid rgba(var(--ds-primary-rgb), 0.28);
  border-radius: 999px;
  background: rgba(7, 8, 15, 0.7);
  backdrop-filter: blur(8px);
  color: rgba(255, 255, 255, 0.78);
  cursor: pointer;
  transform: translateY(-50%);
  transition: color var(--ds-duration-fast) ease, border-color var(--ds-duration-fast) ease,
    box-shadow var(--ds-duration-fast) ease, transform var(--ds-duration-press) var(--ds-ease-out);

  &.is-prev { left: 12px; }
  &.is-next { right: 12px; }

  &:active {
    transform: translateY(-50%) scale(0.94);
  }
}

// ─── Перехід між кадрами ────────────────────────────────────────────────────
// Легкий blur маскує момент, коли два різні знімки накладаються.
.proof-swap-enter-active {
  transition: opacity 180ms var(--ds-ease-out), transform 180ms var(--ds-ease-out), filter 180ms var(--ds-ease-out);
}

.proof-swap-leave-active {
  transition: opacity 120ms ease, filter 120ms ease;
}

.proof-swap-enter-from {
  opacity: 0;
  transform: scale(0.985);
  filter: blur(6px);
}

.proof-swap-leave-to {
  opacity: 0;
  filter: blur(6px);
}

.proof-fade-enter-active,
.proof-fade-leave-active {
  transition: opacity 150ms ease;
}

.proof-fade-enter-from,
.proof-fade-leave-to {
  opacity: 0;
}

// ─── Стрічка мініатюр ───────────────────────────────────────────────────────
.proof-lightbox__filmstrip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 2px 4px;
  overflow-x: auto;
  scrollbar-width: none;
  scroll-snap-type: x proximity;

  &::-webkit-scrollbar {
    display: none;
  }
}

.proof-lightbox__thumb {
  position: relative;
  width: 84px;
  height: 48px;
  flex-shrink: 0;
  padding: 0;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  background: rgba(7, 8, 15, 0.6);
  cursor: pointer;
  scroll-snap-align: center;
  opacity: 0.5;
  transition: opacity var(--ds-duration-fast) ease, border-color var(--ds-duration-fast) ease,
    box-shadow var(--ds-duration-fast) ease, transform var(--ds-duration-press) var(--ds-ease-out);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &:active {
    transform: scale(0.96);
  }

  &.is-active {
    opacity: 1;
    border-color: rgba(var(--ds-primary-rgb), 0.85);
    box-shadow: var(--ds-glow-primary-soft), inset 0 0 0 1px rgba(var(--ds-primary-rgb), 0.35);
  }
}

.proof-lightbox__thumb-index {
  position: absolute;
  left: 5px;
  bottom: 4px;
  font-family: var(--ds-font-mono);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.12em;
  line-height: 1;
  color: var(--ds-primary);
  text-shadow: 0 0 6px rgba(7, 8, 15, 0.95), var(--ds-neon-text-subtle);
}

// ─── Футер ──────────────────────────────────────────────────────────────────
.proof-lightbox__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.proof-lightbox__file {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-family: var(--ds-font-mono);
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--ds-text-muted);

  svg {
    flex-shrink: 0;
    color: var(--ds-primary);
  }
}

.proof-lightbox__foot-right {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}

.proof-lightbox__hint {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ds-text-faint);

  kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 16px;
    height: 16px;
    padding: 0 3px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 3px;
    font: inherit;
    font-size: 9px;
    color: rgba(255, 255, 255, 0.7);
    background: rgba(255, 255, 255, 0.04);
  }
}

.proof-lightbox__open {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  border: 1px solid rgba(var(--ds-primary-rgb), 0.28);
  border-radius: var(--ds-control-radius-sm);
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--ds-primary);
  transition: border-color var(--ds-duration-fast) ease, box-shadow var(--ds-duration-fast) ease,
    background-color var(--ds-duration-fast) ease, transform var(--ds-duration-press) var(--ds-ease-out);

  &:active {
    transform: scale(0.96);
  }
}

// ─── Hover (лише для миші) ──────────────────────────────────────────────────
@media (hover: hover) and (pointer: fine) {
  .proof-lightbox__close:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.08);
  }

  .proof-lightbox__nav:hover {
    color: var(--ds-primary);
    border-color: rgba(var(--ds-primary-rgb), 0.7);
    box-shadow: var(--ds-glow-primary-soft);
  }

  .proof-lightbox__thumb:not(.is-active):hover {
    opacity: 0.85;
    border-color: rgba(var(--ds-primary-rgb), 0.4);
  }

  .proof-lightbox__open:hover {
    border-color: rgba(var(--ds-primary-rgb), 0.7);
    background: rgba(var(--ds-primary-rgb), 0.08);
    box-shadow: var(--ds-glow-primary-soft);
  }
}

// ─── Мобільний ──────────────────────────────────────────────────────────────
@media (max-width: 640px) {
  .el-dialog.proof-lightbox {
    width: calc(100vw - 16px) !important;

    .el-dialog__header,
    .el-dialog__body,
    .el-dialog__footer {
      padding-left: 12px !important;
      padding-right: 12px !important;
    }
  }

  .proof-lightbox__stage {
    height: clamp(220px, 52vh, 480px);

    &.is-single {
      height: clamp(220px, 60vh, 520px);
    }
  }

  .proof-lightbox__frame {
    padding: 10px;
  }

  .proof-lightbox__nav {
    width: 34px;
    height: 34px;

    &.is-prev { left: 8px; }
    &.is-next { right: 8px; }
  }

  .proof-lightbox__hint {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .proof-lightbox__loading-bar::after {
    animation: none;
    width: 100%;
    opacity: 0.6;
  }
}
</style>
