<template>
  <header
    class="
      sticky left-0 top-0 z-50 w-full
      border-b border-white/10
      shadow-elevation-3
      after:absolute after:left-0 after:right-0 after:bottom-0
      after:h-16
      after:pointer-events-none
      flex items-center
    "
  >
    <div
      class="
        flex w-full h-60 px-20 lg:px-40
        bg-surface/80 backdrop-blur-xl
        items-center lg:justify-between justify-center
      "
    >
      <!-- LOGO -->
      <RouterLink
        :to="{ name: routeNames.rootPage }"
        class="flex h-full max-w-[130px] items-center"
      >
        <el-image
          class="h-full select-none"
          fit="contain"
          :src="logo"
          alt="Core League"
        />
      </RouterLink>

      <!-- RIGHT SIDE -->
      <div class="flex items-center gap-12 py-15">
        <!-- USER -->
        <el-dropdown
          v-if="authStore.token"
          class="hidden lg:flex"
          trigger="click"
          popper-class="header-dropdown"
        >
          <div
            role="button"
            tabindex="0"
            aria-haspopup="menu"
            :aria-label="userMenuLabel"
            class="
              flex items-center gap-10 cursor-pointer
              rounded-2xl pl-12 pr-10 py-2
              border border-white/10
              bg-white/5
              hover:bg-white/10
              hover:border-white/20
              focus-visible:outline-none focus-visible:border-primary/60
              focus-visible:ring-2 focus-visible:ring-primary/40
              transition-all duration-200
            "
          >
            <span class="text-sm text-white/80 max-w-[120px] truncate">
              {{ authStore.user?.discordName }}
            </span>

            <el-image
              class="h-36 w-36 rounded-full border border-white/25"
              :src="authStore.user?.avatarUrl ?? ''"
              fit="cover"
            />

            <PhCaretDown :size="14" class="text-white/50 shrink-0" />
          </div>

          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                :class="{
                  'header-user-menu__item--active': route.name === routeNames.profile
                }"
              >
                <RouterLink
                  :to="{ name: routeNames.profile }"
                  active-class=""
                  exact-active-class=""
                  class="flex w-full items-center no-underline text-inherit"
                >
                  <PhUser :size="20" />
                  <span class="ml-8">Профіль</span>
                </RouterLink>
              </el-dropdown-item>

              <el-dropdown-item
                v-if="hasAdminUaRole"
                divided
                :class="{
                  'header-user-menu__item--active': route.name === routeNames.adminPanel
                }"
                @click="router.push({ name: routeNames.adminPanel })"
              >
                <PhGauge :size="20" />
                <span class="ml-8">Адмінка</span>
              </el-dropdown-item>

              <el-dropdown-item
                v-if="hasAdminUaRole"
                @click.stop="showCreateTournamentDrawer = true"
              >
                <PhTrophy :size="20" />
                <span class="ml-8">Створити турнір</span>
              </el-dropdown-item>

              <el-dropdown-item
                v-if="hasAdminUaRole"
                @click="router.push({ name: routeNames.financeMonitor })"
              >
                <PhCurrencyCircleDollar :size="20" />
                <span class="ml-8">Фінанси</span>
              </el-dropdown-item>

              <el-dropdown-item
                class="header-user-menu__item--danger"
                divided
                @click="authStore.logout"
              >
                <PhSignOut :size="20" />
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
      </div>
    </div>
  </header>

  <CreateTournamentDrawer
    v-if="authStore.token && hasAdminUaRole"
    v-model="showCreateTournamentDrawer"
  />
</template>

<script setup lang="ts">
import { routeNames } from '@/router/route-names'
import logo from '@/assets/images/core-league-logo-full.png'
import {
  PhDiscordLogo, PhSignOut, PhUser, PhTrophy, PhCurrencyCircleDollar, PhCaretDown, PhGauge
} from '@phosphor-icons/vue'
import CreateTournamentDrawer from '@/views/admin-panel/components/drawers/CreateTournamentDrawer.vue'
import { hasAdminRole } from '@/core/helpers'

const authStore = useAuthStore()
const showCreateTournamentDrawer = ref(false)

/** Єдиний предикат адмінського доступу — спільний із гардом роуту /finance. */
const hasAdminUaRole = computed(() => hasAdminRole(authStore.user?.roles))

const userMenuLabel = computed(
  () => `Меню користувача: ${authStore.user?.discordName ?? ''}`
)

const route = useRoute()
const router = useRouter()
</script>
