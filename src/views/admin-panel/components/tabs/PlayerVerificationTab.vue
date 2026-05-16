<template>
  <div class="h-full flex flex-col">
    <div class="flex-1 min-h-0 rounded-xl border border-white/10 bg-[#111827] shadow-xl overflow-hidden">
      <el-table
        v-loading="isLoading"
        :data="requests"
        height="100%"
        style="width: 100%"
        class="custom-table"
        empty-text="Запитів немає"
      >
        <el-table-column prop="id" label="ID" width="80" align="center">
          <template #default="{ row }">
            <span class="text-gray-500 font-mono text-xs">#{{ row.id }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="type" label="Тип запиту" min-width="150" align="center">
          <template #default="{ row }">
            <RequestTypeTag :type="row.type" />
          </template>
        </el-table-column>

        <el-table-column prop="status" label="Статус" width="150" align="center">
          <template #default="{ row }">
            <RequestStatusTag :status="row.status" />
          </template>
        </el-table-column>

        <el-table-column label="Автор" width="160" align="center">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              class="!flex items-center gap-2 group transition-all w-full"
              @click.stop="openUserProfile(row.requestor_id)"
            >
              <span class="text-gray-400 group-hover:text-cyan-400 font-mono text-xs transition-colors">
                User: {{ row.requestor_id }}
              </span>
              <el-icon class="text-gray-500 group-hover:text-cyan-400 transition-colors"><TopRight /></el-icon>
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="Дії" width="180" align="center">
          <template #default="{ row }">
            <el-button
              type="success"
              class="!w-full !justify-start !bg-green-600/20 !border-green-500/30
                      hover:!bg-green-600 hover:!border-green-500 text-green-400
                       hover:text-white transition-all group"
              @click="handleTake(row.id)"
            >
              <el-icon class="mr-2 group-hover:scale-110 transition-transform"><Check /></el-icon>
              Прийняти запит
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
// TODO: endpoint not in API yet
// import { useGetRequests } from '@/composables/query/use-requests'
import { Check, TopRight } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { routeNames } from '@/router/route-names'
import { adminPanelService } from '@/views/admin-panel/admin-panel.service'
import RequestStatusTag from '@/components/request-tags/RequestStatusTag.vue'
import RequestTypeTag from '@/components/request-tags/RequestTypeTag.vue'

const router = useRouter()
// TODO: endpoint not in API yet
const requests = ref<any[]>([])
const isLoading = ref(false)
const refetch = async () => {}

const handleTake = async (requestId: number) => {
  try {
    await adminPanelService.handleTake(requestId)
    await refetch()
  } catch (e) {
    console.error(e)
  }
}

const openUserProfile = (userId: number) => {
  router.push({ name: routeNames.player, params: { id: userId } })
}
</script>

<style scoped>
/* Стилізація таблиці */
:deep(.custom-table) {
  --el-table-border-color: rgba(255, 255, 255, 0.05);
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: rgba(255, 255, 255, 0.03);
  --el-table-row-hover-bg-color: rgba(255, 255, 255, 0.05);
  --el-table-text-color: #9ca3af;
  --el-table-header-text-color: #e5e7eb;
  background-color: transparent !important;
}

:deep(.el-table__inner-wrapper::before),
:deep(.el-table__border-left-patch) {
  display: none;
}

:deep(.el-table--border) {
  border-color: rgba(255, 255, 255, 0.05);
}

:deep(.el-table th.el-table__cell) {
  background-color: rgba(17, 24, 39, 0.8) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
}

:deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
}

/* Стилізація розгорнутого рядка */
:deep(.el-table__expanded-cell) {
  background-color: transparent !important;
  padding: 0 !important;
}

:deep(.el-table__expand-icon) {
  color: #9ca3af;
}

/* Скролбар */
:deep(.el-table__body-wrapper::-webkit-scrollbar) {
  width: 6px;
  height: 6px;
}
:deep(.el-table__body-wrapper::-webkit-scrollbar-track) {
  background: rgba(0, 0, 0, 0.2);
}
:deep(.el-table__body-wrapper::-webkit-scrollbar-thumb) {
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
}
:deep(.el-table__body-wrapper::-webkit-scrollbar-thumb:hover) {
  background-color: rgba(255, 255, 255, 0.25);
}
</style>
