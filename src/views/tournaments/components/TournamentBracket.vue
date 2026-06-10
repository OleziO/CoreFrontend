<template>
  <div>
    <div
      v-if="canSubmitPlayoffMatch || isLocalhost || (canManagePlayers && isPlayoffPhase)"
      class="flex justify-end gap-10 mb-12"
    >
      <el-button
        v-if="isLocalhost"
        type="warning"
        @click="emit('openTestMatchModal', 'playoff')"
      >
        Test match creation
      </el-button>
      <el-button
        v-if="canManagePlayers && isPlayoffPhase"
        type="danger"
        plain
        @click="emit('openTechLossPlayoff')"
      >
        Технічна поразка
      </el-button>
      <el-button
        v-if="canSubmitPlayoffMatch"
        type="primary"
        @click="emit('openPlayoffSubmit')"
      >
        Подати результат матчу
      </el-button>
    </div>

    <div class="rounded-xl flex items-center justify-center relative overflow-hidden">
      <div
        v-if="playoffLoading"
        class="w-full py-20 flex justify-center items-center flex-col text-center
        border border-dashed border-white/[0.07] rounded-2xl bg-white/[0.04]"
      >
        <PhBracketsCurly :size="40" class="text-gray-600 mb-4 animate-pulse" />
        <p class="text-sm text-gray-400 max-w-sm">
          Завантаження сітки…
        </p>
      </div>
      <div
        v-else-if="playoffEmbedUrl"
        class="w-full overflow-x-auto rounded-xl border border-white/10 bg-surface/40 p-8 shadow-elevation-2"
      >
        <iframe
          :src="getBracketUrl(playoffEmbedUrl)"
          width="100%"
          height="500"
          class="sm:h-[600px] min-w-[640px] rounded-lg border-0"
          frameborder="0"
          scrolling="auto"
          allowtransparency="true"
        />
      </div>
      <div
        v-else-if="!isPlayoffPhase"
        class="w-full py-20 flex justify-center items-center flex-col text-center
        border border-dashed border-white/[0.07] rounded-2xl bg-white/[0.04]"
      >
        <PhBracketsCurly :size="40" class="text-gray-600 mb-4" />
        <p class="text-sm text-gray-400 max-w-sm">
          Сітка доступна під час плей-оф
        </p>
      </div>
      <div
        v-else
        class="w-full py-20 flex justify-center items-center flex-col text-center
        border border-dashed border-white/[0.07] rounded-2xl bg-white/[0.04]"
      >
        <PhBracketsCurly :size="40" class="text-gray-600 mb-4" />
        <p class="text-sm text-gray-400 max-w-sm">
          Сітку плей-оф ще не сформовано
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhBracketsCurly } from '@phosphor-icons/vue'

interface IProps {
  playoffLoading: boolean
  playoffEmbedUrl: string
  isPlayoffPhase: boolean
  canSubmitPlayoffMatch: boolean
  canManagePlayers: boolean
  isLocalhost: boolean
}

defineProps<IProps>()

const emit = defineEmits<{
  openPlayoffSubmit: []
  openTechLossPlayoff: []
  openTestMatchModal: [phase: 'qualification' | 'playoff']
}>()

function getBracketUrl (url: string): string {
  if (!url) return ''
  if (url.includes('challonge.com') && !url.includes('/module')) {
    return url.replace(/\/$/, '') + '/module'
  }
  return url
}
</script>
