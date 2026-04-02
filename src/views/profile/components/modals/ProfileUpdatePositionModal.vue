<template>
  <el-dialog v-model="showPositionModal" width="400">
    <div class="flex flex-col gap-10">
      <h1 class="text-2xl">
        Ігрові дані
      </h1>
      <p>
        Вкажіть ваш ммр та основну позицію
      </p>
      <div class="flex flex-col">
        <label for="">Основна позиція</label>
        <el-select v-model="selectedPositions" placeholder="Оберіть основну позицію">
          <el-option
            v-for="position in positions"
            :key="position.id"
            :value="position.position"
            :label="position.label"
          />
        </el-select>
      </div>
      <el-button
        type="primary"
        class="mt-15"
        @click="updatePlayerPosition"
      >
        Оновити позицію
      </el-button>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
const showPositionModal = defineModel<boolean>('showPositionModal') // Не забывать что чтобы связывать с v-model в дочернем компоненте, использеутся defineModel а не defineProps, пропсы не имеют реактивности и их нельзя менять
const authStore = useAuthStore()

const selectedPositions = defineModel<number[] | undefined>('selectedPositions')

function updatePlayerPosition () {
  authService.updatePlayerData(authStore?.user?.mmr as number, selectedPositions.value as number[]).then(data => {
    if (data) {
      authStore.user = data
    }
  })
  ElMessage({ message: 'Позиція гравця оновлено' })
}

const positions = [
  { id: 1, label: '1(Керрі)', position: 1 },
  { id: 2, label: '2(Мід)', position: 2 },
  { id: 3, label: '3(Оффлейн)', position: 3 },
  { id: 4, label: '4(Підтримка)', position: 4 },
  { id: 5, label: '5(Фулл підтримка)', position: 5 }
]
</script>
