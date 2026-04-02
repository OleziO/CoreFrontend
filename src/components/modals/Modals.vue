<template>
  <component
    v-bind="modal.props"
    :is="modal.component"
    v-for="[name, modal] in modals.modals.value.entries()"
    :key="name"
    v-model="modal.isOpen"
  />
</template>

<script setup lang="ts">
import type { useModals } from '@/composables/use-modals'
defineProps<{modals: ReturnType<typeof useModals>}>()
</script>
