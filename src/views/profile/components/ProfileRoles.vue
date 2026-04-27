<template>
  <PlayerRoleTag :roles="roles" :max="12" />
</template>

<script lang="ts" setup>
import PlayerRoleTag from '@/components/player-tags/PlayerRoleTag.vue'
import type { TCurrentPlayerRole } from '@/api/types/api.types'

const authStore = useAuthStore()

const roles = computed((): TCurrentPlayerRole[] => authStore.user?.roles ?? [])
</script>
