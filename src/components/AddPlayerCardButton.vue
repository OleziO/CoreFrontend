<template>
  <button
    class=" relative flex gap-15
             items-center w-full
             rounded-xl border border-dashed border-white/10 bg-white/[0.02]
             backdrop:px-4 transition-all duration-300 p-10 cursor-default"
    :class="{'group/btn hover:bg-gray-800 cursor-pointer': clickable}"
  >
    <div
      class="flex items-center justify-center size-50 rounded-full bg-white/5
           text-gray-500 group-hover/btn:text-white shrink-0"
    >
      <slot name="icon" />
    </div>

    <div class="flex flex-col items-start">
      <span class="leading-tight">
        <slot name="title" />
      </span>
      <span class="text-xs text-gray-500 mt-1">

        {{ freeSlot.min_mmr ?? '???' }} - {{ freeSlot.max_mmr ?? '???' }}
      </span>
    </div>

    <el-tooltip content="Pool" placement="top">
      <div class="ml-auto size-40 rounded-lg flex items-center justify-center bg-white/5 text-gray-500">
        {{ freeSlot.pool }}
      </div>
    </el-tooltip>
  </button>
</template>

<script lang="ts" setup>

defineProps<{
  freeSlot: {
    min_mmr?: number | null
    max_mmr?: number | null
    pool: number
  }
  clickable?: boolean
}>()
</script>
