<template>
  <!--
    Скелет сітки карток. Повторює геометрію VirtualList один в один: та ж кількість
    колонок, той самий крок клітинки, те ж центрування бічними полями і верхній
    відступ — щоб реальні картки стали рівно на місце скелетів без стрибка макета.
  -->
  <div
    class="card-grid-skeleton h-full w-full overflow-hidden pt-[140px]"
    :style="containerStyles"
    role="status"
    aria-busy="true"
    aria-live="polite"
  >
    <span class="sr-only">{{ label }}</span>

    <div class="flex flex-wrap">
      <div
        v-for="index in count"
        :key="index"
        class="card-grid-skeleton__cell"
        :class="cellClasses"
        :style="{
          width: `${itemWidth}px`,
          height: `${itemHeight}px`,
          '--skeleton-delay': `${(index - 1) * CASCADE_STEP_MS}ms`
        }"
        aria-hidden="true"
      >
        <slot name="item" :index="index - 1" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'

/** Зсув шимера між сусідніми картками — каскад зліва направо, зверху вниз. */
const CASCADE_STEP_MS = 70
/** Верхній відступ контейнера — збігається з `pt-[140px]` у VirtualList. */
const TOP_OFFSET_PX = 140

const props = withDefaults(defineProps<{
  /** Кількість колонок — те саме значення, що йде у VirtualList (`cardsPerRow`). */
  columns: number
  /** Крок клітинки по горизонталі, px (`effectiveCardWidth`). */
  itemWidth: number
  /** Крок клітинки по вертикалі, px (висота картки + відступ ряду). */
  itemHeight: number
  /** Класи відступів на клітинці — як `gridCellClass` у VirtualList. */
  gridCellClass?: string
  /** Верхня межа кількості скелетів, щоб не малювати сотні вузлів на великих екранах. */
  maxCount?: number
  /** Текст для скрінрідерів. */
  label?: string
}>(), {
  gridCellClass: 'pb-20 pr-20',
  maxCount: 16,
  label: 'Завантаження…'
})

defineSlots<{
  item(props: { index: number }): void
}>()

const window = useWindowSize()

const safeColumns = computed(() => Math.max(1, props.columns))

/** Заповнюємо видимі ряди (округлення вгору, щоб низ екрана не був порожнім), але не більше `maxCount`. */
const count = computed(() => {
  const visibleHeight = Math.max(0, window.height.value - TOP_OFFSET_PX)
  const rows = Math.max(1, Math.ceil(visibleHeight / props.itemHeight))
  return Math.min(props.maxCount, rows * safeColumns.value)
})

/** Бічні поля центрують ряд — та ж формула, що у VirtualList. */
const paddingSide = computed(() =>
  Math.max(0, (window.width.value - props.itemWidth * safeColumns.value) / 2)
)

const containerStyles = computed(() => ({
  paddingLeft: `${paddingSide.value}px`,
  paddingRight: `${paddingSide.value}px`
}))

/** Одна колонка (мобільний): без правого поля, як у VirtualList. */
const cellClasses = computed(() => {
  if (safeColumns.value <= 1) {
    return props.gridCellClass.replace(/\bpr-\S+/g, '').replace(/\s+/g, ' ').trim()
  }
  return props.gridCellClass
})
</script>

<style scoped lang="scss">
// The bottom edge of the skeleton region fades out so a half-visible last row
// reads as "more below" instead of a hard cut.
.card-grid-skeleton {
  mask-image: linear-gradient(180deg, #000 0%, #000 82%, transparent 100%);
}
</style>
