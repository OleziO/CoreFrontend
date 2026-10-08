<template>
  <!-- Поле 8×8: фішки позиціонуються transform-ом за (рядок, колонка) і ключуються за id, тож обміни й
       падіння анімуються CSS-переходом. Крива й тривалість залежать від фази (`phase-*` на полі), падіння —
       ще й від відстані (`--fall`); нові фішки «падають» з-над поля власною анімацією (`--drop`). -->
  <div
    ref="boardEl"
    class="m3-board"
    :class="[`phase-${phase}`, {
      'is-laguna': skillMode === 'laguna',
      'is-blink': skillMode === 'blink',
      'is-dragging': !!drag?.axis
    }]"
    :style="timingVars"
    role="grid"
    :aria-label="`Поле ${MATCH3_SIZE}×${MATCH3_SIZE}`"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="drag = null"
    @pointerleave="hoverRow = null"
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
            v-if="iconOf(tile.cell.kind)"
            :src="iconOf(tile.cell.kind)"
            alt=""
            class="m3-tile__img"
            draggable="false"
            @error="onImageError(tile.cell.kind, $event)"
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
import { MATCH3_KIND_TONES, MATCH3_STEP_MS } from '@/features/match3/match3.utils'
import type { IMatch3HeroSkin, IMatch3Popup, TMatch3Hint } from '@/features/match3/match3.d'
import type { TMatch3Phase } from '@/features/match3/composables/use-match3-game'

interface ITile {
  cell: IMatch3Cell
  r: number
  c: number
}

/** Перетягування фішки: вона йде за пальцем уздовж однієї осі (не далі за сусідню клітинку). */
interface IDrag {
  pos: TMatch3Pos
  x: number
  y: number
  axis: 'h' | 'v' | null
  /** Зсув уздовж осі, px. */
  offset: number
}

