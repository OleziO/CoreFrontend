import { ElMessage } from 'element-plus'
import type { TChatAdminThread, TChatMessage, TChatPlayer } from '@/api/types/api.types'
import { chatService } from '@/features/chat/chat.service'
import { chatSocketService } from '@/features/chat/chat-socket.service'
import { chatSoundService } from '@/features/chat/chat-sound.service'
import {
  ChatCommandError,
  CHAT_TYPING_EMIT_MS,
  CHAT_TYPING_TTL_MS,
  adminThreadKey,
  channelKindOf,
  directKey,
  directPeerId,
  isPublicChannel,
  mentionsPlayer,
  mergeMessages
} from '@/features/chat/chat.utils'
import type {
  IChatAccess,
  IChatChannelState,
  IChatDirectTab,
  IChatPeerInput,
  IChatSoundSettings,
  IChatTyping,
  IChatUnreadSummary,
  TChatSoundKind,
  TChatTabId
} from '@/features/chat/chat.d'

const GUEST_ACCESS: IChatAccess = {
  playerId: null,
  isAdmin: false,
  canCaptains: false,
  canDuel: false,
  canVip: false,
  readOnly: true
}

const DEFAULT_SOUND_SETTINGS: IChatSoundSettings = {
  enabled: true,
  kinds: { general: true, captains: true, duel: true, vip: true, admin: true, dm: true, mention: true }
}

/** Затримка перед `chat:read`: не шлемо маркер на кожне повідомлення, що прилетіло під час читання. */
const READ_DEBOUNCE_MS = 400

interface IUnreadCounter {
  unread: number
  mentions: number
}

/** Бейдж вкладки: число (приватні, згадки, треди підтримки) або крапка (нове в публічному каналі). */
export interface IChatBadge {
  count: number
  dot: boolean
}

function toPeer (p: IChatPeerInput): TChatPlayer {
  return {
    id: p.id.toLowerCase(),
    discordName: p.discordName ?? null,
    discordUsername: p.discordUsername ?? null,
    avatarUrl: p.avatarUrl ?? null,
    isAdmin: false
  }
}

/**
 * Чат сайту: одне socket-зʼєднання на застосунок (гість — лише читання «Загального»),
 * історія каналів, вкладки (фіксовані + закривані приватні), непрочитане, присутність і «пише…».
 * Сервер — джерело правди для доступу (`chat:access`) і непрочитаного (`chat:unread`);
 * між знімками лічильники ростуть локально з кожним повідомленням.
 */
