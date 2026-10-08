<template>
  <!-- Поле 8×8: фішки позиціонуються transform-ом за (рядок, колонка) і ключуються за id, тож падіння
       й обміни анімуються самим CSS-переходом; нові фішки «падають» згори власною анімацією. -->
  <div
    ref="boardEl"
    class="m3-board"
    :class="{ 'is-shuffling': shuffling, 'is-laguna': skillMode === 'laguna', 'is-blink': skillMode === 'blink' }"
    role="grid"
    :aria-label="`Поле ${MATCH3_SIZE}×${MATCH3_SIZE}`"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="drag = null"
    @pointerleave="onPointerLeave"
    @keydown="onKeydown"
  >
    <span
      v-if="skillMode === 'laguna' && hoverRow !== null"
      class="m3-board__row-aim"
      :style="{ '--r': hoverRow }"
      aria-hidden="true"
    />

    <button
      v-for="tile in tiles"
      :key="tile.cell.id"
      type="button"
      class="m3-tile"
      :class="tileClass(tile)"
      :style="tileStyle(tile)"
      :data-pos="`${tile.r}-${tile.c}`"
      :tabindex="tile.r === focusPos[0] && tile.c === focusPos[1] ? 0 : -1"
      :aria-label="tileLabel(tile)"
      :aria-disabled="disabled"
      @pointerdown="onPointerDown($event, [tile.r, tile.c])"
      @pointerenter="hoverRow = tile.r"
      @focus="focusPos = [tile.r, tile.c]"
    >
      <span class="m3-tile__inner">
        <template v-if="tile.cell.special === 'aegis'">
          <PhShieldStar class="m3-tile__aegis" weight="fill" aria-hidden="true" />
        </template>
        <template v-else>
          <img
            v-if="skinOf(tile.cell.kind)?.imageUrl && !broken.has(tile.cell.kind)"
            :src="skinOf(tile.cell.kind)?.imageUrl"
            alt=""
            class="m3-tile__img"
            draggable="false"
            @error="onImageError(tile.cell.kind)"
          >
          <span v-else class="m3-tile__letter" aria-hidden="true">{{ skinOf(tile.cell.kind)?.name.charAt(0) }}</span>
          <span v-if="tile.cell.special !== 'none'" class="m3-tile__badge" aria-hidden="true">
            <PhArrowsLeftRight v-if="tile.cell.special === 'row'" weight="bold" />
            <PhArrowsDownUp v-else-if="tile.cell.special === 'col'" weight="bold" />
            <PhFlame v-else weight="fill" />
          </span>
        </template>
      </span>
    </button>

    <span
      v-for="popup in popups"
      :key="popup.id"
      class="m3-popup"
      :class="{ 'm3-popup--big': popup.big }"
      :style="{ left: `${popup.x * 100}%`, top: `${popup.y * 100}%` }"
      aria-hidden="true"
    >
      {{ popup.text }}
    </span>

    <slot />
  </div>
</template>

<script setup lang="ts">
import { PhArrowsDownUp, PhArrowsLeftRight, PhFlame, PhShieldStar } from '@phosphor-icons/vue'
import { MATCH3_SIZE } from '@/features/match3/match3-engine.utils'
import type { IMatch3Cell, TMatch3Board, TMatch3Pos, TMatch3Skill } from '@/features/match3/match3-engine.utils'
import { MATCH3_KIND_TONES } from '@/features/match3/match3.utils'
import type { IMatch3HeroSkin, IMatch3Popup, TMatch3Hint } from '@/features/match3/match3.d'

interface ITile {
  cell: IMatch3Cell
  r: number
  c: number
}

const props = defineProps<{
  board: TMatch3Board
  skins: IMatch3HeroSkin[]
  clearing: Set<number>
  created: Set<number>
  drops: Record<number, number>
  invalid: Set<number>
  selected: TMatch3Pos | null
  hint: TMatch3Hint | null
  skillMode: Exclude<TMatch3Skill, 'refresher'> | null
  shuffling: boolean
  popups: IMatch3Popup[]
  disabled: boolean
}>()

