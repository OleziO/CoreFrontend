import { computed } from 'vue'
import { useWindowSize } from '@vueuse/core'

type TVirtualGridLayoutOptions = {
  cardWidth: number
}

export function useVirtualGridLayout ({ cardWidth }: TVirtualGridLayoutOptions) {
  const gap = 20

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
