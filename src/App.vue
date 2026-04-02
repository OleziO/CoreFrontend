<template>
  <ElConfigProvider>
    <router-view #default="{ Component }">
      <component :is="Component" />
    </router-view>
  </ElConfigProvider>

  <Modals :modals="useAppModals()" />
</template>

<script setup lang="ts">
import { useAppModals } from '@/composables/use-app-modals'

</script>
