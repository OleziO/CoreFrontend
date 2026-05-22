<template>
  <div
    class="relative flex flex-1 flex-col items-center gap-10 rounded-xl border px-14 py-16 cursor-pointer
           transition-all duration-200 outline-none select-none"
    :class="cardClasses"
    tabindex="0"
    role="button"
    :aria-pressed="state === 'winner'"
    @click="emit('click')"
    @keydown.space.prevent="emit('click')"
    @keydown.enter.prevent="emit('click')"
  >
    <!-- Winner badge -->
    <div
      v-if="state === 'winner'"
      class="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-4 rounded-full
             bg-green-700 px-10 py-3 text-[10px] font-semibold uppercase tracking-widest text-white shadow-md"
    >
      <PhTrophy :size="12" weight="fill" />
      Переможець
    </div>

    <!-- Logo -->
    <div class="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/30">
      <img
        v-if="logoSrc && !logoFailed"
        :src="logoSrc"
        alt=""
        class="h-full w-full object-cover object-center pointer-events-none"
        @error="logoFailed = true"
      >
      <div v-else class="flex h-full w-full items-center justify-center">
        <PhUsersThree :size="36" weight="duotone" class="text-white/25" />
      </div>
    </div>

    <!-- Team name -->
    <span
      class="text-center text-sm font-semibold leading-snug tracking-tight transition-colors duration-200"
      :class="state === 'loser' ? 'text-white/40' : 'text-white'"
    >
      {{ team.name }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { PhTrophy, PhUsersThree } from '@phosphor-icons/vue'
import { resolvePublicOrApiUrl } from '@/core/helpers'

const props = defineProps<{
  team: { id: string; name: string; logoUrl?: string | null }
  state: 'neutral' | 'winner' | 'loser'
}>()

const emit = defineEmits<{
  click: []
}>()

const logoFailed = ref(false)
const logoSrc = computed(() => resolvePublicOrApiUrl(props.team.logoUrl))

watch(logoSrc, () => {
  logoFailed.value = false
})

const cardClasses = computed(() => {
  if (props.state === 'winner') {
    return [
      'border-green-500',
      'bg-green-900/30',
      'shadow-[0_0_18px_rgba(34,197,94,0.18)]',
      'hover:border-green-400'
    ]
  }
  if (props.state === 'loser') {
    return [
      'border-red-500/60',
      'bg-red-900/20',
      'opacity-60'
    ]
  }
  return [
    'border-white/10',
    'bg-white/[0.03]',
    'hover:border-white/25',
    'hover:bg-white/[0.06]'
  ]
})
</script>
