<template>
  <div ref="containerRef" class="flex flex-col" :style="{padding: `${cardGap}px`}">
    <div
      v-for="(row, rowIndex) in rows"
      :key="rowIndex"
      class="flex flex-wrap"
      :style="{gap: `${cardGap}px`}"
    >
      <UserCard
        v-for="player in row"
        :key="player.id"
        :user="player"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useElementSize } from '@vueuse/core'
import UserCard from './UserCard.vue'

const props = defineProps<{
  players: TPlayer[]
  cardWidth: number
  cardGap: number
}>()

const containerRef = ref<HTMLElement | null>(null)

const { width: containerWidth } = useElementSize(containerRef)

const rows = computed(() => {
  if (!containerWidth.value) return [props.players]

  const cardsPerRow = Math.floor((containerWidth.value + props.cardGap) / (props.cardWidth + props.cardGap))
  const result: TPlayer[][] = []

  for (let i = 0; i < props.players.length; i += cardsPerRow) {
    result.push(props.players.slice(i, i + cardsPerRow))
  }

  return result
})
</script>