const emit = defineEmits<{
  tap: [pos: TMatch3Pos]
  swap: [from: TMatch3Pos, to: TMatch3Pos]
}>()

const SPECIAL_LABELS: Record<IMatch3Cell['special'], string> = {
  none: '',
  row: ', лінія по рядку',
  col: ', лінія по колонці',
  bomb: ', бомба',
  aegis: ''
}

const boardEl = ref<HTMLElement | null>(null)
const focusPos = ref<TMatch3Pos>([0, 0])
const hoverRow = ref<number | null>(null)
const broken = ref(new Set<number>())
const drag = ref<{ pos: TMatch3Pos; x: number; y: number; moved: boolean } | null>(null)

const tiles = computed<ITile[]>(() =>
  props.board.flatMap((row, r) => row.map((cell, c) => ({ cell, r, c })))
)

const skinOf = (kind: number): IMatch3HeroSkin | undefined => props.skins[kind]

const isAt = (pos: TMatch3Pos | null | undefined, r: number, c: number) => !!pos && pos[0] === r && pos[1] === c

function tileClass ({ cell, r, c }: ITile) {
  return {
    'is-new': props.drops[cell.id] !== undefined,
    'is-clearing': props.clearing.has(cell.id),
    'is-created': props.created.has(cell.id),
    'is-invalid': props.invalid.has(cell.id),
    'is-selected': isAt(props.selected, r, c),
    'is-hint': !!props.hint && (isAt(props.hint[0], r, c) || isAt(props.hint[1], r, c)),
    'is-special': cell.special !== 'none',
    'is-aegis': cell.special === 'aegis'
  }
}

function tileStyle ({ cell, r, c }: ITile) {
  return {
    '--r': r,
    '--c': c,
    '--drop': props.drops[cell.id] ?? 0,
    '--tone': cell.kind >= 0 ? MATCH3_KIND_TONES[cell.kind] : 'var(--ds-gold-rgb)'
  }
}

function tileLabel ({ cell, r, c }: ITile): string {
  const name = cell.special === 'aegis' ? 'Aegis' : (skinOf(cell.kind)?.name ?? 'Герой')
  return `${name}${SPECIAL_LABELS[cell.special]}, рядок ${r + 1}, колонка ${c + 1}`
}

function onImageError (kind: number) {
  broken.value = new Set(broken.value).add(kind)
}

// ─── Свайп / тап ────────────────────────────────────────────────────────────
function onPointerDown (event: PointerEvent, pos: TMatch3Pos) {
  if (props.disabled || event.button > 0) return
  drag.value = { pos, x: event.clientX, y: event.clientY, moved: false }
}

function onPointerMove (event: PointerEvent) {
  const current = drag.value
  if (!current || current.moved || !boardEl.value) return
  const dx = event.clientX - current.x
  const dy = event.clientY - current.y
  const threshold = (boardEl.value.clientWidth / MATCH3_SIZE) * 0.35
  if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return
  current.moved = true
  const [r, c] = current.pos
  const to: TMatch3Pos = Math.abs(dx) > Math.abs(dy) ? [r, c + Math.sign(dx)] : [r + Math.sign(dy), c]
  if (to[0] >= 0 && to[0] < MATCH3_SIZE && to[1] >= 0 && to[1] < MATCH3_SIZE) emit('swap', current.pos, to)
}

function onPointerUp () {
  if (drag.value && !drag.value.moved) emit('tap', drag.value.pos)
  drag.value = null
}

function onPointerLeave () {
  drag.value = null
  hoverRow.value = null
}

// ─── Клавіатура: стрілки рухають фокус, Enter / пробіл — як тап ──────────────
const KEY_DELTAS: Record<string, TMatch3Pos> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1]
}

