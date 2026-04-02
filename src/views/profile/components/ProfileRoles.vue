<template>
  <div class="flex gap-10">
    <div
      v-for="(entity, index) in filteredRoles"
      :key="index"
    >
      <el-tag type="primary">
        {{ entity.label }}
      </el-tag>
    </div>
  </div>
</template>

<script lang="ts" setup>
import checkRoles from '@/core/helpers'
import { playersRolesArr } from '@/constants/players'

const authStore = useAuthStore()

const filteredRoles = computed(() => {
  return playersRolesArr.filter(el => {
    return checkRoles([el.value], authStore.user?.roles)
  })
})

</script>
