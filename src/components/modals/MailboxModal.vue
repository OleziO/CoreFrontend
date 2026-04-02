<template>
  <el-dialog
    :title="selectedMail ? 'Лист' : 'Пошта'"
    width="600"
    :model-value="isOpen.MailboxModal"
    @close="handleClose"
  >
    <div
      v-loading="mailboxStore.loading || loadingInvite"
      class="flex flex-col w-full"
      style="max-height: 70vh;"
    >
      <!-- Просмотр отдельного письма -->
      <div v-if="selectedMail" class="flex flex-col gap-16 overflow-y-auto pr-4">
        <!-- Специальный контент для приглашения в команду -->
        <div
          v-if="selectedMail.mail.type === ERequestType.TEAM_INVITE && teamInviteData"
          class="flex flex-col gap-20 p-5 rounded-2xl "
        >
          <!-- Заголовок письма -->
          <div class="flex items-start justify-between gap-12">
            <div class="flex items-center justify-between gap-8 flex-1">
              <div class="flex items-center gap-8">
                <span
                  v-if="!selectedMail.is_readed"
                  class="w-8 h-8 rounded-full bg-red-600"
                />
                <MailTypeTag :type="selectedMail.mail.type" class="max-w-fit text-base px-10" />
              </div>
              <span class="text-sm text-white/60">
                {{ formatMailDate(selectedMail.mail.created_on) }}
              </span>
            </div>
          </div>

          <!-- Информация о команде -->
          <div class="flex flex-col gap-16">
            <p class="text-base text-white/90">
              Вас запрошено до команди:
              <el-tag
                :type="currentInvite?.is_team_main ? 'success' : 'warning'"
                size="default"
                class="bg-white/10 border-white/10 ml-10"
              >
                {{ currentInvite?.is_team_main ? 'Основний склад' : 'Запасний склад' }}
              </el-tag>
            </p>

            <!-- Карточка команды -->
            <div
              class="flex items-center gap-16 p-16 rounded-xl border border-white/10
                     bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
              @click="goToTeamPage(teamInviteData.team.id)"
            >
              <el-avatar
                :size="64"
                :src="getImageUrl(teamInviteData.team.avatar_url)"
                class="ring-2 ring-white/10"
              >
                <template #default>
                  <PhUsersThree :size="32" weight="bold" class="text-white/70" />
                </template>
              </el-avatar>
              <div class="flex flex-col flex-1 min-w-0">
                <h3 class="text-lg font-semibold text-white truncate">
                  {{ teamInviteData.team.team_name }}
                </h3>
                <span
                  v-if="teamInviteData.team.dota_team_id"
                  class="text-sm text-white/60"
                >
                  ID: {{ teamInviteData.team.dota_team_id }}
                </span>
              </div>
            </div>

            <!-- Статус приглашения или кнопки действий -->

            <div v-if="currentInvite?.status === 'confirmed'" class="pt-8">
              <el-alert
                type="success"
                :closable="false"
                show-icon
              >
                Запрошення прийнято
              </el-alert>
            </div>
            <div v-else-if="currentInvite?.status === 'rejected'" class="pt-8">
              <el-alert
                type="error"
                :closable="false"
                show-icon
              >
                Запрошення відхилено
              </el-alert>
            </div>
            <div v-else class="flex gap-12 pt-8">
              <el-button
                type="success"
                class="flex-1"
                :loading="processingInvite"
                :disabled="processingInvite"
                @click="handleAcceptInvite"
              >
                Прийняти
              </el-button>
              <el-button
                type="danger"
                class="flex-1"
                :loading="processingInvite"
                :disabled="processingInvite"
                @click="handleDeclineInvite"
              >
                Відхилити
              </el-button>
            </div>
          </div>
        </div>

        <!-- Обычный контент для других типов писем -->
        <div
          v-else-if="selectedMail.mail.type !== ERequestType.TEAM_INVITE"
          class="flex flex-col gap-16 p-5 rounded-2xl "
        >
          <!-- Заголовок письма -->
          <div class="flex items-start justify-between gap-12">
            <div class="flex gap-8 items-center justify-between flex-1">
              <div class="flex items-center gap-8">
                <span
                  v-if="!selectedMail.is_readed"
                  class="w-8 h-8 rounded-full bg-red-600"
                />
                <MailTypeTag :type="selectedMail.mail.type" class="max-w-fit text-base px-10" />
              </div>
              <span class="text-sm text-white/60">
                {{ formatMailDate(selectedMail.mail.created_on) }}
              </span>
            </div>
          </div>

          <!-- Текст письма -->
          <div class="text-base text-white/90 leading-relaxed whitespace-pre-wrap">
            {{ selectedMail.mail.message }}
          </div>
        </div>
      </div>

      <!-- Пустое состояние (если письмо не выбрано) -->
      <div
        v-else
        class="flex flex-col items-center justify-center py-40 text-white/60"
      >
        <PhEnvelope :size="48" class="mb-16 opacity-50" />
        <p class="text-lg">Письмо не выбрано</p>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { useRouter } from 'vue-router'
