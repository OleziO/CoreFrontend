import { io, type Socket } from 'socket.io-client'
import type { TNotificationsSnapshot } from '@/api/types/api.types'

/** Події сервер → клієнт (дзеркало `NotificationsGateway` на бекенді). */
interface INotificationSocketServerEvents {
  'notification:snapshot': (snapshot: TNotificationsSnapshot) => void
  'notification:error': (payload: { error: string }) => void
}

type TNotificationSocket = Socket<INotificationSocketServerEvents>

const debug = (...args: unknown[]): void => {
  if (import.meta.env.DEV) console.debug('[notifications-socket]', ...args)
}

/**
 * Реалтайм-канал центру сповіщень: `<API>/notifications` через socket.io з тим самим
 * bearer-токеном, що й REST. Сервер шле повний знімок при підключенні та після кожної
 * зміни інбоксу. На відміну від сокета дуелей, побічних ефектів немає — з'єднання
 * живе весь час, поки користувач залогінений (керує `useNotificationsStore`).
 */
class NotificationsSocketService {
  private socket: TNotificationSocket | null = null
  private readonly snapshotListeners = new Set<(snapshot: TNotificationsSnapshot) => void>()
  private readonly connectionListeners = new Set<(connected: boolean) => void>()

  get isConnected (): boolean {
    return this.socket?.connected ?? false
  }

  connect (token: string): void {
    if (this.socket) {
      const current = (this.socket.auth as { token?: string }).token
      if (current === token) {
        if (!this.socket.connected) this.socket.connect()
        return
      }
      this.disconnect()
    }

    const socket: TNotificationSocket = io(`${import.meta.env.VITE_API_PUBLIC_URL}/notifications`, {
      auth: { token },
      // Той самий порядок транспортів, що й у сокета дуелей: проксі не пропускає Upgrade одразу.
      transports: ['polling', 'websocket'],
      reconnectionDelayMax: 10_000
    })

    socket.on('connect', () => {
      debug('connected', socket.id)
      this.emitConnection(true)
    })
    socket.on('disconnect', (reason) => {
      debug('disconnected:', reason)
      this.emitConnection(false)
    })
    socket.on('connect_error', (err) => {
      debug('connect_error:', err.message)
    })
    socket.on('notification:snapshot', (snapshot) => {
      debug('snapshot', { items: snapshot.items.length, unread: snapshot.unreadCount })
      this.snapshotListeners.forEach((cb) => cb(snapshot))
    })
    socket.on('notification:error', ({ error }) => {
      debug('error', error)
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

  private emitConnection (connected: boolean): void {
    this.connectionListeners.forEach((cb) => cb(connected))
  }

  onSnapshot (cb: (snapshot: TNotificationsSnapshot) => void): () => void {
    this.snapshotListeners.add(cb)
    return () => this.snapshotListeners.delete(cb)
  }

  onConnection (cb: (connected: boolean) => void): () => void {
    this.connectionListeners.add(cb)
    return () => this.connectionListeners.delete(cb)
  }
}

export const notificationsSocketService = new NotificationsSocketService()
