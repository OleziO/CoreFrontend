import type { Ref } from 'vue'
import type { TChatPlayer } from '@/api/types/api.types'
import { chatService } from '@/features/chat/chat.service'
import { playerName } from '@/features/chat/chat.utils'

/** `@запит` безпосередньо перед курсором (на початку рядка або після пробілу). */
const MENTION_QUERY_RE = /(^|\s)@([^\s@]{0,32})$/u

/**
 * Автодоповнення `@згадок` у полі вводу публічних каналів: шукає гравців, які бачать канал,
 * вставляє `@Імʼя ` і запамʼятовує id. На відправку йдуть лише ті id, чиє `@Імʼя` ще є в тексті —
 * сервер однаково перевіряє і текст, і доступ.
 */
export function useChatMentions (channelKey: Ref<string>, enabled: Ref<boolean>) {
  const suggestions = ref<TChatPlayer[]>([])
  const highlighted = ref(0)
  const query = ref<string | null>(null)
  const picked = new Map<string, TChatPlayer>()
  let anchor = -1
  let requestId = 0

  const isOpen = computed(() => query.value !== null && suggestions.value.length > 0)

  const search = useDebounceFn(async (q: string) => {
    const id = ++requestId
    try {
      const found = await chatService.searchPlayers(q, channelKey.value)
      if (id === requestId && query.value !== null) {
        suggestions.value = found
        highlighted.value = 0
      }
    } catch {
      if (id === requestId) suggestions.value = []
    }
  }, 200)

  function dismiss () {
    query.value = null
    suggestions.value = []
    anchor = -1
  }

  /** Викликати на кожен ввід: відкриває / оновлює / ховає список підказок. */
  function onInput (text: string, caret: number) {
    if (!enabled.value) return dismiss()
    const match = text.slice(0, caret).match(MENTION_QUERY_RE)
    if (!match) return dismiss()
    anchor = caret - match[2].length - 1
    query.value = match[2]
    search(match[2])
  }

  /** Підставляє `@Імʼя ` замість `@запит`; повертає новий текст і позицію курсора. */
  function pick (player: TChatPlayer, text: string, caret: number): { text: string; caret: number } {
    if (anchor < 0) return { text, caret }
    const insert = `@${playerName(player)} `
    const next = text.slice(0, anchor) + insert + text.slice(caret)
    picked.set(player.id, player)
    const nextCaret = anchor + insert.length
    dismiss()
    return { text: next, caret: nextCaret }
  }

  /** Стрілки / Enter / Tab / Esc, поки список відкритий. Повертає true, якщо клавішу оброблено. */
  function onKeydown (event: KeyboardEvent, apply: (player: TChatPlayer) => void): boolean {
    if (!isOpen.value) return false
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      const step = event.key === 'ArrowDown' ? 1 : -1
      highlighted.value = (highlighted.value + step + suggestions.value.length) % suggestions.value.length
      event.preventDefault()
      return true
    }
    if (event.key === 'Enter' || event.key === 'Tab') {
      const player = suggestions.value[highlighted.value]
      if (player) apply(player)
      event.preventDefault()
      return true
    }
    if (event.key === 'Escape') {
      dismiss()
      event.preventDefault()
      return true
    }
    return false
  }

  /** Id згадок, які лишилися в остаточному тексті. */
  function mentionIds (text: string): string[] {
    const lower = text.toLowerCase()
    return [...picked.values()]
      .filter(p => lower.includes(`@${playerName(p).toLowerCase()}`))
      .map(p => p.id)
  }

  function reset () {
    picked.clear()
    dismiss()
  }

  watch(channelKey, reset)

  return { suggestions, highlighted, isOpen, onInput, onKeydown, pick, dismiss, mentionIds, reset }
}