import { PhEnvelope, PhUsersThree } from '@phosphor-icons/vue'
import { formatDate, getImageUrl } from '@/core/helpers'
import { routeNames } from '@/router/route-names'
import MailTypeTag from '@/components/mail-tags/MailTypeTag.vue'
import { teamsService } from '@/views/teams/teams.service'
import { useAuthStore } from '@/store/modules/auth'
import { ERequestType } from '@/components/mail-tags/mail.constants'

const { isOpen, close } = useAppModals()
const mailboxStore = useMailboxStore()
const router = useRouter()
const authStore = useAuthStore()

// Состояние для данных о приглашении команды
const teamInviteData = ref<TTeamInviteWithTeamSingle | null>(null)
const loadingInvite = ref(false)
const processingInvite = ref(false)

// Используем selectedMail из store
const selectedMail = computed(() => mailboxStore.selectedMail)

// Текущее приглашение для текущего пользователя
const currentInvite = computed(() => {
  if (!teamInviteData.value || !teamInviteData.value.invite) return null
  return teamInviteData.value.invite
})

// Загрузка данных о приглашении команды по invite_id
async function loadTeamInviteById (inviteId: number) {
  if (!inviteId) return
  loadingInvite.value = true
  try {
    const data = await teamsService.getTeamInviteById(inviteId)
    teamInviteData.value = data
  } catch (error) {
    console.error('Помилка при завантаженні даних про запрошення:', error)
    teamInviteData.value = null
  } finally {
    loadingInvite.value = false
  }
}

// Загрузка данных при изменении выбранного письма
watch(selectedMail, (mail) => {
  if (mail?.mail.type === ERequestType.TEAM_INVITE && mail.mail.invite_id) {
    loadTeamInviteById(mail.mail.invite_id)
  } else {
    teamInviteData.value = null
  }
}, { immediate: true })

// При закрытии модалки сбрасываем выбранное письмо
watch(() => isOpen.value.MailboxModal, (isModalOpen) => {
  if (!isModalOpen) {
    mailboxStore.setSelectedMail(null)
    teamInviteData.value = null
  }
})

// Форматирование даты из строки
function formatMailDate (dateString: string) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return formatDate(date)
}

// Переход на страницу команды
function goToTeamPage (teamId: number) {
  router.push({ name: routeNames.team, params: { id: teamId } })
}

// Обработка принятия приглашения
async function handleAcceptInvite () {
  if (!currentInvite.value?.id) return

  processingInvite.value = true
  try {
    await teamsService.acceptTeamInvite(currentInvite.value.id)
    // Перезагружаем данные о приглашении для обновления статуса
    if (selectedMail.value?.mail.invite_id) {
      await loadTeamInviteById(selectedMail.value.mail.invite_id)
    }
    // Обновляем данные пользователя в authStore
    if (authStore.user) {
      // Можно обновить данные пользователя, если нужно
    }
  } catch (error) {
    console.error('Помилка при прийнятті запрошення:', error)
  } finally {
    processingInvite.value = false
  }
}

// Обработка отклонения приглашения
async function handleDeclineInvite () {
  if (!currentInvite.value?.id) return

  processingInvite.value = true
  try {
    await teamsService.rejectTeamInvite(currentInvite.value.id)
    // Перезагружаем данные о приглашении для обновления статуса
    if (selectedMail.value?.mail.invite_id) {
      await loadTeamInviteById(selectedMail.value.mail.invite_id)
    }
  } catch (error) {
    console.error('Помилка при відхиленні запрошення:', error)
  } finally {
    processingInvite.value = false
  }
}

function handleClose () {
  mailboxStore.setSelectedMail(null)
  teamInviteData.value = null
  close('MailboxModal')
}
</script>
