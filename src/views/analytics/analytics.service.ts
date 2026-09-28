import apiClient from '@/api/client'
import { ElMessage } from 'element-plus'
import { getApiErrorMessage } from '@/core/utils/api-errors'

class AnalyticsService {
  /** Зведена адмін-аналітика: соцмережі, лічильники, ранги, команди, турніри, міста. */
  async fetchOverview () {
    return await apiClient.get('/admin/analytics/overview')
  }

  /**
   * Ручне значення підписників для каналу без публічного API (Instagram, TikTok).
   * Живе значення з платформи, якщо воно є, все одно має пріоритет — бекенд повертає
   * актуальний стан каналу після збереження.
   */
  async updateSocialFollowers (channel: TAnalyticsSocialChannel, followers: number | null) {
    try {
      const result = await apiClient.put(
        '/admin/analytics/socials/{channel}',
        { followers },
        { dynamicKeys: { channel } }
      )
      ElMessage.success('Кількість підписників оновлено')
      return result
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося оновити кількість підписників'))
      throw e
    }
  }
}

export const analyticsService = new AnalyticsService()
