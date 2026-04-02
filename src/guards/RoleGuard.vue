<template>
  <slot v-if="isAccess" />
</template>

<script setup lang="ts"> // Гуард для проверки ролей, оборачиваем его в кусок кода, и он будет рендерится в зависимости от ролей пользователя

const authStore = useAuthStore()
const props = defineProps<{
  roles?: string[] // Роли ["admin", "moderator"]
  excludeRoles?: string[] // Роли для исключения ["unverified"]
}>()

const isAccess = computed(() => {
  const userRoles = authStore.user?.roles?.map(el => el.type_name) || []
  // Если указаны исключаемые роли, проверяем что у пользователя нет ни одной из них
  if (props.excludeRoles && props.excludeRoles.length > 0) {
    const hasExcludedRole = props.excludeRoles.some(role => userRoles.includes(role))
    return !hasExcludedRole
  }

  // Если указаны разрешенные роли, проверяем что у пользователя есть хотя бы одна из них
  if (props.roles && props.roles.length > 0) {
    return props.roles.some(role => userRoles.includes(role))
  }

  return false
})

</script>
