import apiClient from '@/api/client'
import { ElMessage } from 'element-plus'
import { getApiErrorMessage } from '@/core/utils/api-errors'
import type {
  TCreateDuelBracketDto,
  TDuelBracket,
  TDuelBracketMatch,
  TDuelBracketSeeding,
  TDuelBracketSummary,
  TUpdateDuelBracketDto
} from '@/api/types/api.types'

/**
 * Мережа медіа-турнірів 1v1 (`/duel-brackets`). Запити без тостів — сторінка сама
 * показує стан помилки; мутації показують тост з повідомленням бекенду і прокидають
 * помилку далі.
 */
class DuelBracketsService {
  // ─── читання ──────────────────────────────────────────────────────────────

  /** Наживо → реєстрація → завершені. З токеном — `joined` / `canManage` для мене. */
  async fetchBrackets (): Promise<TDuelBracketSummary[]> {
    return await apiClient.get('/duel-brackets')
  }

  /** Турнір з учасниками й усіма матчами; організатор бачить пароль і паролі лобі. */
  async fetchBracket (id: string): Promise<TDuelBracket> {
    return await apiClient.get('/duel-brackets/{id}', { dynamicKeys: { id } })
  }

  // ─── гравець ──────────────────────────────────────────────────────────────

  async join (id: string, password?: string | null): Promise<TDuelBracket> {
    try {
      const bracket = await apiClient.post('/duel-brackets/{id}/join', { password: password ?? null }, {
        dynamicKeys: { id }
      })
      ElMessage.success('Ви в турнірі! Коли стрімер запустить сітку, бот запросить вас у лобі')
      return bracket
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося зареєструватися'))
      throw e
    }
  }

  async leave (id: string): Promise<TDuelBracket> {
    try {
      return await apiClient.post('/duel-brackets/{id}/leave', undefined, { dynamicKeys: { id } })
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося скасувати реєстрацію'))
      throw e
    }
  }

  // ─── організатор (стрімер або адмін) ──────────────────────────────────────

  async create (dto: TCreateDuelBracketDto): Promise<TDuelBracket> {
    try {
      const bracket = await apiClient.post('/duel-brackets', dto)
      ElMessage.success('Турнір створено — реєстрацію відкрито')
      return bracket
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося створити турнір'))
      throw e
    }
  }

  async update (id: string, dto: TUpdateDuelBracketDto): Promise<TDuelBracket> {
    try {
      const bracket = await apiClient.patch('/duel-brackets/{id}', dto, { dynamicKeys: { id } })
      ElMessage.success('Зміни збережено')
      return bracket
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося зберегти турнір'))
      throw e
    }
  }

  /** Закрити реєстрацію й згенерувати сітку; готові матчі одразу йдуть ботам. */
  async start (id: string, seeding: TDuelBracketSeeding): Promise<TDuelBracket> {
    try {
      const bracket = await apiClient.post('/duel-brackets/{id}/start', { seeding }, { dynamicKeys: { id } })
      ElMessage.success('Сітку згенеровано — боти створюють лобі першого раунду')
      return bracket
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося запустити турнір'))
      throw e
    }
  }

  async cancel (id: string): Promise<TDuelBracket> {
    try {
      return await apiClient.post('/duel-brackets/{id}/cancel', undefined, { dynamicKeys: { id } })
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося скасувати турнір'))
      throw e
    }
  }

  /** Лише адмін. */
  async remove (id: string): Promise<void> {
    try {
      await apiClient.delete('/duel-brackets/{id}', { dynamicKeys: { id } })
      ElMessage.success('Турнір видалено')
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося видалити турнір'))
      throw e
    }
  }

  async removeParticipant (id: string, playerId: string): Promise<TDuelBracket> {
    try {
      return await apiClient.delete('/duel-brackets/{id}/participants/{playerId}', {
        dynamicKeys: { id, playerId }
      })
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося прибрати гравця'))
      throw e
    }
  }

  async setWinner (id: string, matchId: string, winnerId: string): Promise<TDuelBracket> {
    try {
      const bracket = await apiClient.post('/duel-brackets/{id}/matches/{matchId}/winner', { winnerId }, {
        dynamicKeys: { id, matchId }
      })
      ElMessage.success('Переможця матчу зафіксовано')
      return bracket
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося зафіксувати переможця'))
      throw e
    }
  }

  async replay (id: string, matchId: string): Promise<TDuelBracket> {
    try {
      const bracket = await apiClient.post('/duel-brackets/{id}/matches/{matchId}/replay', undefined, {
        dynamicKeys: { id, matchId }
      })
      ElMessage.success('Матч переграють — бот створить нове лобі')
      return bracket
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося перезапустити матч'))
      throw e
    }
  }

  /** Бот запросить організатора в лобі матчу як глядача. */
  async spectate (id: string, matchId: string): Promise<TDuelBracketMatch> {
    try {
      const match = await apiClient.post('/duel-brackets/{id}/matches/{matchId}/spectate', undefined, {
        dynamicKeys: { id, matchId }
      })
      ElMessage.success('Бот надішле інвайт у лобі протягом кількох секунд — займіть слот глядача')
      return match
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося долучитися глядачем'))
      throw e
    }
  }
}

export const duelBracketsService = new DuelBracketsService()