function onKeydown (event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    if (!props.disabled) emit('tap', [...focusPos.value])
    return
  }
  const delta = KEY_DELTAS[event.key]
  if (!delta) return
  event.preventDefault()
  const r = Math.min(MATCH3_SIZE - 1, Math.max(0, focusPos.value[0] + delta[0]))
  const c = Math.min(MATCH3_SIZE - 1, Math.max(0, focusPos.value[1] + delta[1]))
  focusPos.value = [r, c]
  hoverRow.value = r
  boardEl.value?.querySelector<HTMLElement>(`[data-pos="${r}-${c}"]`)?.focus()
}
</script>

<style scoped>
.m3-board {
  --gap: 3px;

  position: relative;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 16px;
  border: 1px solid rgba(var(--ds-primary-rgb), 0.22);
  background:
    linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px) 0 0 / 12.5% 12.5%,
    linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px) 0 0 / 12.5% 12.5%,
    radial-gradient(ellipse at 50% 0%, rgba(var(--ds-primary-rgb), 0.1), transparent 70%),
    rgba(6, 8, 18, 0.85);
  box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.55);
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.m3-board.is-blink {
  border-color: rgba(56, 189, 248, 0.6);
  box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.55), 0 0 22px rgba(56, 189, 248, 0.2);
}

.m3-board.is-laguna {
  border-color: rgba(251, 146, 60, 0.6);
  box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.55), 0 0 22px rgba(251, 146, 60, 0.2);
}

.m3-board__row-aim {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 12.5%;
  transform: translateY(calc(var(--r) * 100%));
  border-radius: 10px;
  background: linear-gradient(90deg, rgba(251, 146, 60, 0), rgba(251, 146, 60, 0.35), rgba(251, 146, 60, 0));
  box-shadow: 0 0 18px rgba(251, 146, 60, 0.45);
  pointer-events: none;
  transition: transform var(--ds-duration-fast) ease;
}

/* ─── Фішка ─────────────────────────────────────────────────────────────── */
.m3-tile {
  position: absolute;
  top: 0;
  left: 0;
  width: 12.5%;
  height: 12.5%;
  margin: 0;
  padding: var(--gap);
  border: 0;
  background: none;
  cursor: pointer;
  transform: translate(calc(var(--c) * 100%), calc(var(--r) * 100%));
  transition: transform 260ms cubic-bezier(0.3, 1.25, 0.55, 1);
  -webkit-tap-highlight-color: transparent;
}

.m3-tile[aria-disabled="true"] {
  cursor: default;
}

.m3-tile:focus-visible {
  outline: none;
}

.m3-tile:focus-visible .m3-tile__inner {
  outline: 2px solid #fff;
  outline-offset: 1px;
}

.is-shuffling .m3-tile {
  transition-duration: 450ms;
}

.m3-tile__inner {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 22%;
  border: 2px solid rgba(var(--tone), 0.85);
  background: linear-gradient(160deg, rgba(var(--tone), 0.28), rgba(8, 10, 20, 0.95));
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.45), inset 0 0 0 1px rgba(0, 0, 0, 0.35);
  transition: transform var(--ds-duration-fast) var(--ds-ease-out), box-shadow var(--ds-duration-fast) ease;
}

.m3-tile__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 30%;
  transform: scale(1.35);
  pointer-events: none;
}

.m3-tile__letter {
  font-family: var(--ds-font-display);
  font-size: clamp(14px, 3.4vw, 22px);
  color: rgb(var(--tone));
}

/* Спецфішки: значок у куті + світіння обідка */
.m3-tile.is-special .m3-tile__inner {
  border-color: rgb(var(--tone));
  box-shadow: 0 0 10px rgba(var(--tone), 0.65), inset 0 0 10px rgba(var(--tone), 0.35);
}

.m3-tile__badge {
  position: absolute;
  right: 2px;
  bottom: 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42%;
  height: 42%;
  border-radius: 9999px;
  background: rgba(var(--tone), 0.95);
  color: #0b0d18;
  font-size: clamp(9px, 2vw, 14px);
  box-shadow: 0 0 8px rgba(var(--tone), 0.9);
}

