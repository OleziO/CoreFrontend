<template>
  <div class="h-full flex flex-col">
    <!-- Табы по статусам -->
    <div class="flex gap-30 px-20 pt-20 border-b border-gray-800 shrink-0">
      <button
        v-for="tab in statusTabs"
        :key="tab.value"
        class="pb-10 text-base font-medium transition-all duration-300
        cursor-pointer outline-none focus:outline-none border-b-2 border-transparent"
        :class="activeStatusTab === tab.value ? 'text-primary border-primary' : 'text-gray-400 hover:text-gray-300'"
        @click="activeStatusTab = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>

    <div
      v-loading="isLoading"
      class="flex-1 min-h-0 rounded-xl shadow-xl overflow-auto p-6"
    >
      <div
        v-if="filteredAndSortedBugs && filteredAndSortedBugs.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-26 px-10"
      >
        <div
          v-for="(bug, index) in filteredAndSortedBugs"
          :key="bug.id"
          class="flex flex-col rounded-xl border border-white/10
           bg-[#0b1121]/50 hover:bg-[#0b1121]/70 transition-all duration-300 overflow-hidden group"
        >
          <!-- Изображение -->
          <div class="w-full aspect-video bg-[#111827] border-b border-white/10 relative overflow-hidden group/image">
            <el-image
              v-if="bug.img_url"
              :src="getImageUrl(bug.img_url)"
              :preview-src-list="getPreviewSrcList(bug.img_url)"
              show-progress
              :initial-index="index as number"
              fit="cover"
              class="w-full h-full  cursor-zoom-in"
            />
            <div
              v-if="bug.img_url"
              class="absolute inset-0 bg-black/0 group-hover/image:bg-black/30
             transition-colors flex items-center justify-center pointer-events-none"
            >
              <el-icon
                class="text-white opacity-0 group-hover/image:opacity-100
               transition-opacity drop-shadow-md"
                :size="25"
              >
                <ZoomIn />
              </el-icon>
            </div>
          </div>

          <!-- Детали бага -->
          <div class="flex flex-col gap-4 p-4 flex-1">
            <div class="flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  ID: #{{ bug.id }}
                </span>
                <span class="text-xs text-gray-500">
                  {{ formatDate(bug.created_on) }}
                </span>
              </div>
            </div>

            <div class="flex flex-col gap-2 flex-1">
              <p class="text-sm text-gray-200 leading-relaxed line-clamp-4">
                {{ bug.detail || 'Опис відсутній' }}
              </p>
            </div>

            <div v-if="bug.status" class="flex flex-col gap-2">
              <BugStatusTag :status="bug.status" />
            </div>

            <div v-if="bug.branch" class="flex items-center gap-2">
              <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Гілка:
              </span>
              <span class="text-xs text-gray-300 font-mono">{{ bug.branch }}</span>
            </div>

            <div v-if="bug.requestor_id" class="flex items-center gap-2">
              <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Автор:
              </span>
              <el-button
                link
                type="primary"
                size="small"
                class="!p-0 !h-auto text-cyan-400 hover:text-cyan-300 font-mono text-xs"
                @click="openUserProfile(bug.requestor_id)"
              >
                {{ bug.requestor.steam_name }}
              </el-button>
            </div>
            <div v-if="bug.assign_id" class="flex items-center gap-2">
              <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">
                DEV:
              </span>
              <el-button
                link
                type="primary"
                size="small"
                class="!p-0 !h-auto text-cyan-400 hover:text-cyan-300 font-mono text-xs"
                @click="openUserProfile(bug.assign_id)"
              >
                {{ bug.assign.steam_name }}
              </el-button>
            </div>
            <el-button
              v-if="getNextStatus(bug.status)"
              :loading="loadingStatusUpdate[bug.id]"
              :class="getButtonClass(bug.status)"
              class="w-full !h-auto rounded-lg px-8 py-4 text-[11px]
                  font-semibold tracking-wide !border transition-al"
              @click="handleUpdateStatus(bug.id, getNextStatus(bug.status)!)"
            >
              {{ getButtonLabel(bug.status) }}
            </el-button>
            <el-button
              v-else
              disabled
              class="w-full !h-auto rounded-lg px-8 py-4 text-[11px]
                  font-semibold tracking-wide !border !border-slate-500
                  !bg-slate-500/10 !text-slate-400"
            >
              Закрито
            </el-button>
          </div>
        </div>
      </div>

      <el-empty
        v-else
        description="Багів немає"
        :image-size="200"
        class="h-full flex items-center justify-center"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// TODO: endpoint not in API yet
// import { useGetBugs } from '@/composables/query/use-bugs'
import { getImageUrl } from '@/core/helpers'
import { ZoomIn } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { routeNames } from '@/router/route-names'
// import { bugService } from '@/services/bug.service'
import { ElMessage } from 'element-plus'
import BugStatusTag from '@/components/bug-tags/BugStatusTag.vue'
import { ERequestStatus, requestStatusLabelMap } from '@/components/bug-tags/status.constants'

const router = useRouter()
const authStore = useAuthStore()
// TODO: endpoint not in API yet
const bugs = ref<any[]>([])
const isLoading = ref(false)
// const refetch = async () => {}

const loadingStatusUpdate = ref<Record<number, boolean>>({})
const activeStatusTab = ref<string>('all')

const statusTabs = [
  { value: 'all', label: 'Всі' },
  { value: ERequestStatus.NEW, label: requestStatusLabelMap[ERequestStatus.NEW] },
  { value: ERequestStatus.ASSIGNED, label: requestStatusLabelMap[ERequestStatus.ASSIGNED] },
  { value: ERequestStatus.COMMITED, label: requestStatusLabelMap[ERequestStatus.COMMITED] },
  { value: ERequestStatus.MERGED, label: requestStatusLabelMap[ERequestStatus.MERGED] },
  { value: ERequestStatus.CLOSED, label: requestStatusLabelMap[ERequestStatus.CLOSED] }
]

const bugsList = computed(() => {
  if (Array.isArray(bugs.value)) {
    return bugs.value
  }
  return (bugs.value as any)?.data || []
})

const filteredBugs = computed(() => {
  if (activeStatusTab.value === 'all') {
    return bugsList.value
  }
  return bugsList.value.filter((bug: any) => bug.status === activeStatusTab.value)
})

const filteredAndSortedBugs = computed(() => {
  const currentUserId = authStore.user?.id
  if (!currentUserId) {
    return filteredBugs.value
  }

  return [...filteredBugs.value].sort((a: any, b: any) => {
    const aIsAssignedToMe = a.assign_id === currentUserId
    const bIsAssignedToMe = b.assign_id === currentUserId

    if (aIsAssignedToMe && !bIsAssignedToMe) return -1
    if (!aIsAssignedToMe && bIsAssignedToMe) return 1
    return 0
  })
})

const getPreviewSrcList = (imgUrl: string | null | undefined) => {
  if (!imgUrl) return []
  const url = getImageUrl(imgUrl)
  return [url]
}

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('uk-UA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getNextStatus = (currentStatus: string): string | null => {
  const statusMap: Record<string, string> = {
    [ERequestStatus.NEW]: ERequestStatus.ASSIGNED,
    [ERequestStatus.ASSIGNED]: ERequestStatus.COMMITED,
    [ERequestStatus.COMMITED]: ERequestStatus.MERGED,
    [ERequestStatus.MERGED]: ERequestStatus.CLOSED
  }
  return statusMap[currentStatus] || null
}

const getButtonLabel = (currentStatus: string): string => {
  const labelMap: Record<string, string> = {
    [ERequestStatus.NEW]: 'Assign',
    [ERequestStatus.ASSIGNED]: 'Commit',
    [ERequestStatus.COMMITED]: 'Merge',
    [ERequestStatus.MERGED]: 'Close'
  }
  return labelMap[currentStatus] || ''
}

const getButtonClass = (currentStatus: string): string => {
  const classMap: Record<string, string> = {
    [ERequestStatus.NEW]: `
      !border !border-blue-500 !bg-blue-500 !text-blue-400
      hover:!bg-blue-500/20 hover:!border-blue-500/60
      shadow-[0_0_12px_rgba(59,130,246,0.2)]
    `,
    [ERequestStatus.ASSIGNED]: `
      !border !border-amber-500 !bg-amber-500 !text-amber-400
      hover:!bg-amber-500/20 hover:!border-amber-500/60
      shadow-[0_0_12px_rgba(245,158,11,0.2)]
    `,
    [ERequestStatus.COMMITED]: `
      !border !border-purple-500 !bg-purple-500 !text-purple-400
      hover:!bg-purple-500/20 hover:!border-purple-500/60
      shadow-[0_0_12px_rgba(168,85,247,0.2)]
    `,
    [ERequestStatus.MERGED]: `
      !border !border-emerald-500 !bg-emerald-500 !text-emerald-400
      hover:!bg-emerald-500/20 hover:!border-emerald-500/60
      shadow-[0_0_12px_rgba(16,185,129,0.2)]
    `
  }
  return classMap[currentStatus] || ''
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const handleUpdateStatus = async (_bugId: number, _newStatus: string) => {
  // TODO: endpoint not in API yet
  ElMessage.info('Функціонал оновлення статусу багу ще не реалізований в API')
  // const bugId = _bugId
  // const newStatus = _newStatus
  // loadingStatusUpdate.value[bugId] = true
  // try {
  //   // await bugService.updateBugStatus(bugId, newStatus)
  //   ElMessage.success('Статус успішно оновлено')
  //   await refetch()
  // } catch (error: any) {
  //   console.error('Помилка при оновленні статусу:', error)
  //   const errorMessage = error?.response?.data?.detail ||
  //                       error?.response?.data?.message ||
  //                       'Помилка при оновленні статусу. Спробуйте ще раз.'
  //   ElMessage.error(errorMessage)
  // } finally {
  //   loadingStatusUpdate.value[bugId] = false
  // }
}

const openUserProfile = (userId: number) => {
  router.push({ name: routeNames.player, params: { id: userId } })
}
</script>

<style scoped>
.line-clamp-4 {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
