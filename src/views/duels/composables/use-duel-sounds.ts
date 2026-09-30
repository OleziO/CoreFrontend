/**
 * Звуки дуелей у стилі Dota 2 ready-check: фанфара «Матч знайдено» та тікання таймера.
 * Усе синтезується через Web Audio — без аудіофайлів і без чужих семплів.
 *
 * Браузер дозволяє звук лише після жесту користувача, тож `AudioContext` створюється
 * і «розблоковується» на першому кліку/тапі (див. `unlock`). Клік «Стати в чергу» —
 * саме такий жест, тому до появи діалогу контекст уже готовий.
 * Контекст один на застосунок; composable лише дає до нього доступ.
 */

const STORAGE_KEY = 'duels:sound-muted'
/** Загальна гучність — сигнал має бути помітним, але не оглушливим. */
const MASTER_GAIN = 0.35
/** Останні секунди таймера тікають вище й гучніше — як у Dota. */
const URGENT_SECONDS = 5

let context: AudioContext | null = null
let master: GainNode | null = null

function getContext (): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (context) return context
  const legacy = (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  const Ctor = window.AudioContext ?? legacy
  if (!Ctor) return null
  context = new Ctor()
  master = context.createGain()
  master.gain.value = MASTER_GAIN
  master.connect(context.destination)
  return context
}

/** Один тон із ADSR-подібною обвідною через фільтр — будівельний блок обох звуків. */
function tone (
  ctx: AudioContext,
  out: AudioNode,
  opts: {
    type: OscillatorType
    frequency: number
    startAt: number
    duration: number
    gain: number
    attack?: number
    lowpass?: number
    slideTo?: number
  }
) {
  const osc = ctx.createOscillator()
  const env = ctx.createGain()
  const filter = ctx.createBiquadFilter()
  const attack = opts.attack ?? 0.01

  osc.type = opts.type
  osc.frequency.setValueAtTime(opts.frequency, opts.startAt)
  if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, opts.startAt + opts.duration)

  filter.type = 'lowpass'
  filter.frequency.value = opts.lowpass ?? 4000

  env.gain.setValueAtTime(0.0001, opts.startAt)
  env.gain.exponentialRampToValueAtTime(opts.gain, opts.startAt + attack)
  env.gain.exponentialRampToValueAtTime(0.0001, opts.startAt + opts.duration)

  osc.connect(filter)
  filter.connect(env)
  env.connect(out)
  osc.start(opts.startAt)
  osc.stop(opts.startAt + opts.duration + 0.05)
}

export const useDuelSounds = () => {
  const muted = useLocalStorage<boolean>(STORAGE_KEY, false)

  /** Створює/поновлює контекст. Викликати з обробника жесту користувача. */
  function unlock () {
    const ctx = getContext()
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => { /* без жесту не дозволять — спробуємо наступного разу */ })
    }
  }

  function ready (): AudioContext | null {
    if (muted.value) return null
    const ctx = getContext()
    if (!ctx || !master || ctx.state !== 'running') return null
    return ctx
  }

  /**
   * «Матч знайдено»: дві висхідні «мідні» ноти й акорд, що тримається близько секунди —
   * впізнаваний ready-check без копіювання семплів Valve.
   */
  function playMatchFound () {
    const ctx = ready()
    if (!ctx || !master) return
    const t = ctx.currentTime + 0.02

    // Два удари: G4 → C5, «мідь» = пилка через м'який фільтр.
    tone(ctx, master, { type: 'sawtooth', frequency: 392, startAt: t, duration: 0.28, gain: 0.5, attack: 0.015, lowpass: 2200 })
    tone(ctx, master, { type: 'sawtooth', frequency: 523.25, startAt: t + 0.22, duration: 0.32, gain: 0.55, attack: 0.015, lowpass: 2600 })

    // Акорд C-мажор, що затухає — «сяйво» після удару.
    const chordAt = t + 0.5
    for (const [frequency, gain] of [[523.25, 0.32], [659.25, 0.24], [783.99, 0.2], [1046.5, 0.1]] as const) {
      tone(ctx, master, { type: 'triangle', frequency, startAt: chordAt, duration: 1.3, gain, attack: 0.03, lowpass: 5000 })
    }
    // Низький «підклад» — відчуття ваги удару.
    tone(ctx, master, { type: 'sine', frequency: 130.81, startAt: t, duration: 0.9, gain: 0.35, attack: 0.02 })
  }

  /** Короткий «тік» таймера; останні секунди — вище й наполегливіше. */
  function playTick (secondsLeft: number) {
    const ctx = ready()
    if (!ctx || !master) return
    const urgent = secondsLeft <= URGENT_SECONDS
    const t = ctx.currentTime + 0.005
    // Основний клац: сину сідає вниз по частоті — «дерев'яний» тік годинника.
    tone(ctx, master, {
      type: 'sine',
      frequency: urgent ? 1760 : 1320,
      slideTo: urgent ? 880 : 660,
      startAt: t,
      duration: urgent ? 0.09 : 0.06,
      gain: urgent ? 0.5 : 0.28,
      attack: 0.002
    })
    // Верхня «іскра» — робить тік чутним поверх музики/гри.
    tone(ctx, master, {
      type: 'square',
      frequency: urgent ? 3520 : 2640,
      startAt: t,
      duration: 0.02,
      gain: urgent ? 0.12 : 0.06,
      attack: 0.001,
      lowpass: 8000
    })
  }

  function toggleMuted () {
    muted.value = !muted.value
    if (!muted.value) unlock()
  }

  return { muted, unlock, playMatchFound, playTick, toggleMuted }
}
