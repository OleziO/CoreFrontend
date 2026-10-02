import type { TChatSoundKind } from '@/features/chat/chat.d'

/** Загальна гучність: чат — фоновий сигнал, тихіший за фанфару дуелей. */
const MASTER_GAIN = 0.55
/** Пачка повідомлень в одному каналі дає один звук, а не кулеметну чергу. */
const THROTTLE_MS: Record<TChatSoundKind, number> = {
  general: 4_000,
  captains: 3_000,
  duel: 3_000,
  admin: 1_500,
  dm: 1_500,
  mention: 1_500
}
/** Ключ дедуплікації між вкладками браузера: кожна вкладка має свій сокет і отримує те саме. */
const LAST_SOUND_KEY = 'chat:sound-last'

interface IToneOptions {
  type: OscillatorType
  frequency: number
  startAt: number
  duration: number
  gain: number
  attack?: number
  slideTo?: number
  lowpass?: number
}

/**
 * Звуки нових повідомлень чату — синтез через Web Audio, без аудіофайлів.
 * Кожен тип каналу має впізнаваний підпис, щоб на слух розуміти, звідки повідомлення.
 *
 * Браузер дозволяє звук лише після жесту користувача: контекст створюється ліниво,
 * а `resume()` спрацьовує, щойно на сторінці був будь-який клік/тап.
 */
class ChatSoundService {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private readonly lastPlayed = new Map<TChatSoundKind, number>()

  /** Грає звук нового повідомлення з урахуванням тротлінгу й інших вкладок. */
  playIncoming (kind: TChatSoundKind, messageId: string) {
    const now = Date.now()
    if (now - (this.lastPlayed.get(kind) ?? 0) < THROTTLE_MS[kind]) return
    if (!this.claim(messageId)) return
    this.lastPlayed.set(kind, now)
    this.play(kind)
  }

  /** Прослухати звук з налаштувань — викликати з обробника кліку (він і розблоковує контекст). */
  preview (kind: TChatSoundKind) {
    this.play(kind)
  }

  /** Перша вкладка, що отримала повідомлення, «забирає» його — інші мовчать. */
  private claim (messageId: string): boolean {
    try {
      if (localStorage.getItem(LAST_SOUND_KEY) === messageId) return false
      localStorage.setItem(LAST_SOUND_KEY, messageId)
    } catch {
      // сховище недоступне — граємо без дедуплікації
    }
    return true
  }

  private getContext (): AudioContext | null {
    if (this.context) return this.context
    if (typeof window === 'undefined') return null
    const legacy = (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    const Ctor = window.AudioContext ?? legacy
    if (!Ctor) return null
    this.context = new Ctor()

    const limiter = this.context.createDynamicsCompressor()
    limiter.threshold.value = -12
    limiter.ratio.value = 12
    limiter.attack.value = 0.002
    limiter.release.value = 0.15

    this.master = this.context.createGain()
    this.master.gain.value = MASTER_GAIN
    this.master.connect(limiter)
    limiter.connect(this.context.destination)
    return this.context
  }

  private play (kind: TChatSoundKind) {
    const ctx = this.getContext()
    if (!ctx) return
    const run = () => {
      const out = this.master
      if (!out || ctx.state !== 'running') return
      SOUNDS[kind](ctx, out, ctx.currentTime + 0.01)
    }
    if (ctx.state === 'running') {
      run()
      return
    }
    ctx.resume().then(run).catch(() => { /* без жесту не дозволять */ })
  }
}

function tone (ctx: AudioContext, out: AudioNode, opts: IToneOptions) {
  const osc = ctx.createOscillator()
  const env = ctx.createGain()
  const filter = ctx.createBiquadFilter()
  const attack = opts.attack ?? 0.005

  osc.type = opts.type
  osc.frequency.setValueAtTime(opts.frequency, opts.startAt)
  if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, opts.startAt + opts.duration)

  filter.type = 'lowpass'
  filter.frequency.value = opts.lowpass ?? 6000

