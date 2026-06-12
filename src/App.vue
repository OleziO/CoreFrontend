<template>
  <ElConfigProvider :message="{ showClose: true }">
    <router-view #default="{ Component }">
      <component :is="Component" />
    </router-view>
  </ElConfigProvider>

  <Modals :modals="appModals" />
</template>

<script setup lang="ts">
import { appModals } from '@/composables/use-app-modals'

useAnalyticsUserTracking()
</script>
