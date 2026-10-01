import { ElMessage } from 'element-plus'
import type { AxiosError } from 'axios'
import apiClient from '@/api/client'

export type TVipStatus = TResponse<'/vip/me', 'get'>
export type TVipCheckout = TResponse<'/vip/checkout', 'post'>
export type TAdminVipResult = TResponse<'/admin/players/{id}/vip', 'post'>
export type TAdminVipGrant = TRequestBody<'/admin/players/{id}/vip', 'post'>

/** Текст помилки з тіла відповіді бекенду (`{ message }`), інакше — запасний. */
function apiErrorMessage (err: unknown, fallback: string): string {
  const data = (err as AxiosError<{ message?: unknown }>)?.response?.data
  return typeof data?.message === 'string' ? data.message : fallback
}

/**
 * VIP-статус: оплата через Monobank (перший платіж зберігає картку, далі бек
 * списує 200 ₴ щомісяця сам), рамка профілю та ручна видача адміном.
 */
class VipService {
  async fetchStatus (): Promise<TVipStatus | null> {
    try {
      return await apiClient.get('/vip/me')
    } catch {
      return null
    }
  }

  /** Рахунок на перший платіж; `pageUrl` — сторінка оплати Monobank. */
  async checkout (): Promise<TVipCheckout | null> {
    try {
      const res = await apiClient.post('/vip/checkout')
      if (!res.pageUrl) {
        ElMessage.error('Оплата тимчасово недоступна — спробуйте пізніше')
        return null
      }
      return res
    } catch (err) {
      ElMessage.error(apiErrorMessage(err, 'Не вдалося створити рахунок на оплату'))
      return null
    }
  }

  async cancelAutoRenew (): Promise<TVipStatus | null> {
    try {
      const res = await apiClient.post('/vip/cancel')
      ElMessage.success('Автопродовження вимкнено — VIP діє до кінця оплаченого періоду')
      return res
    } catch (err) {
      ElMessage.error(apiErrorMessage(err, 'Не вдалося вимкнути автопродовження'))
      return null
    }
  }

  async resumeAutoRenew (): Promise<TVipStatus | null> {
    try {
      const res = await apiClient.post('/vip/resume')
      ElMessage.success('Автопродовження знову увімкнено')
      return res
    } catch (err) {
      ElMessage.error(apiErrorMessage(err, 'Не вдалося увімкнути автопродовження'))
      return null
    }
  }

  async setFrameColor (color: TRequestBody<'/vip/frame-color', 'patch'>['color']): Promise<TVipStatus | null> {
    try {
      return await apiClient.patch('/vip/frame-color', { color })
    } catch (err) {
      ElMessage.error(apiErrorMessage(err, 'Не вдалося змінити колір рамки'))
      return null
    }
  }

  /** `{ months }` — додати місяці; `{ lifetime: true }` — безстроковий VIP. */
  async grantByAdmin (playerId: string, grant: TAdminVipGrant): Promise<TAdminVipResult | null> {
    try {
      const res = await apiClient.post('/admin/players/{id}/vip', grant, { dynamicKeys: { id: playerId } })
      ElMessage.success(grant.lifetime ? 'Видано безстроковий VIP' : 'VIP видано')
      return res
    } catch (err) {
      ElMessage.error(apiErrorMessage(err, 'Не вдалося видати VIP'))
      return null
    }
  }

  /** Колір рамки VIP-гравця від адміна; `null` — стандартна рамка. */
  async setFrameColorByAdmin (
    playerId: string,
    color: TRequestBody<'/admin/players/{id}/vip/frame-color', 'patch'>['color']
  ): Promise<TAdminVipResult | null> {
    try {
      const res = await apiClient.patch(
        '/admin/players/{id}/vip/frame-color',
        { color },
        { dynamicKeys: { id: playerId } }
      )
      ElMessage.success(color ? 'Колір рамки змінено' : 'Рамку скинуто до стандартної')
      return res
    } catch (err) {
      ElMessage.error(apiErrorMessage(err, 'Не вдалося змінити колір рамки'))
      return null
    }
  }

  async revokeByAdmin (playerId: string): Promise<TAdminVipResult | null> {
    try {
      const res = await apiClient.delete('/admin/players/{id}/vip', { dynamicKeys: { id: playerId } })
      ElMessage.success('VIP знято')
      return res
    } catch (err) {
      ElMessage.error(apiErrorMessage(err, 'Не вдалося зняти VIP'))
      return null
    }
  }
}

export const vipService = new VipService()
