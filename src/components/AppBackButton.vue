<template>
  <el-button
    v-if="currWindow.width.value >= 1024"
    class="
            absolute top-0 left-0 z-50
            rounded-lg
            bg-gray-800/70
            hover:bg-gray-700/90
            shadow-lg
            transition
            duration-300
            ease-out
            transform
            hover:-translate-y-1
            flex justify-center items-center p-20
          "
    @click="handleRedirectBack"
  >
    <PhArrowLeft weight="bold" class="text-white" />
    <span class="ml-8">Назад</span>
  </el-button>
</template>

<script setup lang="ts">
import { PhArrowLeft } from '@phosphor-icons/vue'

const currWindow = useWindowSize()
const router = useRouter()

function handleRedirectBack () {
  if (window.history.state.back === null) {
    return router.push('/')
  }

  return router.back()
}
</script>
