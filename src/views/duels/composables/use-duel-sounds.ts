/**
 * Звуки дуелей у стилі Dota 2 ready-check: фанфара «Матч знайдено» та тікання таймера.
 * Усе синтезується через Web Audio — без аудіофайлів і без чужих семплів.
 *
 * Браузер дозволяє звук лише після жесту користувача, тож `AudioContext` створюється
 * і «розблоковується» на першому кліку/тапі (див. `unlock`). Клік «Стати в чергу» —
 * саме такий жест, тому до появи діалогу контекст уже готовий.
 * Контекст один на застосунок; composable лише дає до нього доступ.
 *
 * Гучність: сигнал має пробиватися крізь гру, музику й Discord, тому шини йдуть у
 * компресор-лімітер — це дозволяє задерти рівень нот, не зриваючись у хрип на піках.
 */

const STORAGE_KEY = 'duels:sound-muted'
/** Загальна гучність шини (після неї — лімітер, тож 1.0 безпечно). */
const MASTER_GAIN = 1
/** Фанфара «Матч знайдено» — головний сигнал, найгучніша. */
const FANFARE_GAIN = 1
/** Тікання таймера — помітно тихіше за фанфару, щоб не дратувати. */
const TICK_GAIN = 0.5
/** Останні секунди таймера тікають вище й гучніше — як у Dota. */
const URGENT_SECONDS = 5

let context: AudioContext | null = null
let fanfareBus: GainNode | null = null
let tickBus: GainNode | null = null
let noiseBuffer: AudioBuffer | null = null

function getContext (): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (context) return context
  const legacy = (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  const Ctor = window.AudioContext ?? legacy
  if (!Ctor) return null
  context = new Ctor()

  // Лімітер: жорстке коліно, швидка атака — зрізає лише піки, не «дихає» на тлі.
  const limiter = context.createDynamicsCompressor()
  limiter.threshold.value = -10
  limiter.knee.value = 8
  limiter.ratio.value = 16
  limiter.attack.value = 0.002
  limiter.release.value = 0.18

  const master = context.createGain()
  master.gain.value = MASTER_GAIN
  master.connect(limiter)
  limiter.connect(context.destination)

  fanfareBus = context.createGain()
  fanfareBus.gain.value = FANFARE_GAIN
  fanfareBus.connect(master)

  tickBus = context.createGain()
  tickBus.gain.value = TICK_GAIN
  tickBus.connect(master)

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
    /** Розстроювання в центах — два трохи розстроєні пилки дають «мідну» товщину. */
    detune?: number
  }
) {
  const osc = ctx.createOscillator()
  const env = ctx.createGain()
  const filter = ctx.createBiquadFilter()
  const attack = opts.attack ?? 0.01

  osc.type = opts.type
  osc.frequency.setValueAtTime(opts.frequency, opts.startAt)
  if (opts.detune) osc.detune.value = opts.detune
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

/** Короткий шумовий «удар» через смуговий фільтр — дає фанфарі фізичний поштовх. */
function impact (ctx: AudioContext, out: AudioNode, startAt: number, gain: number) {
  if (!noiseBuffer) {
    noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.25), ctx.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }
  const source = ctx.createBufferSource()
  source.buffer = noiseBuffer

  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(1800, startAt)
  filter.frequency.exponentialRampToValueAtTime(300, startAt + 0.18)
  filter.Q.value = 0.8

  const env = ctx.createGain()
  env.gain.setValueAtTime(gain, startAt)
  env.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.2)

  source.connect(filter)
  filter.connect(env)
  env.connect(out)
  source.start(startAt)
  source.stop(startAt + 0.25)
}

/** «Мідний» удар: дві розстроєні пилки + октава нижче синусом — товстий, помітний тон. */
function brassHit (
  ctx: AudioContext,
  out: AudioNode,
  frequency: number,
  startAt: number,
  duration: number,
  gain: number
) {
  tone(ctx, out, { type: 'sawtooth', frequency, startAt, duration, gain, attack: 0.012, lowpass: 3200, detune: -6 })
  tone(ctx, out, { type: 'sawtooth', frequency, startAt, duration, gain, attack: 0.012, lowpass: 3200, detune: 6 })
  tone(ctx, out, { type: 'sine', frequency: frequency / 2, startAt, duration, gain: gain * 0.7, attack: 0.012 })
}