  env.gain.setValueAtTime(0.0001, opts.startAt)
  env.gain.exponentialRampToValueAtTime(opts.gain, opts.startAt + attack)
  env.gain.exponentialRampToValueAtTime(0.0001, opts.startAt + opts.duration)

  osc.connect(filter)
  filter.connect(env)
  env.connect(out)
  osc.start(opts.startAt)
  osc.stop(opts.startAt + opts.duration + 0.05)
}

/** Дзвіночок: основний тон + неграмонічні обертони, що згасають швидше. */
function bell (ctx: AudioContext, out: AudioNode, frequency: number, startAt: number, duration: number, gain: number) {
  tone(ctx, out, { type: 'sine', frequency, startAt, duration, gain })
  tone(ctx, out, { type: 'sine', frequency: frequency * 2.01, startAt, duration: duration * 0.6, gain: gain * 0.35 })
  tone(ctx, out, { type: 'sine', frequency: frequency * 3.02, startAt, duration: duration * 0.35, gain: gain * 0.15 })
}

type TSound = (ctx: AudioContext, out: AudioNode, t: number) => void

const SOUNDS: Record<TChatSoundKind, TSound> = {
  /** «Загальний» — мʼякий короткий «буль»: ненавʼязливий, бо канал найгаласливіший. */
  general: (ctx, out, t) => {
    tone(ctx, out, { type: 'sine', frequency: 520, slideTo: 880, startAt: t, duration: 0.12, gain: 0.45 })
    tone(ctx, out, { type: 'triangle', frequency: 1040, startAt: t, duration: 0.06, gain: 0.08 })
  },

  /** «Капітани» — швидке висхідне арпеджіо C-E-G, «командний» мотив. */
  captains: (ctx, out, t) => {
    const notes = [523.25, 659.25, 783.99]
    notes.forEach((frequency, i) => {
      const at = t + i * 0.075
      tone(ctx, out, { type: 'triangle', frequency, startAt: at, duration: 0.18, gain: 0.5, lowpass: 3500 })
      tone(ctx, out, { type: 'sine', frequency: frequency / 2, startAt: at, duration: 0.16, gain: 0.2 })
    })
  },

  /** «Дуелі» — металевий подвійний «дзень» клинків. */
  duel: (ctx, out, t) => {
    for (const [at, frequency] of [[t, 1480], [t + 0.085, 1760]] as const) {
      tone(ctx, out, { type: 'square', frequency, startAt: at, duration: 0.14, gain: 0.16, lowpass: 5000 })
      tone(ctx, out, { type: 'sine', frequency: frequency * 2.76, startAt: at, duration: 0.1, gain: 0.12 })
      tone(ctx, out, { type: 'triangle', frequency: frequency * 0.5, startAt: at, duration: 0.08, gain: 0.25 })
    }
  },

  /** «Адмін» / підтримка — спокійний, довгий дзвоник «до ресепшну». */
  admin: (ctx, out, t) => {
    bell(ctx, out, 987.77, t, 0.7, 0.5)
  },

  /** Приватне — класичне «дінь-дінь» угору: найвпізнаваніше, бо адресоване саме вам. */
  dm: (ctx, out, t) => {
    bell(ctx, out, 880, t, 0.22, 0.5)
    bell(ctx, out, 1318.51, t + 0.11, 0.35, 0.55)
  },

  /** Згадка — три наполегливі ноти, помітні навіть у галасливому каналі. */
  mention: (ctx, out, t) => {
    tone(ctx, out, { type: 'triangle', frequency: 1174.66, startAt: t, duration: 0.09, gain: 0.5 })
    tone(ctx, out, { type: 'triangle', frequency: 1174.66, startAt: t + 0.1, duration: 0.09, gain: 0.5 })
    bell(ctx, out, 1567.98, t + 0.2, 0.4, 0.55)
  }
}

export const chatSoundService = new ChatSoundService()
