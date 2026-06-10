<template>
  <el-dialog v-model="showMmrModal" width="400">
    <div class="flex flex-col gap-10">
      <h1 class="text-2xl">
        MMR Гравця
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
        Оновити MMR
      </el-button>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
const selectedMmr = defineModel<number | null | undefined>('selectedMmr')
const showMmrModal = defineModel<boolean>('showMmrModal')

function updatePlayerMmr () {
  // TODO: endpoint not in API yet (updatePlayerData)
  ElMessage({ message: 'Функціонал оновлення MMR ще не реалізований в API', type: 'warning' })
}

</script>
