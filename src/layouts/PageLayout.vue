<template>
  <div class="app-root bg-bg-primary text-gray-100">
    <canvas
      ref="snowCanvas"
      class="snow-canvas pointer-events-none"
    />

    <Header />
    <MobileMenu />

    <main class="app-main">
      <router-view #default="{ Component }">
        <transition name="fade">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <Footer />
  </div>
</template>

<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'

// =================== Snowfall ===================
const snowCanvas = ref<HTMLCanvasElement | null>(null)
let snowflakes: { x: number; y: number; r: number; d: number }[] = []
let animationFrameId: number
const window = useWindowSize()

function initSnow () {
  if (!snowCanvas.value) return
  const canvas = snowCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const w = canvas.width = window.width.value
  const h = canvas.height = window.height.value
  const numFlakes = 10
  snowflakes = []

  for (let i = 0; i < numFlakes; i++) {
    snowflakes.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 4 + 1,
      d: Math.random() * numFlakes
    })
  }

  function drawSnow () {
    ctx!.clearRect(0, 0, w, h)
    ctx!.fillStyle = 'rgba(255,255,255,0.8)' // трохи прозоріше
    ctx!.beginPath()
    for (const flake of snowflakes) {
      ctx!.moveTo(flake.x, flake.y)
      ctx!.arc(flake.x, flake.y, flake.r, 0, Math.PI * 2, true)
    }
    ctx!.fill()
    updateSnow()
    animationFrameId = requestAnimationFrame(drawSnow)
  }

  function updateSnow () {
    for (const flake of snowflakes) {
      flake.y += Math.pow(flake.d, 0.5) + 1
      flake.x += Math.sin(flake.d) * 0.5
      if (flake.y > h) {
        flake.y = 0
        flake.x = Math.random() * w
      }
    }
  }

  drawSnow()
}

onMounted(() => {
  initSnow()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationFrameId)
})
</script>

<style scoped>
.bg {
  background-color: #01000f;
  background-image: url("https://www.transparenttextures.com/patterns/cartographer.png");
}

canvas {
  z-index: 11; /* на фоні */
}
</style>
