<template>
  <div
    class="relative overflow-hidden group font-inter rounded-xl border border-white/20
           bg-gradient-to-b
           px-18 py-20
           transition-all duration-300"
    :class="path.length > 1 ? 'ml-20' : ''"
  >
    <!-- Accent bar -->
    <div
      class="absolute left-0 top-0 bottom-0 w-2
             bg-gradient-to-b from-primary/60 to-primary/10
             rounded-l-xl opacity-60 group-hover:opacity-100 transition"
    />

    <div class="relative z-10 space-y-10">
      <!-- Header -->
      <div class="flex items-start gap-10">
        <!-- Number -->
        <div
          class="flex items-center justify-center
               p-5 min-w-30 rounded-lg bg-white/10
                 border border-white/15 text-sm font-semibold text-primary"
        >
          {{ displayIndex }}
        </div>

        <!-- Title -->
        <div class="space-y-6">
          <h4 class="text-white font-medium text-base md:text-lg">
            {{ item?.title }}
          </h4>

          <p
            v-if="item?.description"
            class="text-sm md:text-base text-white/70 max-w-[70ch]"
          >
            {{ item.description }}
          </p>
        </div>
      </div>

      <!-- Children -->
      <div v-if="item?.children?.length" class="space-y-20 pt-8">
        <RuleCardItem
          v-for="(child, index) in item.children"
          :key="index"
          :item="child"
          :path="[...path, index + 1]"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  item: IRuleItem | null
  path?: number[]
}>()

const path = props.path ?? [1]

const displayIndex = computed(() => path.join('.'))
</script>

<style scoped lang="scss">
:global(.rule-list) {
  counter-reset: item;
  list-style: none;
  padding-left: 0;
  margin: 0;
}

</style>
