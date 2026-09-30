import { io, type Socket } from 'socket.io-client'
import type { TDuelStatus } from '@/api/types/api.types'

/** Події сервер → клієнт (дзеркало `DuelsGateway` на бекенді). */
interface IDuelSocketServerEvents {
  'duel:status': (status: TDuelStatus) => void
  'duel:error': (payload: { error: string }) => void
}

type TDuelSocket = Socket<IDuelSocketServerEvents>

/** Діагностика сокета лише в dev-збірці (`npm run dev`): у проді консоль мовчить. */
const debug = (...args: unknown[]): void => {
  if (import.meta.env.DEV) console.debug('[duels-socket]', ...args)
}

type TDuelSocketListeners = {
  status: Set<(status: TDuelStatus) => void>
  connection: Set<(connected: boolean) => void>
}

/**
 * Реалтайм-канал 1v1 ліги: `<API>/duels` через socket.io з тим самим bearer-токеном,
 * що й REST. Сервер сам шле `duel:status` при підключенні та після кожної зміни
 * (черга, дуель, боти); поки сокет живий, бекенд тримає гравця в черзі без полінгу.
 * Сервіс лише тримає з'єднання і роздає події — оркестрація в `useDuelSocket`.
 */
class DuelsSocketService {
  private socket: TDuelSocket | null = null
  private readonly listeners: TDuelSocketListeners = {
    status: new Set(),
    connection: new Set()
  }

  get isConnected (): boolean {
    return this.socket?.connected ?? false
  }

  /** Відкриває з'єднання з токеном (повторний виклик з іншим токеном перепідключає). */
  connect (token: string): void {
    if (this.socket) {
      const current = (this.socket.auth as { token?: string }).token
      if (current === token) {
        if (!this.socket.connected) this.socket.connect()
        return
      }
      this.disconnect()
    }

    const socket: TDuelSocket = io(`${import.meta.env.VITE_API_PUBLIC_URL}/duels`, {
      auth: { token },
      // Спершу long-polling, потім апгрейд до WebSocket. Саме в такому порядку: проксі перед API
      // не пропускає Upgrade (400), а з `['websocket', 'polling']` клієнт 4.8 НЕ переходить на polling
      // після невдалого WebSocket — з'єднання просто ніколи не встановлюється.
      transports: ['polling', 'websocket'],
      reconnectionDelayMax: 10_000
    })

    socket.on('connect', () => {
      debug('connected', socket.id, 'via', socket.io.engine.transport.name)
      socket.io.engine.once('upgrade', () => debug('transport upgraded to', socket.io.engine.transport.name))
      this.emitConnection(true)
    })
    socket.on('disconnect', (reason) => {
      debug('disconnected:', reason)
      this.emitConnection(false)
    })
    socket.on('connect_error', (err) => {
      debug('connect_error:', err.message)
    })
    socket.on('duel:status', (status) => {
      debug('duel:status', {
        rating: status.rating.rating,
        inQueue: !!status.queue,
        playersInQueue: status.queue?.playersInQueue ?? null,
        activeDuel: status.activeDuel ? `${status.activeDuel.id} ${status.activeDuel.state}` : null,
        bots: `${status.bots.online}/${status.bots.total}`
      })
      this.listeners.status.forEach((cb) => cb(status))
    })
    socket.on('duel:error', ({ error }) => {
      debug('duel:error', error)
      // Невалідний/протухлий токен: сервер сам розриває з'єднання, не намагаємось знову.
      if (error === 'unauthorized') this.disconnect()
    })

    this.socket = socket
  }

  disconnect (): void {
    const socket = this.socket
    this.socket = null
    if (!socket) return
    socket.removeAllListeners()
    socket.disconnect()
    this.emitConnection(false)
  }

  onStatus (cb: (status: TDuelStatus) => void): () => void {
    this.listeners.status.add(cb)
    return () => this.listeners.status.delete(cb)
  }

  onConnection (cb: (connected: boolean) => void): () => void {
    this.listeners.connection.add(cb)
    return () => this.listeners.connection.delete(cb)
  }

  private emitConnection (connected: boolean): void {
    this.listeners.connection.forEach((cb) => cb(connected))
  }
}

export const duelsSocketService = new DuelsSocketService()
