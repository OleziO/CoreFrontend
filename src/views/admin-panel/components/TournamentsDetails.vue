<template>
  <div class="h-full flex flex-col gap-6 overflow-hidden">
    <div class="flex justify-between items-center shrink-0">
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-bold text-white tracking-tight">
          Управління турнірами
        </h1>
        <p class="text-gray-400 text-sm">
          Список усіх доступних турнірів та їх налаштування
        </p>
      </div>

      <el-button
        type="primary"
        size="large"
        class="!bg-cyan-600 !border-cyan-600 hover:!bg-cyan-500 shadow-lg shadow-cyan-900/20 transition-all !rounded-xl"
        @click="showCreateTournamentDrawer = true"
      >
        <el-icon class="mr-2"><Plus /></el-icon>
        Додати турнір
      </el-button>
    </div>

    <div class="flex-1 min-h-0 rounded-xl border border-white/10 bg-[#111827] shadow-xl overflow-hidden flex flex-col">
      <div
        class="grid-header border-b border-white/10 bg-[#111827]/80 backdrop-blur
       text-xs font-semibold text-gray-300 uppercase tracking-wider shrink-0 z-20"
      >
        <div class="flex items-center justify-center">ID</div>
        <div class="flex items-center pl-4">Назва турніру</div>
        <div class="flex items-center justify-center">Тип</div>
        <div class="flex items-center justify-center">Дивізіон</div>
        <div class="flex items-center justify-center">Статус</div>
        <div class="flex items-center justify-center">Дії</div>
      </div>

      <div v-loading="isLoading" class="flex-1 min-h-0 w-full relative">
        <VirtualList
          v-if="tournaments?.length"
          :items="tournaments"
          :grid-items="1"
          :item-height="80"
          id-key="id"
          is-table
          class="h-full w-full"
        >
          <template #item="{ item }">
            <!-- NOTE: Необходимо добавить width: 100% для TournamentRow захардкодджено через ширину 1500px -->
            <TournamentRow
              :tournament="item"
              class="h-[80px] w-full"
              @edit="openUpdateModal"
            />
          </template>
        </VirtualList>

        <div v-else-if="!isLoading" class="flex items-center justify-center h-full text-gray-500">
          Турнірів немає
        </div>
      </div>
    </div>
  </div>

  <CreateTournamentDrawer v-model="showCreateTournamentDrawer" />
  <UpdateTournamentDrawer v-model="showUpdateTournamentDrawer" :newTournamentData="newTournamentData" />
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue'
import { useGetTournaments } from '@/composables/query/use-tournaments'
import TournamentRow from './TournamentRow.vue'

const showCreateTournamentDrawer = ref(false)
const showUpdateTournamentDrawer = ref(false)
const newTournamentData = ref<TTournament | null>(null)

const { data: tournaments, isLoading } = useGetTournaments()

const openUpdateModal = (tournament: TTournament) => {
  newTournamentData.value = tournament
  showUpdateTournamentDrawer.value = true
}
</script>

<style scoped>
.grid-header {
  display: grid;
  /* Сетка должна совпадать с TournamentRow точь-в-точь */
  grid-template-columns: 80px minmax(250px, 1fr) 180px 140px 180px 100px;
  height: 48px;
  width: 100%;
  /* ВАЖНО: Компенсация ширины скроллбара (обычно 6px для кастомных скроллов) */
  padding-right: 6px;
}

.grid-header > div {
  /* Небольшие отступы внутри ячеек */
  padding: 0 4px;
}
</style>
