import apiClient from '@/api/client'

class MailboxService {
  async fetchMails (isReaded?: boolean) {
    try {
      const params: { is_readed?: boolean } = {}
      if (isReaded !== undefined) {
        params.is_readed = isReaded
      }
      const res = await apiClient.get('/api/v1/mail/' as any, {
        params
      })
      return res as TMailBoxItem[]
    } catch (e) {
      console.error('Помилка при отриманні листів:', e)
      throw e
    }
  }

  async markAsRead (mailId: number, isReaded: boolean = true) {
    try {
      const res = await apiClient.patch(`/api/v1/mail/${mailId}/read` as any, {
        is_readed: isReaded
      })
      return res as TMailBoxItem
    } catch (e) {
      console.error('Помилка при відмітці листа як прочитаного:', e)
      throw e
    }
  }

  async markAllAsRead () {
    try {
      await apiClient.patch('/api/v1/mail/mark-all-read' as any)
    } catch (e) {
      console.error('Помилка при відмітці всіх листів як прочитаних:', e)
      throw e
    }
  }
}

export const mailboxService = new MailboxService()
