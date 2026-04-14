<template>
  <slot v-if="isAccess" />
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const props = defineProps<{
  roles?: string[]
  excludeRoles?: string[]
}>()

const isAccess = computed(() => {
  const userRoles = authStore.user?.roles?.map(el => el.name) || []

  if (props.excludeRoles && props.excludeRoles.length > 0) {
    const hasExcludedRole = props.excludeRoles.some(role => userRoles.includes(role))
    return !hasExcludedRole
  }

  if (props.roles && props.roles.length > 0) {
    return props.roles.some(role => userRoles.includes(role))
  }

  return false
})
</script>
