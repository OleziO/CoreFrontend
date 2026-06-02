<template>
  <div class="app-root bg-bg-primary text-gray-100">
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

<script setup lang="ts"></script>
