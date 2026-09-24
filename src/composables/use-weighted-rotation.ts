import type { MaybeRefOrGetter } from 'vue'

interface IWeightedRotationOptions<T> {
  /** Вага елемента — більша вага = довше в кадрі. */
  weightOf: (item: T) => number
  /** Базова тривалість показу (мс) для найлегшого елемента. */
  baseMs?: number
  /** Зовнішня пауза (напр. наведення/фокус). */
  paused?: MaybeRefOrGetter<boolean>
}

/**
 * Планувальник зваженої ротації для банера спонсорів.
 *
 * Тривалість показу слайда пропорційна його вазі (`weightOf`), тож дорожчі
 * спонсори залишаються в кадрі довше. Автопрогравання вимикається за
 * `prefers-reduced-motion`, на прихованій вкладці та коли елемент менше двох —
 * ручна навігація (`next`/`prev`/`goTo`) працює завжди.
 *
 * Для індикатора прогресу повертає `dwellMs` (тривалість поточного слайда) і
 * `cycle` — лічильник, що збільшується щоразу, коли таймер стартує заново.
 * Ключуючи анімацію по `cycle`, UI перезапускає смугу прогресу синхронно з
 * реальним таймером (у т.ч. після паузи, бо пауза скидає відлік).
 */
export function useWeightedRotation<T> (
  items: MaybeRefOrGetter<T[]>,
  options: IWeightedRotationOptions<T>
) {
  const { weightOf, baseMs = 4500 } = options

  const list = computed(() => toValue(items))
  const currentIndex = ref(0)
  const current = computed<T | undefined>(() => list.value[currentIndex.value])
  /** Скільки разів стартував таймер — ключ для перезапуску анімації прогресу. */
  const cycle = ref(0)

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const visibility = useDocumentVisibility()

  const isPaused = computed(() =>
    prefersReducedMotion ||
    !!(options.paused && toValue(options.paused)) ||
    visibility.value === 'hidden' ||
    list.value.length < 2
  )

  /** Найлегша вага у наборі — використовується для нормалізації тривалості. */
  const minWeight = computed(() => {
    const weights = list.value.map(weightOf).filter(w => w > 0)
    return weights.length ? Math.min(...weights) : 1
  })

  function dwellFor (index: number): number {
    const item = list.value[index]
    if (!item) return baseMs
    const w = Math.max(weightOf(item), minWeight.value)
    return Math.round(baseMs * (w / minWeight.value))
  }

  /** Тривалість показу поточного слайда (мс). */
  const dwellMs = computed(() => dwellFor(currentIndex.value))

  function advance (direction: number) {
    const n = list.value.length
    if (!n) return
    currentIndex.value = (currentIndex.value + direction + n) % n
  }

  const { start, stop } = useTimeoutFn(
    () => {
      advance(1)
      schedule()
    },
    () => dwellFor(currentIndex.value),
    { immediate: false }
  )

  function schedule () {
    stop()
    if (isPaused.value) return
    cycle.value++
    start()
  }

  function next () {
    advance(1)
    schedule()
  }

  function prev () {
    advance(-1)
    schedule()
  }

  function goTo (index: number) {
    const n = list.value.length
    if (!n) return
    currentIndex.value = ((index % n) + n) % n
    schedule()
  }

  // Перепланувати при зміні паузи/видимості/довжини набору; підрівняти індекс.
  watch(
    [isPaused, () => list.value.length],
    () => {
      if (currentIndex.value >= list.value.length) currentIndex.value = 0
      schedule()
    },
    { immediate: true }
  )

  onScopeDispose(stop)

  return { currentIndex, current, next, prev, goTo, isPaused, dwellMs, cycle }
}
