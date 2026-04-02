<template>
  <div class="flex flex-col font-inter overflow-auto gap-40 p-40">
    <el-dialog
      :model-value="!!selectedRule"
      :title="selectedRule?.title"
      class="max-w-[1440px] overflow-auto"
      destroy-on-close
      align-center
      @close="closeDialog"
    >
      <div class="p-4">
        <RuleCardItem :item="selectedRule" />
      </div>
    </el-dialog>

    <div>
      <h1 class="text-4xl text-center font-bold mb-16">Правила Платформи</h1>

      <p class="text-lg max-w-3xl mx-auto text-gray-300">
        Ласкаво просимо! Щоб забезпечити чесну гру та комфортну атмосферу для всіх учасників,
        ми розробили цей звід правил. Будь ласка, ознайомтеся з ним.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-20">
      <RuleCard
        v-for="rule in rulesWithIcons"
        :key="rule.title"
        :title="rule.title"
        :description="getDescription(rule)"
        :icon="rule.icon"
        @click="handleCardClick(rule)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { rules } from './rules.constants'

const rulesWithIcons = computed(() => rules)

const selectedRule = ref<IRuleItem | null>(null)

const getDescription = (rule: IRuleItem) =>
  rule.description || rule.children?.[0]?.title || ''

const handleCardClick = (rule: IRuleItem) => {
  selectedRule.value = rule
}

const closeDialog = () => {
  selectedRule.value = null
}
</script>
