<template>
  <div class="flex gap-10">
    <div
      v-for="role in authStore.user?.roles || []"
      :key="role.id"
    >
      <el-tag type="primary">
        {{ role.name }}
      </el-tag>
    </div>
  </div>
</template>

<script lang="ts" setup>
const authStore = useAuthStore()
</script>
