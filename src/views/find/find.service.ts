import apiClient from '@/api/client'
import { ElMessage } from 'element-plus'
import { getApiErrorMessage } from '@/core/utils/api-errors'
import type {
  TAcceptJoinRequestDto,
  TApplyToTeamPostDto,
  TCreateTeamInviteRequestDto,
  TCreateTeamPostDto,
  TJoinRequest,
  TPlayerListing,
  TPlayerListingsPage,
  TRecruitmentMe,
  TTeamMemberSlot,
  TTeamPost,
  TTeamPostsPage,
  TUpdateTeamPostDto,
  TUpsertPlayerListingDto
} from '@/api/types/api.types'

/** Скільки карток підвантажує одне «Показати ще». */
export const FIND_PAGE_SIZE = 25

type TTeamPostsQuery = TRequestQuery<'/recruitment/teams', 'get'>
type TPlayerListingsQuery = TRequestQuery<'/recruitment/players', 'get'>

/**
 * Мережа сторінки «Пошук команди» (`/recruitment`). Читання без тостів — сторінка
 * показує стан сама; мутації показують тост із повідомленням бекенду й прокидають помилку далі.
 */
class FindService {
  async fetchMe (): Promise<TRecruitmentMe> {
    return await apiClient.get('/recruitment/me')
  }

  async fetchTeamPosts (query: TTeamPostsQuery, offset: number): Promise<TTeamPostsPage> {
    return await apiClient.get('/recruitment/teams', { params: { ...query, limit: FIND_PAGE_SIZE, offset } })
  }

  async fetchPlayerListings (query: TPlayerListingsQuery, offset: number): Promise<TPlayerListingsPage> {
    return await apiClient.get('/recruitment/players', { params: { ...query, limit: FIND_PAGE_SIZE, offset } })
  }

  async fetchRequest (id: string): Promise<TJoinRequest> {
    return await apiClient.get('/recruitment/requests/{id}', { dynamicKeys: { id } })
  }

  // ─── оголошення команди ─────────────────────────────────────────────────────

  async createTeamPost (body: TCreateTeamPostDto): Promise<TTeamPost> {
    try {
      const post = await apiClient.post('/recruitment/teams', body)
      ElMessage.success('Оголошення опубліковано')
      return post
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося опублікувати оголошення'))
      throw e
    }
  }

  async updateTeamPost (id: string, body: TUpdateTeamPostDto): Promise<TTeamPost> {
    try {
      const post = await apiClient.patch('/recruitment/teams/{id}', body, { dynamicKeys: { id } })
      ElMessage.success('Оголошення оновлено')
      return post
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося оновити оголошення'))
      throw e
    }
  }

  async closeTeamPost (id: string): Promise<TTeamPost> {
    try {
      const post = await apiClient.delete('/recruitment/teams/{id}', { dynamicKeys: { id } })
      ElMessage.success('Оголошення закрито')
      return post
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося закрити оголошення'))
      throw e
    }
  }

  async apply (postId: string, body: TApplyToTeamPostDto): Promise<TTeamPost> {
    try {
      const post = await apiClient.post('/recruitment/teams/{id}/applications', body, { dynamicKeys: { id: postId } })
      ElMessage.success('Заявку надіслано')
      return post
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося подати заявку'))
      throw e
    }
  }

  // ─── оголошення гравця ──────────────────────────────────────────────────────

  async upsertMyListing (body: TUpsertPlayerListingDto): Promise<TPlayerListing> {
    try {
      const listing = await apiClient.put('/recruitment/players/me', body)
      ElMessage.success('Оголошення збережено')
      return listing
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося зберегти оголошення'))
      throw e
    }
  }

  async deleteMyListing (): Promise<void> {
    try {
      await apiClient.delete('/recruitment/players/me')
      ElMessage.success('Оголошення знято')
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося зняти оголошення'))
      throw e
    }
  }

  /** Модерація: адмін (або автор) знімає чуже оголошення гравця. */
  async deleteListing (id: string): Promise<void> {
    try {
      await apiClient.delete('/recruitment/players/{id}', { dynamicKeys: { id } })
      ElMessage.success('Оголошення видалено')
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося видалити оголошення'))
      throw e
    }
  }

  // ─── заявки та запрошення ───────────────────────────────────────────────────

  async invite (body: TCreateTeamInviteRequestDto): Promise<TJoinRequest> {
    try {
      const request = await apiClient.post('/recruitment/invites', body)
      ElMessage.success('Запрошення надіслано')
      return request
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося надіслати запрошення'))
      throw e
    }
  }

  /** Заявку приймає менеджер команди (`slot` — куди взяти), запрошення — сам гравець. */
  async acceptRequest (id: string, slot?: TTeamMemberSlot): Promise<TJoinRequest> {
    const body: TAcceptJoinRequestDto = slot ? { slot } : {}
    try {
      const request = await apiClient.post('/recruitment/requests/{id}/accept', body, { dynamicKeys: { id } })
      ElMessage.success(request.kind === 'INVITE' ? 'Ви приєдналися до команди' : 'Гравця прийнято до команди')
      return request
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося прийняти'))
      throw e
    }
  }

  async declineRequest (id: string): Promise<TJoinRequest> {
    try {
      return await apiClient.post('/recruitment/requests/{id}/decline', undefined, { dynamicKeys: { id } })
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося відхилити'))
      throw e
    }
  }

  /** Гравець відкликає свою заявку; менеджер скасовує запрошення. */
  async withdrawRequest (id: string): Promise<TJoinRequest> {
    try {
      const request = await apiClient.delete('/recruitment/requests/{id}', { dynamicKeys: { id } })
      ElMessage.success(request.kind === 'APPLICATION' ? 'Заявку відкликано' : 'Запрошення скасовано')
      return request
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося скасувати'))
      throw e
    }
  }
}

export const findService = new FindService()