.m3-tile.is-aegis .m3-tile__inner {
  border-color: var(--ds-gold);
  background: radial-gradient(circle at 50% 40%, rgba(var(--ds-gold-rgb), 0.55), rgba(40, 24, 4, 0.95) 75%);
}

.m3-tile__aegis {
  width: 64%;
  height: 64%;
  color: var(--ds-gold);
  filter: drop-shadow(0 0 6px rgba(var(--ds-gold-rgb), 0.9));
}

.m3-tile.is-selected .m3-tile__inner {
  transform: scale(1.08);
  border-color: #fff;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.35), 0 0 16px rgba(var(--tone), 0.9);
}

@media (hover: hover) and (pointer: fine) {
  .m3-tile:not([aria-disabled="true"]):hover .m3-tile__inner {
    transform: scale(1.05);
  }
}

/* ─── Рух ───────────────────────────────────────────────────────────────── */
.m3-tile.is-new .m3-tile__inner {
  animation: m3-drop 300ms cubic-bezier(0.45, 0, 0.75, 1) both;
}

.m3-tile.is-clearing .m3-tile__inner {
  animation: m3-clear 260ms var(--ds-ease-out) forwards;
}

.m3-tile.is-created .m3-tile__inner {
  animation: m3-created 420ms var(--ds-ease-out);
}

.m3-tile.is-invalid .m3-tile__inner {
  animation: m3-shake 320ms ease;
}

.m3-tile.is-hint .m3-tile__inner {
  animation: m3-hint 1.1s ease-in-out infinite;
}

.m3-popup {
  position: absolute;
  z-index: 3;
  transform: translate(-50%, -50%);
  font-family: var(--ds-font-mono);
  font-size: 15px;
  font-weight: 800;
  white-space: nowrap;
  color: #fff;
  text-shadow: 0 0 8px rgba(var(--ds-primary-rgb), 0.9), 0 2px 4px rgba(0, 0, 0, 0.8);
  pointer-events: none;
  animation: m3-popup 900ms var(--ds-ease-out) forwards;
}

.m3-popup--big {
  font-size: 20px;
  color: var(--ds-gold);
  text-shadow: 0 0 10px rgba(var(--ds-gold-rgb), 0.9), 0 2px 4px rgba(0, 0, 0, 0.8);
}

@keyframes m3-drop {
  from {
    transform: translateY(calc(var(--drop) * -112%));
  }
}

@keyframes m3-clear {
  40% {
    transform: scale(1.15);
    filter: brightness(1.8);
    opacity: 1;
  }

  100% {
    transform: scale(0.2);
    filter: brightness(2.2);
    opacity: 0;
  }
}

@keyframes m3-created {
  0% {
    transform: scale(0.6);
    filter: brightness(2);
  }

  60% {
    transform: scale(1.12);
  }
}

@keyframes m3-shake {
  20%,
  60% {
    transform: translateX(-10%);
  }

  40%,
  80% {
    transform: translateX(10%);
  }
}

@keyframes m3-hint {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 rgba(255, 255, 255, 0);
  }

  50% {
    transform: scale(1.08);
    box-shadow: 0 0 14px rgba(255, 255, 255, 0.7);
  }
}

@keyframes m3-popup {
  0% {
    opacity: 0;
    transform: translate(-50%, -30%) scale(0.7);
  }

  20% {
    opacity: 1;
    transform: translate(-50%, -60%) scale(1.1);
  }

  100% {
    opacity: 0;
    transform: translate(-50%, -160%) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .m3-tile {
    transition-duration: 90ms;
  }

  .m3-tile.is-hint .m3-tile__inner {
    animation: none;
    box-shadow: 0 0 0 2px #fff;
  }

  .m3-tile.is-new .m3-tile__inner,
  .m3-tile.is-created .m3-tile__inner,
  .m3-tile.is-invalid .m3-tile__inner {
    animation-duration: 1ms;
  }
}
</style>
