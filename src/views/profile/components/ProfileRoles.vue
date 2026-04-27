<template>
  <div class="min-w-0 flex-1">
    <PlayerRoleTag :roles="roles" :max="12" no-wrap />
  </div>
</template>

<script lang="ts" setup>
import PlayerRoleTag from '@/components/player-tags/PlayerRoleTag.vue'
import type { TCurrentPlayerRole } from '@/api/types/api.types'

const authStore = useAuthStore()

const roles = computed((): TCurrentPlayerRole[] => authStore.user?.roles ?? [])
</script>
