<template>
  <div class="mailbox-dropdown+ ">
    <div
      class="py-8 border-b border-white/10 flex items-center"
      :class="mailboxStore.unreadCount ? 'justify-between' : 'justify-center'"
    >
      <span class="text-sm font-semibold text-white text-center tracking-wide">
        {{ mailboxStore.unreadCount ? 'Непрочитаних:' : 'Сповіщення' }}
      </span>

      <span
        v-if="mailboxStore.unreadCount > 0"
        class="text-xs font-bold text-red-400 bg-red-500/10 px-8 py-5 rounded"
      >
        {{ mailboxStore.unreadCount }} нових
      </span>
    </div>

    <div
      v-if="mailboxStore.loading"
      class="flex items-center justify-center py-20 px-40 min-h-[150px]"
    >
      <el-icon class="is-loading text-primary" :size="24">
        <Loading />
      </el-icon>
    </div>

    <div
      v-else-if="mailboxStore.mails.length === 0"
      class="flex flex-col items-center justify-center py-16 px-40 text-white/40 min-h-[150px]"
    >
      <PhEnvelopeOpen :size="48" weight="light" class="mb-3 opacity-30" />
      <p class="text-xs font-medium">Вхідні листи відсутні</p>
    </div>

    <div
      v-else
      class="max-h-[400px] gap-5 flex flex-col overflow-y-auto custom-scrollbar"
    >
      <div
        v-for="mailItem in mailboxStore.mails"
        :key="mailItem.mail_id"
        class="relative group px-14 py-8 border-b border-white/5 hover:bg-white/5 transition-all cursor-pointer"
        :class="{ 'opacity-60 grayscale-[0.3] hover:grayscale-0': mailItem.is_readed }"
        @click="handleMailClick(mailItem)"
      >
        <span
          v-if="!mailItem.is_readed"
          class="absolute top-3 right-3 w-4 h-4 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] z-10"
        />

        <div class="flex items-center gap-15">
          <div
            class="shrink-0 flex items-center justify-center w-20 h-20
             rounded-xl border transition-colors bg-white"
            :class="getIconStyles(mailItem.mail.type)"
          >
            <component
              :is="getIconComponent(mailItem.mail.type)"
              size="24"
              weight="bold"
            />
          </div>

          <div class="flex flex-1 items-center justify-between min-w-0 gap-15">
            <MailTypeTag
              :type="mailItem.mail.type"
              class="!w-fit !px-14 !py-4 text-[14px] !h-auto !justify-start
               !border-none !bg-transparent !shadow-none"
            />

            <div class="text-[12px] text-gray-500 font-medium whitespace-nowrap">
              {{ formatMailDate(mailItem.mail.created_on) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="mailboxStore.mails.length > 0"
      class="p-8 border-t border-white/10"
    >
      <el-button
        v-if="mailboxStore.unreadCount > 0"
        type="primary"
        text
        bg
        size="small"
        class="w-full !rounded-lg hover:!bg-primary/20"
        :loading="markingAllAsRead"
        @click.stop="handleMarkAllAsRead"
      >
        Прочитати всі
      </el-button>
      <div v-else class="text-center text-[10px] text-gray-600 py-1">
        Всі листи прочитано
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  PhEnvelopeOpen,
  PhGitPullRequest,
  PhSealQuestion,
  PhSwap,
  PhSiren,
  PhTrophy,
  PhEnvelopeSimple
} from '@phosphor-icons/vue'
import { Loading } from '@element-plus/icons-vue'
import { formatDate } from '@/core/helpers'
import { ERequestType } from '../mail-tags/mail.constants' // Убедитесь в правильности пути
import MailTypeTag from '../mail-tags/MailTypeTag.vue' // Ваш компонент тега

// --- Store & Composables ---
// Предполагаем, что они доступны глобально или импортированы
const mailboxStore = useMailboxStore()
const { open: openModal } = useAppModals()

const markingAllAsRead = ref(false)

const emit = defineEmits<{
  'open-modal': []
}>()

// --- Helpers ---

function formatMailDate (dateString: string) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return formatDate(date)
}

// Маппинг иконок Phosphor
const getIconComponent = (type: string) => {
  switch (type) {
    case ERequestType.MMR_REQUEST:
      return PhGitPullRequest
    case ERequestType.PlAYER_VERIFICATION_REQUEST:
    case ERequestType.TEAM_VERIFICATION_REQUEST:
      return PhSealQuestion
    case ERequestType.TEAM_CHANGED:
      return PhSwap
    case ERequestType.ADMIN_MESSAGE:
      return PhSiren
    case ERequestType.TOURNAMENTS:
      return PhTrophy
    default:
      return PhEnvelopeSimple
  }
}

// Маппинг стилей контейнера иконки (согласован с вашими цветами тегов)
const getIconStyles = (type: string) => {
  switch (type) {
    case ERequestType.MMR_REQUEST:
      return 'bg-purple-500/10 border-purple-500/20 text-purple-400'
    case ERequestType.PlAYER_VERIFICATION_REQUEST:
      return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
    case ERequestType.TEAM_VERIFICATION_REQUEST:
      return 'bg-sky-500/10 border-sky-500/20 text-sky-400'
    case ERequestType.TEAM_CHANGED:
      return 'bg-orange-500/10 border-orange-500/20 text-orange-400'
    case ERequestType.ADMIN_MESSAGE:
      return 'bg-rose-500/10 border-rose-500/20 text-rose-400'
    case ERequestType.TOURNAMENTS:
      return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
    default:
      return 'bg-gray-800 border-white/10 text-gray-400'
  }
}

// --- Actions ---

async function handleMailClick (mailItem: TMailBoxItem) {
  if (!mailItem.is_readed) {
    try {
      await mailboxStore.markAsRead(mailItem.mail_id)
    } catch (error) {
      console.error('Помилка при відмітці листа:', error)
    }
  }
  mailboxStore.setSelectedMail(mailItem.mail_id)
  emit('open-modal')
  openModal('MailboxModal')
}

async function handleMarkAllAsRead () {
  markingAllAsRead.value = true
  try {
    await mailboxStore.markAllAsRead()
  } catch (error) {
    console.error('Помилка при відмітці всіх листів:', error)
  } finally {
    markingAllAsRead.value = false
  }
}
</script>

<style scoped>

/* Custom Scrollbar for the list */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
