<template>
  <ElConfigProvider>
    <router-view v-slot="{ Component }">
      <component :is="Component" v-if="Component" />
    </router-view>
  </ElConfigProvider>

  <Modals :modals="appModals" />
</template>

<script setup lang="ts">
import { useAppModals } from '@/composables/use-app-modals'

/** Один екземпляр на застосунок — інакше `useAppModals()` у шаблоні створював новий обʼєкт щоразу й ламав реактивність Modals. */
const appModals = useAppModals()
</script>
