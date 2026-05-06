<template>
  <div class="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
    <div
      class="flex flex-col gap-14 sm:flex-row sm:items-center sm:justify-between px-15 py-14 md:px-20
        border-b border-white/10 bg-white/[0.02]"
    >
      <div class="min-w-0">
        <h3 class="text-base font-semibold text-white tracking-tight">
          Кваліфікаційні матчі
        </h3>
        <p class="text-xs text-gray-500 mt-4 leading-snug">
          Призначені пари та зафіксовані результати турніру. Подати гру можна через «Додати результат» вище —
          у формі достатньо вказати ID матчу.
        </p>
      </div>
      <div v-if="showAddResultButton" class="shrink-0">
        <el-button
          type="primary"
          class="!rounded-lg !border-cyan-600 !bg-cyan-600"
          @click="$emit('add-result')"
        >
          <el-icon class="mr-6"><Plus /></el-icon>
          Додати результат
        </el-button>
      </div>
    </div>

    <div
      v-loading="loading"
      element-loading-background="rgba(19,26,42,0.65)"
      class="relative min-h-[120px]"
    >
      <div
        v-if="matches.length === 0"
        class="py-36 px-18 flex flex-col items-center gap-14 text-center"
      >
        <div
          class="w-52 h-52 rounded-full border border-dashed border-white/15 flex items-center
            justify-center bg-white/[0.03]"
        >
          <el-icon :size="28" class="text-gray-600 opacity-70"><Trophy /></el-icon>
        </div>
        <div class="max-w-md flex flex-col items-center">
          <p class="text-white font-medium text-sm">Поки немає матчів</p>
          <p class="text-gray-500 text-sm mt-8 leading-relaxed">
            Після формування сітки тут з’являться пари та результати. Щоб зафіксувати зіграну гру, натисніть
            «Додати результат» і введіть ID матчу Dota 2.
          </p>
          <el-button
            v-if="showAddResultButton"
            type="primary"
            class="!rounded-lg !border-cyan-600 !bg-cyan-600 mt-20"
            @click="$emit('add-result')"
          >
            <el-icon class="mr-6"><Plus /></el-icon>
            Додати результат
          </el-button>
        </div>
      </div>

      <el-table
        v-else
        :data="matches"
        row-key="id"
        class="qual-table bg-[#131a2a]"
        empty-text="Немає матчів"
      >
        <el-table-column label="ID" width="108" fixed="left">
          <template #default="{ row }">
            <el-tooltip :content="row.id" placement="top">
              <span class="font-mono text-xs text-gray-400 cursor-default">{{ shortenId(row.id) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="Команда A" min-width="140">
          <template #default="{ row }">
            <span class="text-white font-semibold">{{ row.teamA.name }}</span>
          </template>
        </el-table-column>
        <el-table-column width="44" align="center">
          <span class="text-gray-600 text-xs font-medium">vs</span>
        </el-table-column>
        <el-table-column label="Команда B" min-width="140">
          <template #default="{ row }">
            <span class="text-white font-semibold">{{ row.teamB.name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Статус" width="128">
          <template #default="{ row }">
            <el-tag v-if="isResolved(row)" type="success" size="small" effect="dark" class="!rounded-md">
              Зафіксовано
            </el-tag>
            <el-tag v-else type="info" size="small" effect="dark" class="!rounded-md">
              Очікується
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Результат" min-width="160">
          <template #default="{ row }">
            <template v-if="row.winner?.name">
              <span class="text-emerald-300 text-sm">Перемога: {{ row.winner.name }}</span>
            </template>
            <template v-else-if="row.dotaMatchId">
              <span class="text-gray-400 text-sm">Матч подано</span>
            </template>
            <template v-else>
              <span class="text-gray-500 text-sm">—</span>
            </template>
          </template>
        </el-table-column>
        <el-table-column label="ID матчу Dota 2" min-width="134">
          <template #default="{ row }">
            <span v-if="row.dotaMatchId" class="font-mono text-xs text-cyan-300">{{ row.dotaMatchId }}</span>
            <span v-else class="text-gray-600 text-sm">—</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus, Trophy } from '@element-plus/icons-vue'
import type { TQualificationMatch as QualificationMatch } from '@/api/types/api.types'

defineProps<{
  matches: QualificationMatch[]
  loading: boolean
  showAddResultButton: boolean
}>()

defineEmits<{
  'add-result': []
}>()

function shortenId (id: string): string {
  if (id.length <= 10) return id
  return `${id.slice(0, 6)}…${id.slice(-4)}`
}

function isResolved (row: QualificationMatch): boolean {
  return !!(row.dotaMatchId || row.winner)
}
</script>

<style scoped>
:deep(.qual-table.el-table) {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: rgba(255, 255, 255, 0.04);
  --el-table-row-hover-bg-color: rgba(255, 255, 255, 0.04);
}
</style>
