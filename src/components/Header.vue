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
          v-for="link in links"
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

        <el-button
          type="primary"
          link
          class="
            text-sm font-medium tracking-wide
            text-white/70 hover:text-white
            transition-colors
          "
          @click="handleOpenBugModal"
        >
          Баги
        </el-button>
      </nav>

      <!-- RIGHT SIDE -->
      <div class="flex items-center gap-12 py-15">
        <!-- MAILBOX DROPDOWN -->
        <el-dropdown
          v-if="authStore.token"
          ref="mailboxDropdownRef"
          v-model="dropDown"
          class="hidden lg:flex"
          trigger="click"
          popper-class="mailbox-dropdown-popper mt-20"
          placement="left-start"
          @visible-change="handleMailboxDropdownVisible"
        >
          <el-badge
            :value="mailboxStore.unreadCount"
            :hidden="mailboxStore.unreadCount === 0"
            :offset="[-8, 4]"
            class="mailbox-badge"
          >
            <div
              class="
                flex items-center justify-center
                w-40 !h-36 py-2
                rounded-xl
                border border-white/10
                bg-white/5
                hover:bg-white/10
                hover:border-white/20
                transition-all duration-200
                cursor-pointer
              "
            >
              <PhEnvelope :size="18" class="text-white/80" />
            </div>
          </el-badge>

          <template #dropdown>
            <MailboxDropdown
              @open-modal="handleOpenModalFromDropdown"
            />
          </template>
        </el-dropdown>

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
              {{ authStore.user?.steam_name }}
            </span>

            <el-image
              class="h-36 w-36 rounded-full border border-white/25"
              :src="`${urlForProfileImg}${authStore.user?.avatar_url}`"
              fit="cover"
            />
          </div>

          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="$router.push('/me')">
                <PhUser />
                <span class="ml-8">Профіль</span>
              </el-dropdown-item>

              <RoleGuard :roles="['admin', 'moderator']">
                <el-dropdown-item @click="$router.push({name: routeNames.adminPanel})">
                  <PhIdentificationBadge />

                  <span class="ml-8">Адмін панель</span>
                </el-dropdown-item>
              </RoleGuard>

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
          tag="a"
          :href="`${apiBaseUrl}/api/v1/steam/login`"
        >
          <PhSteamLogo size="20" weight="bold" />
          <span class="ml-10 text-sm font-medium">
            Увійти через Steam
          </span>
        </el-button>

        <!-- BURGER -->
        <Burger class="flex lg:hidden" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { routeNames } from '@/router/route-names'
import logo from '@/assets/LongLogo.png'
import { PhSteamLogo, PhUser, PhSignOut, PhIdentificationBadge, PhEnvelope } from '@phosphor-icons/vue'
import RoleGuard from '@/guards/RoleGuard.vue'
import MailboxDropdown from '@/components/mailbox/MailboxDropdown.vue'
import type { ElDropdown } from 'element-plus'

import { useWebSocket } from '@vueuse/core'

const authStore = useAuthStore()
const mailboxStore = useMailboxStore()
const dropDown = ref(false)

const apiBaseUrl = import.meta.env.VITE_API_PUBLIC_URL
const urlForProfileImg = import.meta.env.VITE_API_PUBLIC_URL

const mailboxDropdownRef = ref<InstanceType<typeof ElDropdown> | null>(null)
const isMailboxDropdownOpen = ref(false)
const wasDropdownOpenBeforeModal = ref(false)

// Обработка открытия/закрытия дропдауна почты
function handleMailboxDropdownVisible (visible: boolean) {
  isMailboxDropdownOpen.value = visible
  if (visible) {
    // Загружаем письма при открытии дропдауна
    mailboxStore.fetchMails()
  }
}

// Обработка открытия модалки из дропдауна
function handleOpenModalFromDropdown () {
  // Сохраняем состояние дропдауна перед открытием модалки
  wasDropdownOpenBeforeModal.value = isMailboxDropdownOpen.value

  // Переоткрываем дропдаун после небольшой задержки, чтобы модалка успела открыться
  if (wasDropdownOpenBeforeModal.value) {
    nextTick(() => {
      setTimeout(() => {
        if (dropDown.value === false && wasDropdownOpenBeforeModal.value) {
          dropDown.value = true
        }
      }, 100)
    })
  }
}

// Отслеживаем закрытие модалки и переоткрываем дропдаун, если он был открыт
const { isOpen, open: openModal } = useAppModals()
watch(() => isOpen.value.MailboxModal, (isModalOpen) => {
  if (!isModalOpen && wasDropdownOpenBeforeModal.value) {
    // Модалка закрылась, переоткрываем дропдаун
    nextTick(() => {
      if (dropDown.value === false) {
        dropDown.value = true
      }
      wasDropdownOpenBeforeModal.value = false
    })
  }
})

// Обработка открытия модалки багов
function handleOpenBugModal () {
  openModal('BugReportModal')
}

// Формируем URL для WebSocket
const wsUrl = ref<string | undefined>(undefined)

const { status, open, close, data } = useWebSocket(wsUrl, {
  autoReconnect: {
    retries: 3,
    delay: 1000
  },
  immediate: false // Не открываем соединение автоматически
})

// Обработка сообщений WebSocket
watch(data, (newData) => {
  if (!newData) return

  try {
    const message = JSON.parse(newData)

    // Обрабатываем новое письмо
    if (message.type === 'new_mail' && message.mail) {
      mailboxStore.addMail(message.mail)
    }
  } catch (error) {
    console.error('Помилка при обробці повідомлення WebSocket:', error)
  }
})

// Обновляем URL и управляем соединением при изменении токена
watch(
  () => authStore.token,
  (token) => {
    if (token) {
      // Закрываем старое соединение, если оно открыто
      if (status.value === 'OPEN') {
        close()
      }
      // Устанавливаем новый URL и открываем соединение
      wsUrl.value = `${import.meta.env.VITE_API_PUBLIC_URL}/ws?token=${token}`
      // Небольшая задержка перед открытием, чтобы URL успел обновиться
      nextTick(() => {
        if (wsUrl.value) {
          open()
        }
      })
      // Загружаем письма при наличии токена
      mailboxStore.fetchMails()
    } else {
      // Закрываем соединение, если токена нет
      if (status.value === 'OPEN' || status.value === 'CONNECTING') {
        close()
      }
      wsUrl.value = undefined
      // Очищаем письма при выходе
      mailboxStore.clearMails()
    }
  },
  { immediate: true }
)

const links = [
  { name: routeNames.rootPage, label: 'Головна' },
  { name: routeNames.tournaments, label: 'Турніри' },
  { name: routeNames.mixTournaments, label: 'Mix Cup' },
  { name: routeNames.teams, label: 'Команди' },
  { name: routeNames.players, label: 'Гравці' },
  { name: routeNames.mixLEaderboard, label: 'Лідерборд' },
  { name: routeNames.rules, label: 'FAQ' }
]

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

.mailbox-badge .el-badge__content {
  @apply bg-red-600;
}

.mailbox-dropdown-popper {
  @apply p-0 border-none bg-[transparent];
}
</style>
