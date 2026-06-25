<template>
  <div class="h-full flex flex-col gap-12 overflow-hidden">
    <!-- Status filter -->
    <div class="flex gap-8 shrink-0">
      <el-button
        v-for="f in filters"
        :key="f.value"
        :type="activeFilter === f.value ? 'primary' : 'default'"
        size="small"
        @click="setFilter(f.value)"
      >
        {{ f.label }}
      </el-button>
    </div>

    <!-- Table -->
    <div class="flex-1 min-h-0 rounded-xl border border-white/10 bg-gray-900 shadow-xl overflow-hidden">
      <el-table
        v-loading="isLoading"
        :data="mmrStore.requests"
        height="100%"
        class="w-full custom-table"
        empty-text="Запитів немає"
      >
        <!-- Player -->
        <el-table-column label="Гравець" min-width="180">
          <template #default="{ row }">
            <RouterLink
              :to="{ name: routeNames.player, params: { id: row.playerId } }"
              class="flex items-center gap-8 no-underline group"
            >
              <el-avatar :size="28" :src="row.player?.avatarUrl ?? ''" class="shrink-0">
                <PhUser :size="14" />
              </el-avatar>
              <span class="text-sm text-gray-300 group-hover:text-primary transition truncate">
                {{ row.player?.discordName || row.player?.discordUsername || row.playerId }}
              </span>
            </RouterLink>
          </template>
        </el-table-column>

        <!-- MMR delta -->
        <el-table-column label="MMR" width="160" align="center">
          <template #default="{ row }">
            <div class="flex items-center justify-center gap-8 tabular-nums">
              <span class="text-gray-400">{{ row.oldMmr }}</span>
              <PhArrowRight size="14" class="text-gray-600 shrink-0" />
              <span class="text-white font-semibold">{{ row.newMmr }}</span>
            </div>
          </template>
        </el-table-column>

        <!-- Date -->
        <el-table-column label="Дата" width="140" align="center">
          <template #default="{ row }">
            <span class="text-gray-400 text-sm">{{ formatCreatedAt(row.createdAt) }}</span>
          </template>
        </el-table-column>

        <!-- Proofs -->
        <el-table-column label="Докази" width="140" align="center">
          <template #default="{ row }">
            <div class="flex items-center justify-center gap-4 flex-wrap">
              <button
                v-for="(proof, idx) in row.proofs"
                :key="proof.id"
                type="button"
                class="w-[36px] h-[22px] rounded overflow-hidden border border-white/10
                       hover:border-primary/40 transition cursor-zoom-in"
                @click="openCarousel(row, idx as number)"
              >
                <img :src="proof.url" alt="" class="w-full h-full object-cover">
              </button>
              <span v-if="!row.proofs?.length" class="text-gray-500 text-xs">—</span>
            </div>
          </template>
        </el-table-column>

        <!-- Actions -->
        <el-table-column label="Дії" width="180" align="center">
          <template #default="{ row }">
            <div v-if="row.status === 'pending'" class="flex gap-6 justify-center">
              <el-button
                type="success"
                size="small"
                :loading="processingId === row.id"
                @click="approve(row)"
              >
                Схвалити
              </el-button>
              <el-button
                type="danger"
                size="small"
                :loading="processingId === row.id"
                @click="reject(row)"
              >
                Відхилити
              </el-button>
            </div>
            <span v-else class="text-xs text-gray-500 capitalize">{{ statusLabel(row.status) }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Proof carousel dialog -->
    <el-dialog
      v-model="carouselVisible"
      width="90vw"
      append-to-body
      destroy-on-close
      title="Докази"
      class="mmr-proof-dialog"
    >
      <el-carousel
        :initial-index="carouselStart"
        height="100%"
        :autoplay="false"
        trigger="click"
        indicator-position="outside"
      >
        <el-carousel-item
          v-for="(proof, idx) in carouselProofs"
          :key="proof.id"
        >
          <div class="flex items-center justify-center h-full bg-black/30 rounded-lg overflow-hidden">
            <el-image
              :src="proof.url"
              :preview-src-list="proofUrls"
              :initial-index="idx as number"
              fit="contain"
              preview-teleported
              hide-on-click-modal
              class="w-full h-full cursor-zoom-in"
            />
          </div>
        </el-carousel-item>
      </el-carousel>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { PhUser, PhArrowRight } from '@phosphor-icons/vue'
import { ElMessage } from 'element-plus'
import { routeNames } from '@/router/route-names'
import type { TMmrUpdateRequest, TMmrProof } from '@/views/players/mmr-requests.service'

type TFilter = 'pending' | 'approved' | 'rejected'

const filters: { value: TFilter; label: string }[] = [
  { value: 'pending', label: 'Очікують' },
  { value: 'approved', label: 'Схвалені' },
  { value: 'rejected', label: 'Відхилені' }
]

const mmrStore = useMmrRequestsStore()

const activeFilter = ref<TFilter>('pending')
const isLoading = ref(false)
const processingId = ref<string | null>(null)

const carouselVisible = ref(false)
const carouselProofs = ref<TMmrProof[]>([])
const carouselStart = ref(0)

const proofUrls = computed(() => carouselProofs.value.map((p) => p.url))

async function fetchRequests () {
  isLoading.value = true
  try {
    await mmrStore.fetchRequests(activeFilter.value)
  } catch {
    ElMessage.error('Не вдалося завантажити запити')
  } finally {
    isLoading.value = false
  }
}

async function setFilter (filter: TFilter) {
  activeFilter.value = filter
  await fetchRequests()
}

async function approve (row: TMmrUpdateRequest) {
  if (processingId.value) return
  processingId.value = row.id
  try {
    await mmrStore.approve(row.id)
    ElMessage.success('Запит схвалено')
  } catch {
    ElMessage.error('Не вдалося схвалити запит')
  } finally {
    processingId.value = null
  }
}

async function reject (row: TMmrUpdateRequest) {
  if (processingId.value) return
  processingId.value = row.id
  try {
    await mmrStore.reject(row.id)
    ElMessage.success('Запит відхилено')
  } catch {
    ElMessage.error('Не вдалося відхилити запит')
  } finally {
    processingId.value = null
  }
}

function openCarousel (row: TMmrUpdateRequest, idx: number) {
  carouselProofs.value = row.proofs
  carouselStart.value = idx
  carouselVisible.value = true
}

function formatCreatedAt (dateStr: string): string {
  if (!dateStr) return '—'
  return dayjs(dateStr).format('DD.MM.YYYY')
}

function statusLabel (status: string): string {
  if (status === 'approved') return 'Схвалено'
  if (status === 'rejected') return 'Відхилено'
  return status
}

onMounted(fetchRequests)
</script>

<!--
  Не scoped: el-dialog з append-to-body телепортується в <body>,
  тому scoped :deep() селектори не доходять до нього.
  Стилі прив'язані до унікального класу .mmr-proof-dialog.
-->
<style>
/* Майже повноекранне вікно з доказами — 80vw x 80vh, адаптивне */
.mmr-proof-dialog.el-dialog {
  max-width: 90vw;
  height: 90vh;
  margin: 5vh auto !important;
  display: flex;
  flex-direction: column;
}

.mmr-proof-dialog.el-dialog .el-dialog__body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* Карусель заповнює доступну висоту; лишаємо місце для індикаторів (outside) */
.mmr-proof-dialog.el-dialog .el-carousel {
  height: 100% !important;
}

.mmr-proof-dialog.el-dialog .el-carousel__container {
  height: calc(100% - 40px) !important;
}

@media (max-width: 768px) {
  .mmr-proof-dialog.el-dialog {
    width: 95vw !important;
    max-width: 95vw;
    height: 90vh;
    margin: 5vh auto !important;
  }
}
</style>
