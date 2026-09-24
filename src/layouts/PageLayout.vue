<template>
  <div class="app-root bg-bg-primary text-gray-100">
    <!-- ─── Global atmospheric background (matches the landing hero) ───────
         Fixed behind all content. The app uses single-scroll architecture
         (.app-main scrolls internally), so this layer stays put in the
         viewport exactly like the hero backdrop. -->
    <div class="app-atmosphere" aria-hidden="true">
      <div class="atm-glow-cyan" />
      <div class="atm-glow-purple" />
      <div class="atm-glow-pink" />
      <div class="atm-grid" />
      <div class="scanlines" />
      <div class="atm-vignette" />
    </div>

    <Header />
    <MobileMenu />

    <main class="app-main pb-[64px] lg:pb-0">
      <router-view #default="{ Component }">
        <transition name="fade">
          <!-- key по path: між /teams/1 → /teams/2 інстанс сторінки інакше перевикористовується
               і `route.params.id`, зчитаний у setup, лишається старим -->
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>
    </main>

    <!-- lg+: липка смуга внизу екрана. На мобільному й планшеті футера немає:
         навігація — у таббарі, соцмережі та оферта — у MobileMenu -->
    <Footer />
    <MobileBottomTabBar />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
</script>

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

/* ─── Atmospheric layers (ported from the landing hero) ──────────────────
   Three neon lamps (cyan / violet / pink) breathing over a cyan-tinted grid,
   faint scanlines, and a vignette that pulls the edges back into the base. */
.atm-glow-cyan {
  position: absolute;
  top: -20%;
  left: -15%;
  width: 65%;
  height: 75%;
  background: radial-gradient(ellipse at center, rgba(46, 229, 255, 0.16) 0%, transparent 68%);
  animation: glow-breathe 9s ease-in-out infinite;
}

.atm-glow-purple {
  position: absolute;
  top: -8%;
  right: -12%;
  width: 55%;
  height: 65%;
  background: radial-gradient(ellipse at center, rgba(168, 85, 247, 0.12) 0%, transparent 65%);
  animation: glow-breathe 11s ease-in-out infinite reverse;
}

.atm-glow-pink {
  position: absolute;
  bottom: -25%;
  right: 10%;
  width: 50%;
  height: 55%;
  background: radial-gradient(ellipse at center, rgba(255, 47, 210, 0.07) 0%, transparent 65%);
  animation: glow-breathe 13s ease-in-out infinite;
}

.atm-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(46, 229, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(46, 229, 255, 0.05) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 15%, black, transparent);
  -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 15%, black, transparent);
}

/* Softer than the hero vignette so content stays readable across full pages. */
.atm-vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% 0%, transparent 55%, rgba(7, 8, 15, 0.85) 100%);
}

@keyframes glow-breathe {
  0%, 100% { transform: scale(1) translateY(0); opacity: 1; }
  50% { transform: scale(1.06) translateY(-2%); opacity: 0.8; }
}

@media (prefers-reduced-motion: reduce) {
  .atm-glow-cyan,
  .atm-glow-purple,
  .atm-glow-pink {
    animation: none;
  }
}
</style>
