import { useQueryCache } from '@pinia/colada'
import { useAuthStore } from '@/store/modules/auth'
import { getApiErrorMessage } from '@/core/utils/api-errors'
import { match3Service } from '@/features/match3/match3.service'
import {
  MATCH3_ROUND_MS,
  MATCH3_SIZE,
  MATCH3_SKILL_COST,
  applyMatch3Action,
  cloneMatch3Board,
  createMatch3Game,
  findMatch3Hint,
  hasMatch3Move,
  isMatch3TimeUp
} from '@/features/match3/match3-engine.utils'
import type {
  IMatch3State,
  IMatch3Step,
  TMatch3Action,
  TMatch3Board,
  TMatch3Pos,
  TMatch3Skill
} from '@/features/match3/match3-engine.utils'
import {
  MATCH3_HINT_DELAY_MS,
  MATCH3_LEADERBOARD_QUERY_KEY,
  MATCH3_STEP_MS,
  match3FallMs
} from '@/features/match3/match3.utils'
import type { IMatch3HeroSkin, IMatch3Popup, TMatch3Hint } from '@/features/match3/match3.d'
import type { TMatch3RunResult, TMatch3RunStart } from '@/api/types/api.types'

type TMatch3Status = 'idle' | 'starting' | 'playing' | 'over'
/** Чому гра скінчилась: вийшов час, поле «мертве», або гравець завершив сам. */
export type TMatch3EndReason = 'time' | 'board' | 'manual'
/** Яка фаза анімації зараз грає — поле підбирає під неї криву й тривалість переходу. */
export type TMatch3Phase = 'idle' | 'swap' | 'revert' | 'clear' | 'fall' | 'shuffle'
type TTargetSkill = Exclude<TMatch3Skill, 'refresher'>
/** Дія без часу — `t` проставляє годинник гри в момент виконання. */
type TActionInput = {
  [K in TMatch3Action['type']]: Omit<Extract<TMatch3Action, { type: K }>, 't'>
}[TMatch3Action['type']]

const CLOCK_TICK_MS = 100

const areAdjacent = (a: TMatch3Pos, b: TMatch3Pos) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1
const randomSeed = () => Math.floor(Math.random() * 2 ** 31)

/**
 * Оркестратор однієї гри: рушій (джерело правди), годинник раунду, покадрове відтворення анімацій,
 * підказка після бездіяльності, навички, і запис забігу на сервер. Залогінений гравець грає
 * «рейтинговий» забіг (seed від сервера, сервер перераховує очки з журналу дій і звіряє час);
 * гість чи офлайн — просто грає.
 */