export const useChatStore = defineStore('chat', () => {
  const authStore = useAuthStore()
  const visibility = useDocumentVisibility()

  // ─── стан ──────────────────────────────────────────────────────────────────
  const connected = ref(false)
  const access = ref<IChatAccess>(GUEST_ACCESS)
  const channels = ref<Record<string, IChatChannelState>>({})
  const unread = ref<Record<string, IUnreadCounter>>({})
  const adminUnreadThreads = ref(new Set<string>())
  const adminThreads = ref<TChatAdminThread[]>([])
  const adminThreadsLoaded = ref(false)
  const adminThreadsLoading = ref(false)
  /** Відкритий тред підтримки в адмінській вкладці; `null` — список тредів. */
  const selectedAdminThread = ref<string | null>(null)
  const online = ref(new Set<string>())
  const typing = ref<Record<string, IChatTyping>>({})
  /** Чи прокручена стрічка каналу до низу — лише тоді вважаємо нові повідомлення прочитаними. */
  const atBottom = ref<Record<string, boolean>>({})

  const isOpen = useLocalStorage('chat:open', false)
  const activeTab = useLocalStorage<TChatTabId>('chat:active-tab', 'general')
  /** Відкриті приватні вкладки по id користувача — на спільному компʼютері в кожного свої. */
  const directTabsByUser = useLocalStorage<Record<string, IChatDirectTab[]>>('chat:dm-tabs', {})
  const soundSettings = useLocalStorage<IChatSoundSettings>('chat:sounds', DEFAULT_SOUND_SETTINGS, {
    mergeDefaults: (stored, defaults) => ({ ...defaults, ...stored, kinds: { ...defaults.kinds, ...stored.kinds } })
  })

  const selfId = computed(() => access.value.playerId)
  const isLoggedIn = computed(() => !!selfId.value)
  const isAdmin = computed(() => access.value.isAdmin)

  const directTabs = computed<IChatDirectTab[]>({
    get: () => (selfId.value ? directTabsByUser.value[selfId.value] ?? [] : []),
    set: (tabs) => {
      if (!selfId.value) return
      directTabsByUser.value = { ...directTabsByUser.value, [selfId.value]: tabs }
    }
  })

  const tabs = computed<TChatTabId[]>(() => {
    const list: TChatTabId[] = ['general']
    if (access.value.canCaptains) list.push('captains')
    if (access.value.canDuel) list.push('duel')
    if (access.value.canVip) list.push('vip')
    if (isLoggedIn.value) list.push('admin')
    for (const t of directTabs.value) list.push(t.channelKey as TChatTabId)
    return list
  })

  /** Активна вкладка з урахуванням доступу: втрачена (напр. «Капітани») падає на «Загальний». */
  const currentTab = computed<TChatTabId>(() => (tabs.value.includes(activeTab.value) ? activeTab.value : 'general'))

  /** Канал, який зараз показує панель; `null` — адмін дивиться список тредів. */
  const activeChannelKey = computed<string | null>(() => {
    const tab = currentTab.value
    if (tab !== 'admin') return tab
    if (!selfId.value) return null
    return isAdmin.value ? selectedAdminThread.value : adminThreadKey(selfId.value)
  })

  const activeChannel = computed<IChatChannelState | null>(() =>
    activeChannelKey.value ? channels.value[activeChannelKey.value] ?? null : null
  )

  function directTabOf (channelKey: string): IChatDirectTab | undefined {
    return directTabs.value.find(t => t.channelKey === channelKey)
  }

  // ─── непрочитане ───────────────────────────────────────────────────────────

  function isViewing (channelKey: string): boolean {
    return isOpen.value &&
      visibility.value === 'visible' &&
      activeChannelKey.value === channelKey &&
      atBottom.value[channelKey] !== false
  }

  function hasUnread (channelKey: string): boolean {
    return (unread.value[channelKey]?.unread ?? 0) > 0 ||
      adminUnreadThreads.value.has(channelKey) ||
      adminThreads.value.some(t => t.channelKey === channelKey && t.unread > 0)
  }

  function clearUnread (channelKey: string) {
    if (unread.value[channelKey]) unread.value[channelKey] = { unread: 0, mentions: 0 }
    adminUnreadThreads.value.delete(channelKey)
    const thread = adminThreads.value.find(t => t.channelKey === channelKey)
    if (thread) thread.unread = 0
  }

  function badgeOf (tab: TChatTabId): IChatBadge {
    if (tab === 'admin') {
      if (!selfId.value) return { count: 0, dot: false }
      if (isAdmin.value) return { count: adminUnreadThreads.value.size, dot: false }
      return { count: unread.value[adminThreadKey(selfId.value)]?.unread ?? 0, dot: false }
    }
    const counter = unread.value[tab]
    if (isPublicChannel(tab)) return { count: counter?.mentions ?? 0, dot: (counter?.unread ?? 0) > 0 }
    return { count: counter?.unread ?? 0, dot: false }
  }

  const totalBadge = computed<IChatBadge>(() => {
    let count = 0
    let dot = false
    for (const tab of tabs.value) {
      const badge = badgeOf(tab)
      count += badge.count
      dot = dot || badge.dot
    }
    return { count, dot }
  })

  const readTimers = new Map<string, ReturnType<typeof setTimeout>>()

  function scheduleRead (channelKey: string) {
    if (!isLoggedIn.value || readTimers.has(channelKey)) return
    readTimers.set(channelKey, setTimeout(() => {
      readTimers.delete(channelKey)
      if (!isViewing(channelKey)) return
      const last = channels.value[channelKey]?.messages.at(-1)
      clearUnread(channelKey)
      chatSocketService.markRead(channelKey, last?.createdAt).catch(() => {
        // тихо — наступний знімок `chat:unread` поверне правильний стан
      })
    }, READ_DEBOUNCE_MS))
  }

  function applyUnreadSummary (summary: IChatUnreadSummary) {
    const next: Record<string, IUnreadCounter> = {}
    for (const row of summary.channels) {
      next[row.channelKey] = { unread: row.unread, mentions: row.mentions }
      if (row.channelKind === 'dm' && row.peer && row.unread > 0) ensureDirectTab(row.channelKey, row.peer)
    }
    unread.value = next
    adminUnreadThreads.value = new Set(summary.adminUnreadThreadKeys)
    for (const thread of adminThreads.value) {
      if (!adminUnreadThreads.value.has(thread.channelKey)) thread.unread = 0
    }
    // Те, що користувач саме читає, не має світитися непрочитаним.
    if (activeChannelKey.value && hasUnread(activeChannelKey.value)) scheduleRead(activeChannelKey.value)
  }

  // ─── вкладки ───────────────────────────────────────────────────────────────

  function ensureDirectTab (channelKey: string, peer: TChatPlayer) {
    const existing = directTabOf(channelKey)
    if (existing) {
      if (existing.peer.avatarUrl !== peer.avatarUrl || existing.peer.discordName !== peer.discordName) {
        directTabs.value = directTabs.value.map(t => (t.channelKey === channelKey ? { channelKey, peer } : t))
      }
      return
    }
    directTabs.value = [...directTabs.value, { channelKey, peer }]
  }

  function selectTab (tab: TChatTabId) {
    activeTab.value = tab
    if (tab === 'admin' && isAdmin.value) loadAdminThreads()
  }

  function open (tab?: TChatTabId) {
    if (tab) selectTab(tab)
    isOpen.value = true
  }

  function close () {
    isOpen.value = false
  }

  function toggle () {
    isOpen.value = !isOpen.value
  }

  /** Приватний чат з гравцем: з профілю, списку друзів, імені автора або пошуку в панелі. */
  function openDirect (peerInput: IChatPeerInput) {
    if (!selfId.value) {
      ElMessage.info('Увійдіть, щоб писати гравцям')
      return
    }
    const peer = toPeer(peerInput)
    if (peer.id === selfId.value) return
    const key = directKey(selfId.value, peer.id)
    ensureDirectTab(key, peer)
    open(key as TChatTabId)
  }

  function closeDirect (channelKey: string) {
    directTabs.value = directTabs.value.filter(t => t.channelKey !== channelKey)
    if (activeTab.value === channelKey) activeTab.value = 'general'
  }

  function openAdminThread (channelKey: string | null) {
    selectedAdminThread.value = channelKey
  }

  // ─── історія ───────────────────────────────────────────────────────────────

  function channelState (channelKey: string): IChatChannelState {
    if (!channels.value[channelKey]) {
      channels.value[channelKey] = { messages: [], hasMore: false, loading: false, loaded: false }
    }
    return channels.value[channelKey]
  }

  async function loadChannel (channelKey: string, opts?: { refresh?: boolean }) {
    const state = channelState(channelKey)
    if (state.loading || (state.loaded && !opts?.refresh)) return
    state.loading = true
    try {
      const page = await chatService.fetchHistory(channelKey)
      state.messages = opts?.refresh ? mergeMessages(state.messages, page.items) : page.items
      if (!state.loaded) state.hasMore = page.hasMore
      state.loaded = true
    } catch {
      if (!state.loaded) ElMessage.error('Не вдалося завантажити повідомлення')
    } finally {
      state.loading = false
    }
  }

  async function loadOlder (channelKey: string) {
    const state = channelState(channelKey)
    const first = state.messages[0]
    if (state.loading || !state.hasMore || !first) return
    state.loading = true
    try {
      const page = await chatService.fetchHistory(channelKey, first.createdAt)
      state.messages = mergeMessages(state.messages, page.items)
      state.hasMore = page.hasMore
    } catch {
      ElMessage.error('Не вдалося завантажити старіші повідомлення')
    } finally {
      state.loading = false
    }
  }

  async function loadAdminThreads (opts?: { refresh?: boolean }) {
    if (!isAdmin.value || adminThreadsLoading.value || (adminThreadsLoaded.value && !opts?.refresh)) return
    adminThreadsLoading.value = true
    try {
      adminThreads.value = await chatService.fetchAdminThreads()
      adminThreadsLoaded.value = true
    } catch {
      ElMessage.error('Не вдалося завантажити звернення')
    } finally {
      adminThreadsLoading.value = false
    }
  }

  function setAtBottom (channelKey: string, value: boolean) {
    atBottom.value[channelKey] = value
  }

  // ─── дії ───────────────────────────────────────────────────────────────────

  async function send (channelKey: string, body: string, mentions: string[] = []): Promise<boolean> {
    try {
      applyMessage(await chatSocketService.send(channelKey, body, mentions))
      return true
    } catch (err) {
      ElMessage.error(err instanceof ChatCommandError ? err.message : 'Не вдалося надіслати повідомлення')
      return false
    }
  }

  async function removeMessage (messageId: string): Promise<void> {
    try {
      await chatSocketService.remove(messageId)
    } catch (err) {
      ElMessage.error(err instanceof ChatCommandError ? err.message : 'Не вдалося видалити повідомлення')
    }
  }

  /** Чернетки по каналах: поле вводу перемонтовується з кожною вкладкою, текст лишається. */
  const drafts = new Map<string, string>()

  function draftOf (channelKey: string): string {
    return drafts.get(channelKey) ?? ''
  }

  function saveDraft (channelKey: string, text: string) {
    if (text) drafts.set(channelKey, text)
    else drafts.delete(channelKey)
  }

  const lastTypingEmit = new Map<string, number>()

  /** «Пише…» лише в приватних каналах і тредах підтримки; не частіше раз на 2 с. */
  function notifyTyping (channelKey: string) {
    if (!isLoggedIn.value || isPublicChannel(channelKindOf(channelKey))) return
    const now = Date.now()
    if (now - (lastTypingEmit.get(channelKey) ?? 0) < CHAT_TYPING_EMIT_MS) return
    lastTypingEmit.set(channelKey, now)
    chatSocketService.typing(channelKey)
  }

  // ─── звуки ─────────────────────────────────────────────────────────────────

  /** Згадка звучить своїм сигналом поверх звуку каналу — навіть якщо канал приглушено. */
  function soundKindOf (m: TChatMessage): TChatSoundKind | null {
    const { kinds } = soundSettings.value
    if (kinds.mention && mentionsPlayer(m, selfId.value)) return 'mention'
    return kinds[m.channelKind] ? m.channelKind : null
  }

  function playIncomingSound (m: TChatMessage) {
    if (!soundSettings.value.enabled) return
    const kind = soundKindOf(m)
    if (kind) chatSoundService.playIncoming(kind, m.id)
  }

  function setSoundEnabled (enabled: boolean) {
    soundSettings.value = { ...soundSettings.value, enabled }
  }

  function setSoundKind (kind: TChatSoundKind, enabled: boolean) {
    soundSettings.value = { ...soundSettings.value, kinds: { ...soundSettings.value.kinds, [kind]: enabled } }
    if (enabled) chatSoundService.preview(kind)
  }

  function previewSound (kind: TChatSoundKind) {
    chatSoundService.preview(kind)
  }

  // ─── події сокета ──────────────────────────────────────────────────────────

  function applyMessage (m: TChatMessage) {
    const state = channels.value[m.channelKey]
    if (state?.loaded) state.messages = mergeMessages(state.messages, [m])
    lastTypingEmit.delete(m.channelKey)
    clearTyping(m.channelKey, m.author.id)

    const self = selfId.value
    if (m.channelKind === 'dm' && self) {
      const peer = m.participants?.find(p => p.id !== self)
      if (peer) ensureDirectTab(m.channelKey, peer)
    }
    const isForeignThread = m.channelKind === 'admin' && isAdmin.value && m.threadOwner?.id !== self
    if (isForeignThread) upsertAdminThread(m)

    if (!self || m.author.id === self) return
    if (isViewing(m.channelKey)) {
      scheduleRead(m.channelKey)
      return
    }
    if (isForeignThread) {
      // Чужий тред підтримки: сигналимо лише на повідомлення власника, не інших адмінів.
      if (m.author.id === m.threadOwner?.id) {
        adminUnreadThreads.value.add(m.channelKey)
        playIncomingSound(m)
      }
      return
    }
    playIncomingSound(m)
    const counter = unread.value[m.channelKey] ?? { unread: 0, mentions: 0 }
    unread.value[m.channelKey] = {
      unread: counter.unread + 1,
      mentions: counter.mentions + (mentionsPlayer(m, self) ? 1 : 0)
    }
  }

  function upsertAdminThread (m: TChatMessage) {
    if (!adminThreadsLoaded.value || !m.threadOwner) return
    const prev = adminThreads.value.find(t => t.channelKey === m.channelKey)
    const fromOwner = m.author.id === m.threadOwner.id && m.author.id !== selfId.value
    const next: TChatAdminThread = {
      channelKey: m.channelKey,
      owner: m.threadOwner,
      lastMessage: m,
      unread: (prev?.unread ?? 0) + (fromOwner && !isViewing(m.channelKey) ? 1 : 0)
    }
    adminThreads.value = [next, ...adminThreads.value.filter(t => t.channelKey !== m.channelKey)]
  }

  const typingTimers = new Map<string, ReturnType<typeof setTimeout>>()

  function clearTyping (channelKey: string, playerId?: string) {
    if (playerId && typing.value[channelKey]?.playerId !== playerId) return
    delete typing.value[channelKey]
    const timer = typingTimers.get(channelKey)
    if (timer) clearTimeout(timer)
    typingTimers.delete(channelKey)
  }

  function onTyping (event: IChatTyping) {
    typing.value[event.channelKey] = event
    const timer = typingTimers.get(event.channelKey)
    if (timer) clearTimeout(timer)
    typingTimers.set(event.channelKey, setTimeout(() => clearTyping(event.channelKey), CHAT_TYPING_TTL_MS))
  }

  function onAccess (next: IChatAccess) {
    const identityChanged = next.playerId !== access.value.playerId
    access.value = next
    if (identityChanged) {
      // Вхід / вихід: історія гостя чи іншого акаунта більше не наша — перечитуємо відкритий канал.
      resetPrivateState()
      if (isOpen.value && activeChannelKey.value) loadChannel(activeChannelKey.value)
    }
    if (!next.canCaptains) delete channels.value.captains
    if (!next.canVip) delete channels.value.vip
    if (!next.isAdmin) {
      adminThreads.value = []
      adminThreadsLoaded.value = false
      selectedAdminThread.value = null
    }
  }

  function resetPrivateState () {
    channels.value = {}
    unread.value = {}
    adminUnreadThreads.value = new Set()
    adminThreads.value = []
    adminThreadsLoaded.value = false
    selectedAdminThread.value = null
    online.value = new Set()
    typing.value = {}
    atBottom.value = {}
  }

  function onPurged (before: string) {
    for (const [key, state] of Object.entries(channels.value)) {
      if (!isPublicChannel(channelKindOf(key))) continue
      state.messages = state.messages.filter(m => m.createdAt >= before)
    }
  }

  // ─── присутність ───────────────────────────────────────────────────────────

  const watchedIds = computed(() => {
    const ids = new Set<string>()
    const self = selfId.value
    if (!self) return [] as string[]
    for (const t of directTabs.value) {
      const peer = directPeerId(t.channelKey, self)
      if (peer) ids.add(peer)
    }
    if (isAdmin.value) for (const t of adminThreads.value) ids.add(t.owner.id)
    return [...ids].sort()
  })

  async function syncPresence () {
    if (!connected.value || !isLoggedIn.value) return
    try {
      online.value = new Set(await chatSocketService.watchPresence(watchedIds.value))
    } catch {
      // тихо — наступна зміна списку або перепідключення повторить
    }
  }

  const syncPresenceDebounced = useDebounceFn(syncPresence, 300)

  function isOnline (playerId: string | null | undefined): boolean {
    return !!playerId && online.value.has(playerId)
  }

  // ─── життєвий цикл: один сокет на застосунок ───────────────────────────────
  let started = false

  function start () {
    if (started) return
    started = true

    chatSocketService.on('chat:access', onAccess)
    chatSocketService.on('chat:message', applyMessage)
    chatSocketService.on('chat:message-deleted', ({ id, channelKey }) => {
      const state = channels.value[channelKey]
      if (state) state.messages = state.messages.filter(m => m.id !== id)
    })
    chatSocketService.on('chat:unread', applyUnreadSummary)
    chatSocketService.on('chat:read', ({ channelKey }) => clearUnread(channelKey))
    chatSocketService.on('chat:typing', onTyping)
    chatSocketService.on('chat:presence', ({ playerId, online: isUp }) => {
      if (isUp) online.value.add(playerId)
      else online.value.delete(playerId)
    })
    chatSocketService.on('chat:purged', ({ before }) => onPurged(before))
    chatSocketService.onConnection((isUp) => {
      connected.value = isUp
      if (!isUp) return
      // Після розриву доганяємо пропущене: свіжа сторінка кожного відкритого каналу.
      for (const [key, state] of Object.entries(channels.value)) {
        if (state.loaded) loadChannel(key, { refresh: true })
      }
      if (adminThreadsLoaded.value) loadAdminThreads({ refresh: true })
      syncPresenceDebounced()
    })

    watch(() => authStore.token, token => chatSocketService.connect(token), { immediate: true })

    // Відкритий канал підвантажується, а його непрочитане гасне, щойно користувач його бачить.
    watch(
      [isOpen, activeChannelKey, connected],
      ([opened, key]) => {
        if (!opened) return
        if (key) loadChannel(key)
        else if (currentTab.value === 'admin') loadAdminThreads()
      },
      { immediate: true }
    )
    watch(
      () => [isOpen.value, activeChannelKey.value, visibility.value,
        activeChannelKey.value ? atBottom.value[activeChannelKey.value] : null] as const,
      () => {
        const key = activeChannelKey.value
        if (key && isViewing(key) && hasUnread(key)) scheduleRead(key)
      }
    )
    watch(() => watchedIds.value.join(','), () => { syncPresenceDebounced() })
  }

  return {
    connected,
    access,
    channels,
    unread,
    adminThreads,
    adminThreadsLoaded,
    adminThreadsLoading,
    selectedAdminThread,
    typing,
    soundSettings,
    isOpen,
    tabs,
    currentTab,
    activeChannelKey,
    activeChannel,
    directTabs,
    selfId,
    isLoggedIn,
    isAdmin,
    totalBadge,
    start,
    open,
    close,
    toggle,
    selectTab,
    openDirect,
    closeDirect,
    openAdminThread,
    directTabOf,
    badgeOf,
    loadChannel,
    loadOlder,
    loadAdminThreads,
    setAtBottom,
    send,
    removeMessage,
    draftOf,
    saveDraft,
    notifyTyping,
    setSoundEnabled,
    setSoundKind,
    previewSound,
    isOnline
  }
})