export const useDuelSounds = () => {
  const muted = useLocalStorage<boolean>(STORAGE_KEY, false)

  /** Створює/поновлює контекст. Викликати з обробника жесту користувача. */
  async function unlock (): Promise<void> {
    const ctx = getContext()
    if (ctx && ctx.state === 'suspended') {
      await ctx.resume().catch(() => { /* без жесту не дозволять — спробуємо наступного разу */ })
    }
  }

  /**
   * Запускає `play`, щойно контекст працює. Якщо він призупинений (сторінку перезавантажили
   * й ще не клікали) — пробуємо поновити: після будь-якого попереднього жесту браузер дозволить.
   */
  function withContext (play: (ctx: AudioContext) => void) {
    if (muted.value) return
    const ctx = getContext()
    if (!ctx) return
    if (ctx.state === 'running') {
      play(ctx)
      return
    }
    ctx.resume()
      .then(() => {
        if (ctx.state === 'running') play(ctx)
      })
      .catch(() => { /* без жесту не дозволять */ })
  }

  /**
   * «Матч знайдено»: удар, три висхідні «мідні» ноти й акорд, що тримається близько
   * півтори секунди — впізнаваний ready-check без копіювання семплів Valve.
   */
  function playMatchFound () {
    withContext((ctx) => {
      const out = fanfareBus
      if (!out) return
      const t = ctx.currentTime + 0.02

      // Фізичний поштовх на першому ударі.
      impact(ctx, out, t, 0.9)

      // Три удари: G4 → C5 → E5, кожен товстіший за попередній.
      brassHit(ctx, out, 392, t, 0.3, 0.9)
      brassHit(ctx, out, 523.25, t + 0.22, 0.34, 1)
      brassHit(ctx, out, 659.25, t + 0.46, 0.5, 1.05)
      impact(ctx, out, t + 0.46, 0.5)

      // Акорд C-мажор, що затухає — «сяйво» після удару.
      const chordAt = t + 0.7
      for (const [frequency, gain] of [[523.25, 0.7], [659.25, 0.55], [783.99, 0.45], [1046.5, 0.25]] as const) {
        tone(ctx, out, { type: 'triangle', frequency, startAt: chordAt, duration: 1.6, gain, attack: 0.03, lowpass: 5200 })
        tone(ctx, out, { type: 'sawtooth', frequency, startAt: chordAt, duration: 1.2, gain: gain * 0.35, attack: 0.05, lowpass: 2400 })
      }

      // Низький «підклад» — відчуття ваги: C2 + C3.
      tone(ctx, out, { type: 'sine', frequency: 65.41, startAt: t, duration: 1.4, gain: 1, attack: 0.02 })
      tone(ctx, out, { type: 'sine', frequency: 130.81, startAt: t, duration: 1.1, gain: 0.7, attack: 0.02 })
    })
  }

  /** Короткий «тік» таймера; останні секунди — вище й наполегливіше. */
  function playTick (secondsLeft: number) {
    withContext((ctx) => {
      const out = tickBus
      if (!out) return
      const urgent = secondsLeft <= URGENT_SECONDS
      const t = ctx.currentTime + 0.005
      // Основний клац: синус сідає вниз по частоті — «дерев'яний» тік годинника.
      tone(ctx, out, {
        type: 'sine',
        frequency: urgent ? 1760 : 1320,
        slideTo: urgent ? 880 : 660,
        startAt: t,
        duration: urgent ? 0.09 : 0.06,
        gain: urgent ? 0.9 : 0.5,
        attack: 0.002
      })
      // Верхня «іскра» — робить тік чутним поверх музики/гри.
      tone(ctx, out, {
        type: 'square',
        frequency: urgent ? 3520 : 2640,
        startAt: t,
        duration: 0.02,
        gain: urgent ? 0.22 : 0.1,
        attack: 0.001,
        lowpass: 8000
      })
    })
  }

  /** Прослухати фанфару (з жесту користувача — розблоковує контекст і одразу грає). */
  async function preview () {
    await unlock()
    playMatchFound()
  }

  /** Перемкнути звук; вмикання — жест, тож одразу даємо почути, як звучить сигнал. */
  async function toggleMuted () {
    muted.value = !muted.value
    if (!muted.value) await preview()
  }

  return { muted, unlock, playMatchFound, playTick, preview, toggleMuted }
}
