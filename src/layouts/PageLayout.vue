<template>
  <div class="app-root bg-bg-primary text-gray-100">
    <!-- ─── Global atmospheric background (matches the landing hero) ───────
         Fixed behind all content. The app uses single-scroll architecture
         (.app-main scrolls internally), so this layer stays put in the
         viewport exactly like the hero backdrop. -->
    <div class="app-atmosphere" aria-hidden="true">
      <div class="atm-glow-cyan" />
      <div class="atm-glow-purple" />
      <div class="atm-grid" />
      <div class="atm-vignette" />
    </div>

    <Header />
    <MobileMenu />

    <main class="app-main pb-[64px] lg:pb-0">
      <router-view #default="{ Component }">
        <transition name="fade">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <Footer class="hidden lg:flex" />
    <MobileBottomTabBar />
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
/* Establish a stacking context so the fixed atmosphere can sit at z-index:-1,
   behind in-flow content but above the app-root base color. Drop the legacy
   cartographer texture in favour of the hero's grid + glow layers. */
.app-root {
  isolation: isolate;
  background-image: none;
}

.app-atmosphere {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
}

/* ─── Atmospheric layers (ported from the landing hero) ────────────────── */
.atm-glow-cyan {
  position: absolute;
  top: -20%;
  left: -15%;
  width: 65%;
  height: 75%;
  background: radial-gradient(ellipse at center, rgba(67, 191, 238, 0.13) 0%, transparent 68%);
  animation: glow-breathe 9s ease-in-out infinite;
}

.atm-glow-purple {
  position: absolute;
  top: -8%;
  right: -12%;
  width: 55%;
  height: 65%;
  background: radial-gradient(ellipse at center, rgba(139, 92, 246, 0.1) 0%, transparent 65%);
  animation: glow-breathe 11s ease-in-out infinite reverse;
}

.atm-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 15%, black, transparent);
  -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 15%, black, transparent);
}

/* Softer than the hero vignette so content stays readable across full pages. */
.atm-vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% 0%, transparent 55%, rgba(10, 7, 17, 0.85) 100%);
}

@keyframes glow-breathe {
  0%, 100% { transform: scale(1) translateY(0); opacity: 1; }
  50% { transform: scale(1.06) translateY(-2%); opacity: 0.8; }
}

@media (prefers-reduced-motion: reduce) {
  .atm-glow-cyan,
  .atm-glow-purple {
    animation: none;
  }
}
</style>
