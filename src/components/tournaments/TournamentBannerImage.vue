<template>
  <div
    class="relative overflow-hidden bg-gray-950/80"
    :class="rootClass"
  >
    <template v-if="resolvedSrc">
      <el-image
        :src="resolvedSrc"
        fit="cover"
        :lazy="lazyEffective"
        :class="imageClass"
      >
        <template #placeholder>
          <div
            class="absolute inset-0 bg-gradient-to-br from-gray-800/90 via-gray-900/80 to-gray-950
                   animate-pulse"
            aria-hidden="true"
          />
        </template>
        <template #error>
          <div
            class="absolute inset-0 flex items-center justify-center
                   bg-gradient-to-br from-gray-800/95 via-gray-950 to-black/90 text-white/30"
          >
            <PhTrophy :size="iconSizePx" weight="duotone" class="opacity-80" />
          </div>
        </template>
      </el-image>
    </template>
    <div
      v-else
      class="flex w-full items-center justify-center bg-gradient-to-br from-gray-800/95 via-gray-950 to-black/90
             text-white/30"
      :class="emptyStateClass"
    >
      <PhTrophy :size="iconSizePx" weight="duotone" class="opacity-80" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhTrophy } from '@phosphor-icons/vue'
import { computed } from 'vue'
import { getImageUrl } from '@/core/helpers'

const props = withDefaults(
  defineProps<{
    /** Сирий URL з API (`/uploads/...`, `https://...` або порожньо). */
    url?: string | null
    variant?: 'card' | 'hero' | 'thumb'
    /** Для списків / мініатюр — відкладене завантаження. Герой першого екрана — без lazy. */
    lazy?: boolean
    /** Scale при hover (батьківський контейнер з `group`). */
    scaleOnHover?: boolean
    extraClass?: string
  }>(),
  {
    variant: 'card',
    lazy: true,
    scaleOnHover: false,
    extraClass: ''
  }
)

const resolvedSrc = computed(() => getImageUrl(props.url))

const lazyEffective = computed(() =>
  props.variant === 'hero' ? false : props.lazy
)

const iconSizePx = computed(() =>
  props.variant === 'thumb' ? 28 : props.variant === 'hero' ? 56 : 40
)

const emptyStateClass = computed(() =>
  props.variant === 'hero'
    ? 'min-h-full h-full'
    : props.variant === 'thumb'
      ? 'h-full min-h-[60px]'
      : 'h-full min-h-[4.5rem]'
)

const rootClass = computed(() => {
  const extra = props.extraClass?.trim()
  switch (props.variant) {
    case 'hero':
      return ['absolute inset-0 z-0 min-h-full h-full', extra].filter(Boolean).join(' ')
    case 'thumb':
      return [
        'size-[60px] shrink-0 rounded-lg ring-1 ring-white/10',
        extra
      ].filter(Boolean).join(' ')
    default:
      return [
        'w-full aspect-video rounded-lg shadow-inner ring-1 ring-white/10',
        extra
      ].filter(Boolean).join(' ')
  }
})

const scaleClass = computed(() =>
  props.scaleOnHover
    ? 'group-hover:[&_.el-image__inner]:scale-105 [&_.el-image__inner]:transition-transform [&_.el-image__inner]:duration-500 [&_.el-image__inner]:ease-out'
    : '[&_.el-image__inner]:transition-transform [&_.el-image__inner]:duration-500 [&_.el-image__inner]:ease-out'
)

const imageClass = computed(() => {
  const base = `${scaleClass.value} [&_.el-image__inner]:h-full [&_.el-image__inner]:w-full [&_.el-image__inner]:object-cover`
  switch (props.variant) {
    case 'hero':
      return `absolute inset-0 min-h-full h-full w-full ${base} [&_.el-image]:!absolute [&_.el-image]:inset-0 [&_.el-image]:h-full [&_.el-image]:w-full [&_.el-image__wrapper]:!absolute [&_.el-image__wrapper]:inset-0 [&_.el-image__wrapper]:h-full [&_.el-image__wrapper]:w-full`
    case 'thumb':
      return `h-[60px] w-[60px] ${base} [&_.el-image]:block [&_.el-image]:h-[60px] [&_.el-image]:w-[60px] [&_.el-image__wrapper]:h-[60px] [&_.el-image__wrapper]:w-[60px]`
    default:
      return [
        `h-full w-full min-h-0 ${base}`,
        '[&_.el-image]:block [&_.el-image]:min-h-[8rem] [&_.el-image]:h-full [&_.el-image]:w-full'
      ].join(' ')
  }
})
</script>
