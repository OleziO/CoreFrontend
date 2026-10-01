import { ElMessage } from 'element-plus'
import { useVipStore } from '@/store/modules/vip'

/**
 * Викликається один раз із хедера (він змонтований на кожній сторінці).
 *
 * - Monobank повертає платника на `/me?vip=return`: прибираємо параметр, чекаємо
 *   вебхук і відкриваємо VIP-модалку вже в режимі VIP.
 * - Для залогіненого користувача тягне `/vip/me`, щоб кнопка VIP знала статус.
 */
export function useVipPaymentReturn () {
  const vipStore = useVipStore()
  const authStore = useAuthStore()
  const { open } = useAppModals()
  const route = useRoute()
  const router = useRouter()

  async function handlePaymentReturn () {
    const { vip: _vip, ...rest } = route.query
    router.replace({ query: rest })
    if (!authStore.token) return

    const paid = await vipStore.awaitPaymentResult()
    if (paid) {
      ElMessage.success({ message: 'Вітаємо! VIP-статус активовано', duration: 5000 })
      open('VipModal')
    } else {
      ElMessage.info({
        message: 'Оплата ще обробляється — VIP з’явиться, щойно monobank її підтвердить',
        duration: 6000
      })
    }
  }

  watch(() => route.query.vip, (value) => {
    if (value === 'return') handlePaymentReturn()
  }, { immediate: true })

  watch(() => authStore.user?.id, (id) => {
    if (id) vipStore.fetchStatus()
  }, { immediate: true })
}
