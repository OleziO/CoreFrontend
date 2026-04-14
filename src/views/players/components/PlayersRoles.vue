<template>
  <div class="w-full flex justify-between gap-10 items-center">
    <div class="flex gap-10">
      <el-tag
        v-for="role in currentPlayerRoles"
        :key="role.id"
        type="primary"
      >
        {{ role.name }}
      </el-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
const playersStore = usePlayersStore()

const route = useRoute()

const currentPlayerRoles = computed(() => {
  const id = String(route.params.id)
  const player = playersStore.players.find(p => p.id === id)
  return player?.roles || []
})
</script>
