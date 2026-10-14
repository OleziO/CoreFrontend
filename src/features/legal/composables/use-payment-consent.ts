import { usePublicPricingQuery } from '@/features/legal/legal.queries'
import type { IPaymentConsentBody } from '@/features/legal/legal.d'

/**
 * Згода на оплату для одного платіжного блоку: галочка + актуальна версія умов
 * з `GET /public/pricing` (ніколи не з коду — бек звіряє її з `LEGAL_VERSION`).
 * Кнопка оплати активна лише коли `consentBody` не `null`.
 */
export function usePaymentConsent () {
  const agreed = ref(false)
  const { data: pricing, error, isPending, refetch } = usePublicPricingQuery()

  const legalVersion = computed(() => pricing.value?.legalVersion ?? null)

  /** Тіло для інтенту: є галочка і відома версія умов. */
  const consentBody = computed<IPaymentConsentBody | null>(() =>
    agreed.value && legalVersion.value ? { consent: true, legalVersion: legalVersion.value } : null
  )

  /** Версію умов не вдалося отримати — оплату не почати, показуємо пояснення. */
  const unavailable = computed(() => !!error.value && !legalVersion.value)

  return {
    agreed,
    pricing,
    legalVersion,
    consentBody,
    unavailable,
    loading: isPending,
    retry: refetch
  }
}
