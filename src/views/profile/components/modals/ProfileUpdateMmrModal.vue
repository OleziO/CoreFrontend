<template>
  <el-dialog v-model="showMmrModal" width="400">
    <div class="flex flex-col gap-10">
      <h1 class="text-2xl">
        MMP Гравця
      </h1>

      <div class="flex flex-col gap-15">
        <div>
          <label for="">
            Вкажіть ммр гравця
          </label>
          <el-input v-model="selectedMmr" placeholder="Введіть ммр гравця" type="number" />
        </div>
      </div>
      <el-button
        type="primary"
        class="mt-15"
        @click="updatePlayerMmr"
      >
        Оновити MMP
      </el-button>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
const authStore = useAuthStore()

const selectedMmr = defineModel<number | null | undefined>('selectedMmr')
const showMmrModal = defineModel<boolean>('showMmrModal')

function updatePlayerMmr () {
  authService.updatePlayerData(selectedMmr.value as number, authStore.user?.positions as number[]).then(data => {
    if (data) {
      authStore.user = data
    }
  })
  ElMessage({ message: 'Ммр гравця оновлено' })
}

</script>