const props = defineProps<{
  board: TMatch3Board
  skins: IMatch3HeroSkin[]
  phase: TMatch3Phase
  clearing: Set<number>
  created: Set<number>
  drops: Record<number, number>
  selected: TMatch3Pos | null
  hint: TMatch3Hint | null
  skillMode: Exclude<TMatch3Skill, 'refresher'> | null
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
/** Скільки пікселів треба протягнути, щоб це був свайп, а не тап. */
const DRAG_START_PX = 6
/** Яку частку клітинки треба протягнути, щоб обмін відбувся (інакше фішка пружинить назад). */
const SWAP_AT = 0.4

const boardEl = ref<HTMLElement | null>(null)
const focusPos = ref<TMatch3Pos>([0, 0])
const hoverRow = ref<number | null>(null)
/** Скільки джерел іконки вже не завантажилось для типу: 0 — Stratz, 1 — Steam, 2 — літера. */
const failures = ref<Record<number, number>>({})
const drag = ref<IDrag | null>(null)

/** Тривалості фаз — ті самі числа, на які чекає composable. */
const timingVars = {
  '--swap-ms': `${MATCH3_STEP_MS.swap}ms`,
  '--revert-ms': `${MATCH3_STEP_MS.revert}ms`,
  '--clear-ms': `${MATCH3_STEP_MS.clear}ms`,
  '--fall-base': `${MATCH3_STEP_MS.fallBase}ms`,
  '--fall-row': `${MATCH3_STEP_MS.fallPerRow}ms`,
  '--shuffle-ms': `${MATCH3_STEP_MS.shuffle}ms`,
  '--popup-ms': `${MATCH3_STEP_MS.popup}ms`
}

const tiles = computed<ITile[]>(() =>
  props.board.flatMap((row, r) => row.map((cell, c) => ({ cell, r, c })))
)

/**
 * Рядок кожної фішки на попередньому кадрі — щоб падіння на 1 рядок і на 6 тривали по-різному.
 * Оновлюється після рендера, тож під час рендера нового кадру тут ще старі позиції.
 */
let previousRows = new Map<number, number>()
watch(() => props.board, (board) => {
  const rows = new Map<number, number>()
  board.forEach((row, r) => row.forEach((cell) => rows.set(cell.id, r)))
  previousRows = rows
}, { flush: 'post', immediate: true })

const skinOf = (kind: number): IMatch3HeroSkin | undefined => props.skins[kind]

const isAt = (pos: TMatch3Pos | null | undefined, r: number, c: number) => !!pos && pos[0] === r && pos[1] === c

/** Сусідня клітинка, з якою зараз міняємось при перетягуванні (або null). */
const dragTarget = computed<TMatch3Pos | null>(() => {
  const current = drag.value
  if (!current?.axis || current.offset === 0) return null
  const dir = Math.sign(current.offset)
  const [r, c] = current.pos
  const target: TMatch3Pos = current.axis === 'h' ? [r, c + dir] : [r + dir, c]
  return inBounds(target) ? target : null
})

function inBounds ([r, c]: TMatch3Pos): boolean {
  return r >= 0 && r < MATCH3_SIZE && c >= 0 && c < MATCH3_SIZE
}

function tileClass ({ cell, r, c }: ITile) {
  const dragged = !!drag.value?.axis && isAt(drag.value.pos, r, c)
  return {
    'is-new': props.drops[cell.id] !== undefined,
    'is-clearing': props.clearing.has(cell.id),
    'is-created': props.created.has(cell.id),
    'is-selected': isAt(props.selected, r, c),
    'is-hint': !!props.hint && (isAt(props.hint[0], r, c) || isAt(props.hint[1], r, c)),
    'is-special': cell.special !== 'none',
    'is-aegis': cell.special === 'aegis',
    'is-held': dragged,
    'is-pushed': isAt(dragTarget.value, r, c)
  }
}

function tileStyle ({ cell, r, c }: ITile) {
  const previous = previousRows.get(cell.id)
  const style: Record<string, string | number> = {
    '--r': r,
    '--c': c,
    '--fall': previous === undefined ? 0 : Math.max(0, r - previous),
    '--drop': props.drops[cell.id] ?? 0,
    '--tone': cell.kind >= 0 ? MATCH3_KIND_TONES[cell.kind] : 'var(--ds-gold-rgb)'
  }
  const current = drag.value
  if (current?.axis) {
    // Фішка під пальцем іде за ним, сусідня — назустріч
    const offset = isAt(current.pos, r, c) ? current.offset : isAt(dragTarget.value, r, c) ? -current.offset : 0
    if (offset) style[current.axis === 'h' ? '--dx' : '--dy'] = `${offset}px`
  }
  return style
}

function tileLabel ({ cell, r, c }: ITile): string {
  const name = cell.special === 'aegis' ? 'Aegis' : (skinOf(cell.kind)?.name ?? 'Герой')
  return `${name}${SPECIAL_LABELS[cell.special]}, рядок ${r + 1}, колонка ${c + 1}`
}

function iconOf (kind: number): string {
  const skin = skinOf(kind)
  if (!skin) return ''
  const failed = failures.value[kind] ?? 0
  if (failed === 0) return skin.imageUrl || skin.fallbackUrl
  return failed === 1 ? skin.fallbackUrl : ''
}

function onImageError (kind: number, event: Event) {
  // Кілька фішок одного типу падають разом — рахуємо помилку лише для поточного джерела
  const current = iconOf(kind)
  if (!current || (event.target as HTMLImageElement).getAttribute('src') !== current) return
  failures.value = { ...failures.value, [kind]: (failures.value[kind] ?? 0) + 1 }
}

// ─── Перетягування / тап ────────────────────────────────────────────────────
function onPointerDown (event: PointerEvent, pos: TMatch3Pos) {
  if (props.disabled || event.button > 0) return
  drag.value = { pos, x: event.clientX, y: event.clientY, axis: null, offset: 0 }
  // Захоплення: рух і відпускання доходять до поля, навіть якщо палець вийшов за його межі
  boardEl.value?.setPointerCapture?.(event.pointerId)
}

function onPointerMove (event: PointerEvent) {
  const current = drag.value
  if (!current || !boardEl.value) return
  const dx = event.clientX - current.x
  const dy = event.clientY - current.y
  if (!current.axis) {
    // Laguna цілиться в рядок — там перетягування не потрібне
    if (props.skillMode === 'laguna' || Math.max(Math.abs(dx), Math.abs(dy)) < DRAG_START_PX) return
    current.axis = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v'
  }
  const cell = boardEl.value.clientWidth / MATCH3_SIZE
  const raw = current.axis === 'h' ? dx : dy
  const [r, c] = current.pos
  const dir = Math.sign(raw)
  const target: TMatch3Pos = current.axis === 'h' ? [r, c + dir] : [r + dir, c]
  // За край поля фішка лише трохи «пружинить»
  const limited = inBounds(target) ? Math.max(-cell, Math.min(cell, raw)) : raw * 0.12
  drag.value = { ...current, offset: Math.round(limited) }
}

function onPointerUp () {
  const current = drag.value
  if (!current) return
  const target = dragTarget.value
  const cell = (boardEl.value?.clientWidth ?? 0) / MATCH3_SIZE
  drag.value = null
  if (!current.axis) {
    emit('tap', current.pos)
    return
  }
  // Недотягнули — фішки пружинять на місце (перехід фази idle)
  if (target && Math.abs(current.offset) >= cell * SWAP_AT) emit('swap', current.pos, target)
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
  /* Обмін: м'який ease-in-out без «перельоту»; падіння: розгін як під вагою і легке приземлення */
  --ease-swap: cubic-bezier(0.45, 0, 0.2, 1);
  --ease-fall: cubic-bezier(0.55, 0, 0.45, 1.08);

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
  transition: border-color 300ms ease, box-shadow 300ms ease;
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
  transition: transform 220ms var(--ease-swap);
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
  cursor: grab;
  transform: translate(
    calc(var(--c) * 100% + var(--dx, 0px)),
    calc(var(--r) * 100% + var(--dy, 0px))
  );
  /* idle: так фішка пружинить назад, якщо свайп не дотягнули */
  transition: transform var(--swap-ms) var(--ease-swap);
  -webkit-tap-highlight-color: transparent;
}

.phase-swap .m3-tile {
  transition: transform var(--swap-ms) var(--ease-swap);
}

.phase-revert .m3-tile {
  transition: transform var(--revert-ms) var(--ease-swap);
}

.phase-fall .m3-tile {
  transition: transform calc(var(--fall-base) + var(--fall) * var(--fall-row)) var(--ease-fall);
}

.phase-shuffle .m3-tile {
  transition: transform var(--shuffle-ms) cubic-bezier(0.65, 0, 0.35, 1);
}

/* Під пальцем — без переходу, щоб фішка йшла за рухом без запізнення */
.m3-tile.is-held,
.m3-tile.is-pushed {
  transition: none;
}

.m3-tile.is-held {
  z-index: 2;
  cursor: grabbing;
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
  /* «Самоцвіт» кольору типу: світла пляма згори + темний низ, іконка-голова по центру */
  background:
    radial-gradient(circle at 50% 30%, rgba(var(--tone), 0.55), transparent 62%),
    linear-gradient(180deg, rgba(var(--tone), 0.3), rgba(8, 10, 20, 0.95));
  box-shadow:
    0 2px 6px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    inset 0 -6px 10px rgba(0, 0, 0, 0.35);
  transition:
    transform 220ms var(--ease-swap),
    box-shadow 220ms ease,
    border-color 220ms ease;
}

/* Іконка 32 px — масштабуємо не більше ніж у ~2 рази, щоб лишалась чіткою */
.m3-tile__img {
  width: 78%;
  height: 78%;
  object-fit: contain;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.7));
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

