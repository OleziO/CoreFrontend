<template>
  <div class="h-full w-full">
    <RecycleScroller
      v-if="items.length"
      :items="items"
      :itemSize="itemHeight"
      :itemSecondarySize="isTable ? undefined : itemWidth"
      :gridItems="gridItems"
      :key-field="idKey"
      :buffer="buffer"
      class="w-full"
      :class="containerClasses"
      :item-class="itemClasses"
      :style="containerStyles"
    >
      <template #default="{ item }">
        <slot name="item" :item="item" />
      </template>
    </RecycleScroller>

    <el-empty
      v-else
      :description="emptyText"
      :image-size="250"
      class="h-full flex items-center justify-center"
      :class="containerClasses"
    />
  </div>
</template>

<script setup lang="ts" generic="T">
import { useWindowSize } from '@vueuse/core'

const props = withDefaults(defineProps<{
  items: T[]
  idKey?: string
  gridItems?: number
  itemHeight?: number
  itemWidth?: number
  gridWidth?: number
  buffer?: number
  withTopMargin?: boolean
  emptyText?: string
  isTable?: boolean
  /** Відступи між елементами сітки (класи на клітинці RecycleScroller). За замовчуванням як у Players/Tournaments. */
  gridCellClass?: string
}>(), {
  gridItems: 4,
  itemHeight: 300,
  withTopMargin: false,
  itemWidth: 200,
  gridWidth: 1000,
  idKey: 'id',
  buffer: 500,
  emptyText: 'Дані відсутні',
  isTable: false,
  gridCellClass: 'pb-20 pr-20'
})

defineSlots<{
  item(props: { item: T }): void
}>()

const window = useWindowSize()

const gridRowWidth = computed(() => props.itemWidth * (props.gridItems ?? 1))

const paddingSide = computed(() => {
  if (props.isTable) return 0
  return Math.max(0, (window.width.value - gridRowWidth.value) / 2)
})

const containerStyles = computed(() => {
  if (props.isTable) {
    return {
      height: '100%',
      paddingLeft: '0px',
      paddingRight: '0px'
    }
  }

  const pad = `${paddingSide.value}px`
  return {
    maxHeight: `${window.height.value}px`,
    paddingLeft: pad,
    paddingRight: pad
  }
})

const containerClasses = computed(() => {
  return props.isTable ? '' : 'pt-[140px] pb-[160px]'
})

const itemClasses = computed(() => {
  return props.isTable ? '' : props.gridCellClass
})
</script>
