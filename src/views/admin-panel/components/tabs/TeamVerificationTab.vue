<template>
  <div class="h-full flex flex-col">
    <div class="flex-1 min-h-0 rounded-xl border border-white/10 bg-gray-900 shadow-xl overflow-hidden">
      <el-table
        v-loading="isLoading"
        :data="requests"
        height="100%"
        class="w-full custom-table"
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
              class="!flex items-center gap-2 group transition-all"
              @click.stop="openTeamProfile(row.requestor_id)"
            >
              <span class="text-gray-400 group-hover:text-cyan-400 font-mono text-xs transition-colors">
                Team: {{ row.requestor_id }}
              </span>
              <el-icon class="text-gray-500 group-hover:text-cyan-400 transition-colors"><TopRight /></el-icon>
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="Дії" width="180" align="center">
          <template #default>
            <el-button
              type="success"
              class="!w-full !justify-start !bg-green-600/20 !border-green-500/30
                      hover:!bg-green-600 hover:!border-green-500 text-green-400
                       hover:text-white transition-all group"
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
import { Check, TopRight } from '@element-plus/icons-vue'
import { routeNames } from '@/router/route-names'
import RequestStatusTag from '@/components/request-tags/RequestStatusTag.vue'
import RequestTypeTag from '@/components/request-tags/RequestTypeTag.vue'

const router = useRouter()
const requests = ref<any[]>([])
const isLoading = ref(false)

const openTeamProfile = (userId: number) => {
  router.push({ name: routeNames.team, params: { id: userId } })
}
</script>
