import { io, type Socket } from 'socket.io-client'
import type { TChatMessage } from '@/api/types/api.types'
import type { IChatReadMarker, IChatSocketServerEvents, TChatAck } from '@/features/chat/chat.d'
import { ChatCommandError } from '@/features/chat/chat.utils'

type TCommand = (payload: object, ack: (res: TChatAck<Record<string, unknown>>) => void) => void

/** Події клієнт → сервер (дзеркало `CHAT_COMMANDS`); усі, крім набору, відповідають через ack. */
interface IChatSocketClientEvents {
  'chat:send': TCommand
  'chat:delete': TCommand
  'chat:read': TCommand
  'chat:watch-presence': TCommand
  'chat:typing': (payload: { channelKey: string }) => void
}

type TCommandName = Exclude<keyof IChatSocketClientEvents, 'chat:typing'>
type TChatSocket = Socket<IChatSocketServerEvents, IChatSocketClientEvents>
type TListener<E extends keyof IChatSocketServerEvents> = IChatSocketServerEvents[E]

const ACK_TIMEOUT_MS = 8_000

const debug = (...args: unknown[]): void => {
  if (import.meta.env.DEV) console.debug('[chat-socket]', ...args)
}

/**
 * Реалтайм-канал чату: `<API>/chat` через socket.io. На відміну від сокетів дуелей і сповіщень
 * токен необовʼязковий — гість підключається лише для читання «Загального». Команди
 * (надіслати, видалити, набір, прочитано, присутність) — через ack; історія — REST.
 * Підписки переживають перепідключення: слухачі тримаються тут, а не на інстансі сокета.
 */
class ChatSocketService {
  private socket: TChatSocket | null = null
  private token: string | null = null
  private readonly listeners = new Map<keyof IChatSocketServerEvents, Set<(...args: never[]) => void>>()
  private readonly connectionListeners = new Set<(connected: boolean) => void>()

  get isConnected (): boolean {
    return this.socket?.connected ?? false
  }

  /** Підключитися гостем (`null`) або з токеном; зміна токена перепідключає. */
  connect (token: string | null): void {
    if (this.socket && this.token === token) {
      if (!this.socket.connected) this.socket.connect()
      return
    }
    this.disconnect()
    this.token = token

    const socket: TChatSocket = io(`${import.meta.env.VITE_API_PUBLIC_URL}/chat`, {
      auth: token ? { token } : {},
      // Той самий порядок транспортів, що й у сокетів дуелей і сповіщень: проксі не пропускає Upgrade одразу.
      transports: ['polling', 'websocket'],
      reconnectionDelayMax: 10_000
    })

    socket.on('connect', () => {
      debug('connected', socket.id)
      this.connectionListeners.forEach(listener => listener(true))
    })
    socket.on('disconnect', (reason) => {
      debug('disconnected:', reason)
      this.connectionListeners.forEach(listener => listener(false))
    })
    socket.on('connect_error', (err) => {
      debug('connect_error:', err.message)
    })
    socket.onAny((event: keyof IChatSocketServerEvents, ...args: unknown[]) => {
      this.listeners.get(event)?.forEach(cb => (cb as (...a: unknown[]) => void)(...args))
    })

    this.socket = socket
  }

  disconnect (): void {
    const socket = this.socket
    this.socket = null
    this.token = null
    if (!socket) return
    socket.removeAllListeners()
    socket.disconnect()
    this.connectionListeners.forEach(listener => listener(false))
  }

  on<E extends keyof IChatSocketServerEvents> (event: E, cb: TListener<E>): () => void {
    let set = this.listeners.get(event)
    if (!set) {
      set = new Set()
      this.listeners.set(event, set)
    }
    set.add(cb as (...args: never[]) => void)
    return () => set.delete(cb as (...args: never[]) => void)
  }

  onConnection (cb: (connected: boolean) => void): () => void {
    this.connectionListeners.add(cb)
    return () => this.connectionListeners.delete(cb)
  }

  // ─── команди ──────────────────────────────────────────────────────────────

  async send (channelKey: string, body: string, mentions: string[]): Promise<TChatMessage> {
    const res = await this.command<{ message: TChatMessage }>('chat:send', { channelKey, body, mentions })
    return res.message
  }

  async remove (messageId: string): Promise<void> {
    await this.command('chat:delete', { messageId })
  }

  async markRead (channelKey: string, upTo?: string): Promise<IChatReadMarker> {
    return await this.command<IChatReadMarker>('chat:read', { channelKey, upTo })
  }

  /** Подія набору — без очікування відповіді: втрата не критична. */
  typing (channelKey: string): void {
    this.socket?.emit('chat:typing', { channelKey })
  }

  /** Замінює список гравців, чию присутність стежимо; відповідь — хто з них онлайн зараз. */
  async watchPresence (playerIds: string[]): Promise<string[]> {
    const res = await this.command<{ online: string[] }>('chat:watch-presence', { playerIds })
    return res.online
  }

  private async command<T extends object = object> (event: TCommandName, payload: object): Promise<T> {
    const socket = this.socket
    if (!socket?.connected) throw new ChatCommandError('offline', 'Немає зʼєднання з чатом — спробуйте за мить')
    let res: TChatAck<T>
    try {
      res = await socket.timeout(ACK_TIMEOUT_MS).emitWithAck(event, payload) as unknown as TChatAck<T>
    } catch {
      throw new ChatCommandError('timeout', 'Сервер чату не відповів — спробуйте ще раз')
    }
    if (!res.ok) throw new ChatCommandError(res.error, res.message)
    return res
  }
}

export const chatSocketService = new ChatSocketService()