export function useMatch3Game (getSkins: () => IMatch3HeroSkin[]) {
  const authStore = useAuthStore()
  const queryCache = useQueryCache()
  const reducedMotion = usePreferredReducedMotion()

  let engine: IMatch3State | null = null
  const actions: TMatch3Action[] = []
  /** Покоління гри: анімації старої гри зупиняються, щойно почалась нова чи закрилась модалка. */
  let generation = 0
  let popupSeq = 0
  /** `performance.now()` моменту t = 0 (після вступної анімації). */
  let clockStart = 0

  const status = ref<TMatch3Status>('idle')
  const phase = ref<TMatch3Phase>('idle')
  const board = shallowRef<TMatch3Board>([])
  /** Іконки фіксуються на старті гри — дані OpenDota, що дійшли пізніше, не міняють фішки посеред гри. */
  const skins = shallowRef<IMatch3HeroSkin[]>([])
  const clearing = shallowRef<Set<number>>(new Set())
  const created = shallowRef<Set<number>>(new Set())
  const drops = shallowRef<Record<number, number>>({})
  const busy = ref(false)

  const selected = ref<TMatch3Pos | null>(null)
  const skillMode = ref<TTargetSkill | null>(null)
  const hint = ref<TMatch3Hint | null>(null)
  const popups = ref<IMatch3Popup[]>([])
  const chain = ref(0)

  const score = ref(0)
  const mana = ref(0)
  const bestChain = ref(0)
  const movesMade = ref(0)
  const hasMove = ref(true)

  /** Годинник: мс від старту раунду і поточний дедлайн (росте з бонусами). */
  const elapsedMs = ref(0)
  const deadlineMs = ref(MATCH3_ROUND_MS)
  const timeLeftMs = computed(() => Math.max(0, deadlineMs.value - elapsedMs.value))
  /** Останній бонус часу — для спливаючого «+2 с» біля таймера. */
  const timeBonus = ref<{ id: number; ms: number } | null>(null)

  const run = ref<TMatch3RunStart | null>(null)
  /** Гра без запису в таблицю: гість або сервер не видав забіг. */
  const offline = ref(false)
  const submitting = ref(false)
  const result = ref<TMatch3RunResult | null>(null)
  const submitError = ref<string | null>(null)
  const endReason = ref<TMatch3EndReason | null>(null)

  const isPlaying = computed(() => status.value === 'playing')
  /** Ходів на полі немає, але мани вистачає на навичку — рушій ще не завершив гру. */
  const isStuck = computed(() => isPlaying.value && !busy.value && !hasMove.value)

  const { start: startHintTimer, stop: stopHintTimer } = useTimeoutFn(() => {
    if (isPlaying.value && !busy.value && engine) hint.value = findMatch3Hint(engine.board)
  }, MATCH3_HINT_DELAY_MS, { immediate: false })

  // Час іде й під час анімацій (як у Blitz); якщо він вийшов посеред каскаду — гра закінчиться після нього
  const clock = useIntervalFn(() => {
    if (!isPlaying.value) return
    elapsedMs.value = currentT()
    if (timeLeftMs.value <= 0 && !busy.value) finish('time')
  }, CLOCK_TICK_MS, { immediate: false })

  function currentT (): number {
    return Math.max(0, Math.round(performance.now() - clockStart))
  }

  function restartHintTimer () {
    hint.value = null
    stopHintTimer()
    if (isPlaying.value) startHintTimer()
  }

  function scaled (ms: number): number {
    return reducedMotion.value === 'reduce' ? Math.round(ms * 0.35) : ms
  }

  function wait (ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, scaled(ms)))
  }

  function syncStats () {
    if (!engine) return
    score.value = engine.score
    mana.value = engine.mana
    bestChain.value = engine.bestChain
    movesMade.value = engine.movesMade
    deadlineMs.value = engine.deadlineMs
    hasMove.value = hasMatch3Move(engine.board)
  }

  function resetVisuals () {
    phase.value = 'idle'
    clearing.value = new Set()
    created.value = new Set()
    drops.value = {}
    selected.value = null
    skillMode.value = null
    hint.value = null
    popups.value = []
    chain.value = 0
    timeBonus.value = null
  }

  async function start () {
    const current = ++generation
    stopHintTimer()
    clock.pause()
    status.value = 'starting'
    busy.value = false
    resetVisuals()
    actions.length = 0
    run.value = null
    result.value = null
    submitError.value = null
    endReason.value = null
    elapsedMs.value = 0
    deadlineMs.value = MATCH3_ROUND_MS
    skins.value = getSkins().slice()

    let seed = randomSeed()
    offline.value = !authStore.isLoggedIn
    if (authStore.isLoggedIn) {
      try {
        run.value = await match3Service.startRun()
        seed = run.value.seed
      } catch {
        offline.value = true
      }
    }
    if (current !== generation) return

    engine = createMatch3Game(seed)
    syncStats()

    // Перше поле «сиплеться» згори; годинник рушає, коли фішки впали
    const introMs = scaled(match3FallMs(MATCH3_SIZE))
    phase.value = 'fall'
    drops.value = Object.fromEntries(engine.board.flat().map((cell) => [cell.id, MATCH3_SIZE]))
    board.value = cloneMatch3Board(engine.board)
    busy.value = true
    status.value = 'playing'
    clockStart = performance.now() + introMs
    clock.resume()
    await wait(match3FallMs(MATCH3_SIZE))
    if (current !== generation) return
    busy.value = false
    phase.value = 'idle'
    drops.value = {}
    restartHintTimer()
  }

  function positionsOf (step: IMatch3Step, ids: Set<number>): TMatch3Pos[] {
    const positions: TMatch3Pos[] = []
    step.board.forEach((row, r) => row.forEach((cell, c) => {
      if (ids.has(cell.id)) positions.push([r, c])
    }))
    return positions
  }

  function addPopup (step: IMatch3Step, ids: Set<number>) {
    const positions = positionsOf(step, ids)
    if (!positions.length || step.gained <= 0) return
    const x = positions.reduce((sum, [, c]) => sum + c + 0.5, 0) / positions.length / MATCH3_SIZE
    const y = positions.reduce((sum, [r]) => sum + r + 0.5, 0) / positions.length / MATCH3_SIZE
    const id = ++popupSeq
    const text = step.chain > 1 ? `+${step.gained} ×${step.chain}` : `+${step.gained}`
    popups.value = [...popups.value, { id, text, x, y, big: step.gained >= 300 || step.chain >= 3 }]
    setTimeout(() => {
      popups.value = popups.value.filter((popup) => popup.id !== id)
    }, MATCH3_STEP_MS.popup)
  }

  function showTimeBonus (ms: number) {
    const id = ++popupSeq
    timeBonus.value = { id, ms }
    setTimeout(() => {
      if (timeBonus.value?.id === id) timeBonus.value = null
    }, MATCH3_STEP_MS.popup)
  }

  async function playStep (step: IMatch3Step) {
    phase.value = step.kind
    switch (step.kind) {
      case 'swap':
        board.value = step.board
        await wait(MATCH3_STEP_MS.swap)
        break
      case 'clear': {
        const cleared = new Set(step.cleared)
        board.value = step.board
        clearing.value = cleared
        created.value = new Set(step.created)
        score.value += step.gained
        chain.value = step.chain
        addPopup(step, cleared)
        await wait(MATCH3_STEP_MS.clear)
        break
      }
      case 'fall': {
        clearing.value = new Set()
        drops.value = step.drops
        board.value = step.board
        // Найдовше падіння — у нових фішок: вони падають з-над поля на всю глибину порожнечі
        await wait(match3FallMs(Math.max(0, ...Object.values(step.drops))))
        break
      }
      case 'shuffle':
        board.value = step.board
        await wait(MATCH3_STEP_MS.shuffle)
        break
    }
  }

  /** Невдалий обмін: фішки міняються місцями й повертаються назад. */
  async function revertSwap (from: TMatch3Pos, to: TMatch3Pos) {
    const original = board.value
    const swapped = cloneMatch3Board(original)
    const tmp = swapped[from[0]][from[1]]
    swapped[from[0]][from[1]] = swapped[to[0]][to[1]]
    swapped[to[0]][to[1]] = tmp
    busy.value = true
    phase.value = 'revert'
    board.value = swapped
    await wait(MATCH3_STEP_MS.revert)
    board.value = original
    await wait(MATCH3_STEP_MS.revert)
    phase.value = 'idle'
    busy.value = false
  }

  async function perform (input: TActionInput): Promise<boolean> {
    if (!engine || busy.value || !isPlaying.value) return false
    const current = generation
    hint.value = null
    stopHintTimer()

    const t = currentT()
    if (isMatch3TimeUp(engine, t)) {
      await finish('time')
      return false
    }
    const action = { ...input, t } as TMatch3Action
    const manaBefore = engine.mana
    const outcome = applyMatch3Action(engine, action)
    if (!outcome.ok) {
      if (action.type === 'swap') await revertSwap(action.from, action.to)
      restartHintTimer()
      return false
    }

    actions.push(action)
    selected.value = null
    skillMode.value = null
    busy.value = true
    drops.value = {}
    if (action.type !== 'swap') mana.value = manaBefore - MATCH3_SKILL_COST[action.type]
    if (outcome.timeEarned > 0) {
      deadlineMs.value = engine.deadlineMs
      showTimeBonus(outcome.timeEarned)
    }

    for (const step of outcome.steps) {
      if (current !== generation) return true
      await playStep(step)
    }
    if (current !== generation) return true

    phase.value = 'idle'
    busy.value = false
    created.value = new Set()
    chain.value = 0
    syncStats()
    elapsedMs.value = currentT()
    if (engine.over) await finish('board')
    else if (timeLeftMs.value <= 0) await finish('time')
    else restartHintTimer()
    return true
  }

  /** Тап / клік по фішці: виділення, обмін із сусідньою або ціль навички. */
  function tap (pos: TMatch3Pos) {
    if (busy.value || !isPlaying.value) return
    restartHintTimer()
    if (skillMode.value === 'laguna') {
      perform({ type: 'laguna', row: pos[0] })
      return
    }
    const current = selected.value
    if (!current) {
      selected.value = pos
      return
    }
    if (current[0] === pos[0] && current[1] === pos[1]) {
      selected.value = null
      return
    }
    if (areAdjacent(current, pos)) {
      swap(current, pos)
      return
    }
    selected.value = pos
  }

  /** Обмін (свайп або два тапи). У режимі Blink — безкоштовний обмін за ману. */
  function swap (from: TMatch3Pos, to: TMatch3Pos) {
    if (!areAdjacent(from, to)) return
    selected.value = null
    perform({ type: skillMode.value === 'blink' ? 'blink' : 'swap', from, to })
  }

  function canUseSkill (skill: TMatch3Skill): boolean {
    return isPlaying.value && !busy.value && mana.value >= MATCH3_SKILL_COST[skill]
  }

  function toggleSkill (skill: TMatch3Skill) {
    if (!canUseSkill(skill)) return
    restartHintTimer()
    selected.value = null
    if (skill === 'refresher') {
      skillMode.value = null
      perform({ type: 'refresher' })
      return
    }
    skillMode.value = skillMode.value === skill ? null : skill
  }

  /** Кінець гри: вийшов час, поле «мертве» або гравець завершив сам. Забіг із ходами записується на сервер. */
  async function finish (reason: TMatch3EndReason = 'manual') {
    if (status.value === 'over') return
    status.value = 'over'
    endReason.value = reason
    clock.pause()
    if (reason === 'time') elapsedMs.value = deadlineMs.value
    stopHintTimer()
    hint.value = null
    selected.value = null
    skillMode.value = null

    const pending = run.value
    run.value = null
    if (!pending || !actions.length) return
    submitting.value = true
    try {
      result.value = await match3Service.finishRun(pending.id, [...actions])
      queryCache.invalidateQueries({ key: [...MATCH3_LEADERBOARD_QUERY_KEY] }).catch(() => { /* тихо */ })
    } catch (e) {
      submitError.value = getApiErrorMessage(e, 'Не вдалося записати результат')
    } finally {
      submitting.value = false
    }
  }

  /** Модалка закривається (або знайшовся матч): зупиняємо анімації, зігране — зараховуємо. */
  function leave () {
    generation++
    busy.value = false
    phase.value = 'idle'
    clock.pause()
    if (isPlaying.value) finish('manual')
  }

  onScopeDispose(() => {
    generation++
    stopHintTimer()
    clock.pause()
  })

  return {
    status,
    phase,
    board,
    skins,
    clearing,
    created,
    drops,
    busy,
    selected,
    skillMode,
    hint,
    popups,
    chain,
    score,
    mana,
    bestChain,
    movesMade,
    timeLeftMs,
    timeBonus,
    isPlaying,
    isStuck,
    offline,
    submitting,
    result,
    submitError,
    endReason,
    start,
    tap,
    swap,
    toggleSkill,
    canUseSkill,
    finish,
    leave
  }
}
