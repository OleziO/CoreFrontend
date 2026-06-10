<template>
  <div class="app-root bg-bg-primary text-gray-100">
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
