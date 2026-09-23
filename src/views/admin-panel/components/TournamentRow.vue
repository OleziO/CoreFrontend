<template>
  <div
    class="grid-row group relative flex items-center
     hover:bg-white/5 transition-colors border-b border-white/5 cursor-pointer"
    @click="$emit('edit', tournament)"
  >
    <div class="col-id flex justify-center items-center">
      <span class="text-gray-500 font-mono text-xs">#{{ tournament.id }}</span>
    </div>

    <div class="col-title flex flex-col justify-center py-2 pr-4 pl-4 overflow-hidden">
      <span class="font-bold text-gray-200 text-base truncate">{{ tournament.name }}</span>
    </div>

    <div class="col-type flex items-center justify-center">
      <span class="text-gray-400 text-xs">—</span>
    </div>

    <div class="col-status flex items-center justify-center">
      <TournamentStatusTag :status="tournament.tournamentStatus" />
    </div>

    <div class="col-actions flex justify-center items-center" @click.stop>
      <el-tooltip content="Редагувати" placement="top" :enterable="false">
        <el-button
          type="primary"
          text
          class="btn-icon"
          @click="$emit('edit', tournament)"
        >
          <el-icon size="20"><EditPen /></el-icon>
        </el-button>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { EditPen } from '@element-plus/icons-vue'
import TournamentStatusTag from '@/components/tournaments-tags/TournamentStatusTag.vue'

defineProps<{
  tournament: TTournament
}>()

defineEmits(['edit'])
</script>

<style scoped>
.grid-row {
  display: grid;
  /* Сетка должна совпадать с TournamentsPage.vue */
  grid-template-columns: 80px minmax(250px, 1fr) 180px 140px 180px 100px;
  height: 100%;
  width: 1500px;
  /* width: 100%; */
}

/* Дополнительно: чтобы контент не прилипал к краям ячеек */
.grid-row > div {
  padding: 0 4px;
}
</style>
