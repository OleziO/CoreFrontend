<template>
  <header
    class="
      sticky left-0 top-0 z-50 w-full
      border-b-2 border-white/15
      shadow-[0_10px_30px_rgba(0,0,0,0.35)]
      after:absolute after:left-0 after:right-0 after:bottom-0
      after:h-16
      after:pointer-events-none
      flex items-center
    "
  >
    <div
      class="
        flex w-full h-60 px-20 lg:px-40
        backdrop-blur-xl
        items-center justify-between
      "
    >
      <!-- LOGO -->
      <div
        class="flex h-full items-center cursor-pointer max-w-[130px]"
        @click="$router.push({ name: routeNames.rootPage })"
      >
        <el-image
          class="h-full select-none"
          fit="contain"
          :src="logo"
          alt="Core League"
        />
      </div>

      <!-- DESKTOP NAV -->
      <nav class="lg:flex items-center gap-20 hidden h-full">
        <el-button
          v-for="link in navLinks"
          :key="link.name"
          type="primary"
          link
          class="
            text-sm font-medium tracking-wide
            !text-white/70 hover:!text-primary rounded-none
            transition-colors !h-full
          "
          :class="{
            '!border-b-2 !border-b-primary': $route.name === link.name
          }"
          @click="$router.push({ name: link.name })"
        >
          {{ link.label }}
        </el-button>

        <RoleGuard :roles="['admin', 'moderator']">
          <el-button
            type="primary"
            link
            class="
              text-sm font-medium tracking-wide
              !text-white/70 hover:!text-primary rounded-none
              transition-colors !h-full
            "
            :class="{
              '!border-b-2 !border-b-primary': $route.name === routeNames.adminPanel
            }"
            @click="$router.push({ name: routeNames.adminPanel })"
          >
            Адмінка
          </el-button>
        </RoleGuard>
      </nav>

      <!-- RIGHT SIDE -->
      <div class="flex items-center gap-12 py-15">
        <!-- USER -->
        <el-dropdown
          v-if="authStore.token"
          class="hidden lg:flex"
          trigger="hover"
          popper-class="header-dropdown"
        >
          <div
            class="
              flex items-center gap-10 cursor-pointer
              rounded-2xl pl-12 pr-8 py-2
              border border-white/10
              bg-white/5
              hover:bg-white/10
              hover:border-white/20
              transition-all duration-200
            "
          >
            <span class="text-sm text-white/80 max-w-[120px] truncate">
              {{ authStore.user?.discordName }}
            </span>

            <el-image
              class="h-36 w-36 rounded-full border border-white/25"
              :src="`${urlForProfileImg}${authStore.user?.avatarUrl}`"
              fit="cover"
            />
          </div>

          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                class="!ext-red-400"
                @click="authStore.logout"
              >
                <PhSignOut />
                <span class="ml-8">Вийти з аккаунту</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <!-- LOGIN -->
        <el-button
          v-else
          type="primary"
          class="hidden lg:flex w-full items-center justify-center gap-2 h-40"
          :loading="authStore.loginLoading"
          @click="authStore.startDiscordLogin()"
        >
          <PhDiscordLogo size="20" weight="bold" />
          <span class="ml-10 text-sm font-medium">
            Увійти через Discord
          </span>
        </el-button>

        <!-- BURGER -->
        <Burger class="flex lg:hidden" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { routeNames } from '@/router/route-names'
import logo from '@/assets/LongLogo.png'
import { PhDiscordLogo, PhSignOut } from '@phosphor-icons/vue'
import RoleGuard from '@/guards/RoleGuard.vue'

const authStore = useAuthStore()

const urlForProfileImg = import.meta.env.VITE_API_PUBLIC_URL

const navLinks = computed(() => {
  const links: { name: string; label: string }[] = [
    { name: routeNames.rootPage, label: 'Головна' },
    { name: routeNames.tournaments, label: 'Турніри' },
    { name: routeNames.teams, label: 'Команди' },
    { name: routeNames.players, label: 'Гравці' }
  ]
  if (authStore.token) {
    links.push({ name: routeNames.profile, label: 'Профіль' })
  }
  return links
})

</script>

<style>
.header-dropdown {
  @apply
    rounded-2xl
    border border-white/15
    backdrop-blur-xl
    shadow-[0_20px_50px_rgba(0,0,0,0.6)]
    overflow-hidden;
}

.header-dropdown.el-popper.is-light.el-tooltip {
  @apply p-0 border-none bg-[transparent];
}

.header-dropdown .el-dropdown-menu {
  @apply p-0;
}

.header-dropdown .el-dropdown-menu__item {
  @apply px-16 py-10 text-sm rounded-none text-white/80 transition-all duration-150;
}

.header-dropdown .el-dropdown-menu__item:not(.is-disabled):hover,
.header-dropdown .el-dropdown-menu__item:not(.is-disabled):focus {
  @apply bg-white/10 text-white;
}

.header-dropdown .el-dropdown-menu__item.is-disabled {
  @apply opacity-40;
}

</style>