.m3-tile.is-selected .m3-tile__inner,
.m3-tile.is-held .m3-tile__inner {
  transform: scale(1.08);
  border-color: #fff;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.35), 0 0 16px rgba(var(--tone), 0.9);
}

.m3-tile.is-held .m3-tile__inner {
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.35), 0 10px 20px rgba(0, 0, 0, 0.55), 0 0 18px rgba(var(--tone), 0.9);
}

@media (hover: hover) and (pointer: fine) {
  .m3-board:not(.is-dragging) .m3-tile:not([aria-disabled="true"]):hover .m3-tile__inner {
    transform: scale(1.05);
  }
}

/* ─── Рух ───────────────────────────────────────────────────────────────── */
.m3-tile.is-new .m3-tile__inner {
  animation: m3-drop calc(var(--fall-base) + var(--drop) * var(--fall-row)) var(--ease-fall) both;
}

.m3-tile.is-clearing .m3-tile__inner {
  animation: m3-clear var(--clear-ms) cubic-bezier(0.3, 0, 0.3, 1) forwards;
}

.m3-tile.is-created .m3-tile__inner {
  animation: m3-created 600ms cubic-bezier(0.3, 0, 0.3, 1);
}

.m3-tile.is-hint .m3-tile__inner {
  animation: m3-hint 1.6s ease-in-out infinite;
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
  animation: m3-popup var(--popup-ms) cubic-bezier(0.2, 0.7, 0.3, 1) forwards;
}

.m3-popup--big {
  font-size: 20px;
  color: var(--ds-gold);
  text-shadow: 0 0 10px rgba(var(--ds-gold-rgb), 0.9), 0 2px 4px rgba(0, 0, 0, 0.8);
}

@keyframes m3-drop {
  from {
    opacity: 0.4;
    transform: translateY(calc(var(--drop) * -112%));
  }

  30% {
    opacity: 1;
  }
}

@keyframes m3-clear {
  30% {
    transform: scale(1.16);
    filter: brightness(1.8);
    opacity: 1;
  }

  100% {
    transform: scale(0.15);
    filter: brightness(2.2);
    opacity: 0;
  }
}

@keyframes m3-created {
  0% {
    transform: scale(0.7);
    filter: brightness(2);
  }

  55% {
    transform: scale(1.12);
  }

  100% {
    transform: scale(1);
    filter: none;
  }
}

@keyframes m3-hint {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 rgba(255, 255, 255, 0);
  }

  50% {
    transform: scale(1.07);
    box-shadow: 0 0 14px rgba(255, 255, 255, 0.7);
  }
}

@keyframes m3-popup {
  0% {
    opacity: 0;
    transform: translate(-50%, -30%) scale(0.7);
  }

  18% {
    opacity: 1;
    transform: translate(-50%, -60%) scale(1.08);
  }

  70% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: translate(-50%, -150%) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .m3-board {
    --swap-ms: 110ms !important;
    --revert-ms: 100ms !important;
    --fall-base: 90ms !important;
    --fall-row: 25ms !important;
    --shuffle-ms: 240ms !important;
  }

  .m3-tile.is-hint .m3-tile__inner {
    animation: none;
    box-shadow: 0 0 0 2px #fff;
  }

  .m3-tile.is-created .m3-tile__inner {
    animation-duration: 1ms;
  }
}
</style>
