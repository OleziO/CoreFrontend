import { useWindowSize } from '@vueuse/core'

type TVirtualGridLayoutOptions = {
  cardWidth: number
}

/** Відстань між картками у сітці списків (Teams, Players, …), px — збігається з `gap-20` у Tailwind. */
export const VIRTUAL_GRID_CARD_GAP_PX = 20

/** Бічні поля картки в одноколонковому (мобільному) режимі, px. */
const SINGLE_COLUMN_SIDE_MARGIN_PX = 20
/** Максимальний коефіцієнт розтягування картки, коли в ряд влазить лише одна колонка.
 *  Тримаємо близьким до 1 — картка майже не росте на мобільному, лише трохи заповнює ряд. */
const SINGLE_COLUMN_MAX_GROWTH = 1.1

export function useVirtualGridLayout ({ cardWidth }: TVirtualGridLayoutOptions) {
  const gap = VIRTUAL_GRID_CARD_GAP_PX

  const { width: windowWidth } = useWindowSize()

  const availableWidth = computed(() => {
    const containerPadding = windowWidth.value > 500 ? 40 : 0
    return windowWidth.value - containerPadding * 2
  })

  // Скільки карточок влазить в ряд
  const cardsPerRow = computed(() => {
    if (!cardWidth) return 0

    const count = Math.floor((availableWidth.value + gap) / (cardWidth + gap))
    return Math.max(count, 1)
  })

  // Коли в ряд влазить лише одна картка (мобільний), розтягуємо її, щоб заповнити
  // доступну ширину — але не більше ніж у `SINGLE_COLUMN_MAX_GROWTH` разів, щоб
  // картка не виглядала неприродно широкою на планшеті.
  const effectiveCardWidth = computed(() => {
    if (cardsPerRow.value > 1) return cardWidth

    const fill = availableWidth.value - SINGLE_COLUMN_SIDE_MARGIN_PX * 2
    const max = Math.round(cardWidth * SINGLE_COLUMN_MAX_GROWTH)
    return Math.round(Math.min(Math.max(fill, cardWidth), max))
  })

  return {
    cardsPerRow,
    effectiveCardWidth
  }
}
