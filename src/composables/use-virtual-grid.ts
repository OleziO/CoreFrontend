import { computed } from 'vue'
import { useWindowSize } from '@vueuse/core'

type TVirtualGridLayoutOptions = {
  cardWidth: number
}

/** Відстань між картками у сітці списків (Teams, Players, …), px — збігається з `gap-20` у Tailwind. */
export const VIRTUAL_GRID_CARD_GAP_PX = 20

export function useVirtualGridLayout ({ cardWidth }: TVirtualGridLayoutOptions) {
  const gap = VIRTUAL_GRID_CARD_GAP_PX

  const { width: windowWidth } = useWindowSize()

  const containerPadding = windowWidth.value > 500 ? 40 : 0

  // Скільки карточок влазить в ряд
  const cardsPerRow = computed(() => {
    if (!cardWidth) return 0

    const available = windowWidth.value - containerPadding * 2
    const count = Math.floor((available + gap) / (cardWidth + gap))
    return Math.max(count, 1)
  })

  return {
    cardsPerRow
  }
}
