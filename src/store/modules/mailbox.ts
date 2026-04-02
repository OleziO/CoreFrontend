import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { mailboxService } from '@/services/mailbox.service'

export const useMailboxStore = defineStore('mailbox', () => {
  const mails = ref<TMailBoxItem[]>([])
  const loading = ref(false)
  const selectedMailId = ref<number | null>(null)

  // Количество непрочитанных писем
  const unreadCount = computed(() => {
    return mails.value.filter(mail => !mail.is_readed).length
  })

  // Получить все письма
  async function fetchMails (isReaded?: boolean) {
    loading.value = true
    try {
      const data = await mailboxService.fetchMails(isReaded)
      mails.value = data
      return data
    } catch (error) {
      console.error('Помилка при завантаженні листів:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Добавить новое письмо (из WebSocket)
  function addMail (mailData: TNewMailWebSocketData['mail']) {
    // Проверяем, нет ли уже такого письма
    const existingMailIndex = mails.value.findIndex(
      item => item.mail.id === mailData.id
    )

    if (existingMailIndex === -1) {
      // Создаем новый MailBoxItem из данных WebSocket
      const newMailBoxItem: TMailBoxItem = {
        player_id: 0, // Будет установлено при следующей загрузке с сервера
        mail_id: mailData.id,
        is_readed: mailData.is_readed || false,
        mail: {
          id: mailData.id,
          type: mailData.type,
          message: mailData.message,
          target_group: mailData.target_group,
          created_on: mailData.created_on || new Date().toISOString(),
          team_id: mailData.team_id,
          invite_id: mailData.invite_id
        }
      }
      // Добавляем в начало списка
      mails.value.unshift(newMailBoxItem)
    }
  }

  // Отметить письмо как прочитанное
  async function markAsRead (mailId: number) {
    try {
      const updatedMail = await mailboxService.markAsRead(mailId, true)
      const mailIndex = mails.value.findIndex(item => item.mail_id === mailId)
      if (mailIndex !== -1) {
        mails.value[mailIndex] = updatedMail
      }
    } catch (error) {
      console.error('Помилка при відмітці листа як прочитаного:', error)
      throw error
    }
  }

  // Отметить все письма как прочитанные
  async function markAllAsRead () {
    try {
      await mailboxService.markAllAsRead()
      mails.value.forEach(mail => {
        mail.is_readed = true
      })
    } catch (error) {
      console.error('Помилка при відмітці всіх листів як прочитаних:', error)
      throw error
    }
  }

  // Очистить список писем
  function clearMails () {
    mails.value = []
  }

  // Получить выбранное письмо
  const selectedMail = computed(() => {
    if (!selectedMailId.value) return null
    return mails.value.find(m => m.mail_id === selectedMailId.value) || null
  })

  // Установить выбранное письмо
  function setSelectedMail (mailId: number | null) {
    selectedMailId.value = mailId
  }

  return {
    mails,
    loading,
    unreadCount,
    selectedMail,
    selectedMailId,
    fetchMails,
    addMail,
    markAsRead,
    markAllAsRead,
    clearMails,
    setSelectedMail
  }
})
