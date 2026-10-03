import apiClient from '@/api/client'
import { ElMessage } from 'element-plus'
import { getApiErrorMessage } from '@/core/utils/api-errors'
import { validateImageFileForUpload } from '@/services/image-upload.service'
import type {
  TAdminDuel,
  TAdminResolveDuelDto,
  TCreateDuelChallengeDto,
  TCreateDuelTournamentDto,
  TCreateHostBotDto,
  TDuel,
  TDuelBotsStatus,
  TDuelLeaderboard,
  TDuelPlayerProfile,
  TDuelRating,
  TDuelSeason,
  TDuelState,
  TDuelStatus,
  TDuelTournament,
  TDuelTournamentPrizeInput,
  THostBot,
  TJoinDuelQueueDto,
  TUpdateDuelTournamentDto,
  TUpdateHostBotDto
} from '@/api/types/api.types'

/**
 * Мережа ліги дуелей. Запити без тостів — сторінка сама показує стан помилки;
 * мутації показують тост з повідомленням бекенду і прокидають помилку далі.
 */
class DuelsService {
  // ─── гравець ──────────────────────────────────────────────────────────────

  /** Мій статус: рейтинг, черга, активна дуель, остання завершена. Заодно heartbeat черги. */
  async fetchStatus (): Promise<TDuelStatus> {
    return await apiClient.get('/duels/me')
  }

  /** Стати в чергу ліги, або в чергу турніру, коли передано `tournamentId` (гравець уже ввів пароль). */
  async joinQueue (tournamentId?: string): Promise<TDuelStatus> {
    const body: TJoinDuelQueueDto = tournamentId ? { tournamentId } : {}
    try {
      return await apiClient.post('/duels/queue', body)
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося стати в чергу'))
      throw e
    }
  }

  async leaveQueue (): Promise<TDuelStatus> {
    try {
      return await apiClient.delete('/duels/queue')
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося вийти з черги'))
      throw e
    }
  }

  /** Прийняти знайдений матч (стан ACCEPTING). */
  async acceptDuel (id: string): Promise<TDuelStatus> {
    try {
      return await apiClient.post('/duels/{id}/accept', undefined, { dynamicKeys: { id } })
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося прийняти матч'))
      throw e
    }
  }

  /** Скасувати свою дуель до старту гри: −10 рейтингу, суперник повертається в чергу. */
  async cancelDuel (id: string): Promise<TDuelStatus> {
    try {
      return await apiClient.post('/duels/{id}/cancel', undefined, { dynamicKeys: { id } })
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося скасувати дуель'))
      throw e
    }
  }

  /** Попросити бота надіслати інвайт у лобі ще раз (поки лобі відкрите; не частіше ніж раз на 15 с). */
  async requestInvite (id: string): Promise<TDuelStatus> {
    try {
      const status = await apiClient.post('/duels/{id}/invite', undefined, { dynamicKeys: { id } })
      ElMessage.success('Бот надішле інвайт протягом кількох секунд — перевірте Dota 2')
      return status
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося надіслати інвайт'))
      throw e
    }
  }

  /** Попросити бота перезапустити матч — гравець не завантажився в гру (лише поки пік не почався). */
  async requestRestart (id: string): Promise<TDuelStatus> {
    try {
      const status = await apiClient.post('/duels/{id}/restart', undefined, { dynamicKeys: { id } })
      ElMessage.success('Бот перезапустить лобі протягом кількох секунд — прийміть інвайт у Dota 2 ще раз')
      return status
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося перезапустити матч'))
      throw e
    }
  }

  // ─── дружні дуелі (виклики друзів) ────────────────────────────────────────

  /** Викликати друга на дружню дуель (±10): виклик живе 5 хвилин, один відкритий виклик за раз. */
  async createChallenge (playerId: string): Promise<TDuelStatus> {
    const body: TCreateDuelChallengeDto = { playerId }
    try {
      const status = await apiClient.post('/duels/challenges', body)
      ElMessage.success('Виклик надіслано — друг отримає сповіщення')
      return status
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося надіслати виклик'))
      throw e
    }
  }

  /** Прийняти виклик: обидва виходять із черги, дуель створюється одразу (без 30 с на прийняття). */
  async acceptChallenge (id: string): Promise<TDuelStatus> {
    try {
      return await apiClient.post('/duels/challenges/{id}/accept', undefined, { dynamicKeys: { id } })
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося прийняти виклик'))
      throw e
    }
  }

  async declineChallenge (id: string): Promise<TDuelStatus> {
    try {
      return await apiClient.post('/duels/challenges/{id}/decline', undefined, { dynamicKeys: { id } })
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося відхилити виклик'))
      throw e
    }
  }

  /** Відкликати свій виклик. */
  async cancelChallenge (id: string): Promise<TDuelStatus> {
    try {
      return await apiClient.delete('/duels/challenges/{id}', { dynamicKeys: { id } })
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося скасувати виклик'))
      throw e
    }
  }

  // ─── турніри з паролем ────────────────────────────────────────────────────

  /** Активні турніри першими, далі завершені. З токеном — `joined` / `canManage` для мене. */
  async fetchTournaments (): Promise<TDuelTournament[]> {
    return await apiClient.get('/duel-tournaments')
  }

  /** Один турнір; `password` бекенд віддає лише організатору та адмінам. */
  async fetchTournament (id: string): Promise<TDuelTournament> {
    return await apiClient.get('/duel-tournaments/{id}', { dynamicKeys: { id } })
  }

  /** Таблиця турніру — публічна, і після завершення теж. */
  async fetchTournamentLeaderboard (id: string): Promise<TDuelLeaderboard> {
    return await apiClient.get('/duel-tournaments/{id}/leaderboard', { dynamicKeys: { id } })
  }

  /** Створити стрім-турнір (стрімер — роль «Медіа» — або адмін). */
  async createTournament (dto: TCreateDuelTournamentDto): Promise<TDuelTournament> {
    try {
      const tournament = await apiClient.post('/duel-tournaments', dto)
      ElMessage.success('Турнір створено — поділіться паролем з учасниками')
      return tournament
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося створити турнір'))
      throw e
    }
  }

  /** Змінити назву, пароль чи призи (організатор чи адмін, поки турнір активний; VIP-призи — лише адмін). */
  async updateTournament (id: string, dto: TUpdateDuelTournamentDto): Promise<TDuelTournament> {
    try {
      const tournament = await apiClient.patch('/duel-tournaments/{id}', dto, { dynamicKeys: { id } })
      ElMessage.success('Турнір оновлено')
      return tournament
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося оновити турнір'))
      throw e
    }
  }

  /** Завершити турнір: черга закривається, нестартовані дуелі скасовуються, таблиця лишається. */
  async endTournament (id: string): Promise<TDuelTournament> {
    try {
      const tournament = await apiClient.post('/duel-tournaments/{id}/end', undefined, { dynamicKeys: { id } })
      ElMessage.success('Турнір завершено')
      return tournament
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося завершити турнір'))
      throw e
    }
  }

  /** Видалити турнір (лише адмін): нестартовані дуелі скасовуються, таблиця зникає. Незворотно. */
  async deleteTournament (id: string): Promise<void> {
    try {
      await apiClient.delete('/duel-tournaments/{id}', { dynamicKeys: { id } })
      ElMessage.success('Турнір видалено')
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося видалити турнір'))
      throw e
    }
  }

  /** Завантажити картинку власного призу — повертає url для `prizes[].imageUrl`. Тост — на боці форми. */
  async uploadTournamentPrizeImage (file: File): Promise<string> {
    const err = validateImageFileForUpload(file)
    if (err != null) throw new Error(err)
    const fd = new FormData()
    fd.append('file', file)
    const { url } = await apiClient.post('/duel-tournaments/prize-image', fd as never)
    return url
  }

  /** Увійти в турнір за паролем — після цього можна ставати в його чергу. */
  async joinTournament (id: string, password: string): Promise<TDuelTournament> {
    try {
      const tournament = await apiClient.post('/duel-tournaments/{id}/join', { password }, { dynamicKeys: { id } })
      ElMessage.success('Ви в турнірі — можна шукати суперника')
      return tournament
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося увійти в турнір'))
      throw e
    }
  }

  // ─── сезони ───────────────────────────────────────────────────────────────

  /** Усі сезони, новіші першими; у завершених — переможці призових місць. */
  async fetchSeasons (): Promise<TDuelSeason[]> {
    return await apiClient.get('/duel-seasons')
  }

  /** Поточний сезон; `closing` — місяць минув, підсумки ще підбиваються (черга ліги закрита). */
  async fetchCurrentSeason (): Promise<TDuelSeason> {
    return await apiClient.get('/duel-seasons/current')
  }

  /** Таблиця сезону: живий рейтинг для поточного, заморожена фінальна — для завершеного. */
  async fetchSeasonLeaderboard (id: string): Promise<TDuelLeaderboard> {
    return await apiClient.get('/duel-seasons/{id}/leaderboard', { dynamicKeys: { id } })
  }

  /** Призові місця поточного сезону (лише адмін). VIP видається автоматично наприкінці сезону. */
  async updateSeasonPrizes (id: string, prizes: TDuelTournamentPrizeInput[]): Promise<TDuelSeason> {
    try {
      const season = await apiClient.patch('/duel-seasons/{id}/prizes', { prizes }, { dynamicKeys: { id } })
      ElMessage.success('Призи сезону збережено')
      return season
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося зберегти призи сезону'))
      throw e
    }
  }

  /** Позначити приз переможця виданим / невиданим (лише адмін). */
  async setSeasonPrizeIssued (id: string, place: number, issued: boolean): Promise<TDuelSeason> {
    try {
      const season = await apiClient.patch(
        '/duel-seasons/{id}/prizes/{place}',
        { issued },
        { dynamicKeys: { id, place } }
      )
      ElMessage.success(issued ? 'Приз позначено виданим' : 'Позначку знято')
      return season
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося оновити статус призу'))
      throw e
    }
  }

  // ─── публічні ─────────────────────────────────────────────────────────────

  /** Стан пулу ботів-хостів: скільки онлайн, вільних, зайнятих. */
  async fetchBotsStatus (): Promise<TDuelBotsStatus> {
    return await apiClient.get('/duels/bots/status')
  }

  async fetchLeaderboard (): Promise<TDuelLeaderboard> {
    return await apiClient.get('/duels/leaderboard')
  }

  /** Рейтинг + останні 10 дуелей гравця. `rating` — null, поки гравець не ставав у чергу. */
  async fetchPlayerProfile (id: string): Promise<TDuelPlayerProfile> {
    return await apiClient.get('/duels/players/{id}', { dynamicKeys: { id } })
  }

  async fetchDuel (id: string): Promise<TDuel> {
    return await apiClient.get('/duels/{id}', { dynamicKeys: { id } })
  }

  // ─── адмін ────────────────────────────────────────────────────────────────

  async adminListDuels (state?: TDuelState, limit = 50): Promise<TAdminDuel[]> {
    return await apiClient.get('/admin/duels', { params: { state, limit } })
  }

  /** Видалити одну дуель назавжди (будь-який стан; рейтинг не відкочується). */
  async adminDeleteDuel (id: string): Promise<void> {
    try {
      await apiClient.delete('/admin/duels/{id}', { dynamicKeys: { id } })
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося видалити дуель'))
      throw e
    }
  }

  async adminCancelDuel (id: string): Promise<TDuel> {
    try {
      return await apiClient.post('/admin/duels/{id}/cancel', undefined, { dynamicKeys: { id } })
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося скасувати дуель'))
      throw e
    }
  }

  /** Підтягнути результат FAILED-дуелі з Steam Web API за match id. */
  async adminRecoverDuel (id: string): Promise<TDuel> {
    try {
      return await apiClient.post('/admin/duels/{id}/recover', undefined, { dynamicKeys: { id } })
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося отримати результат від Valve'))
      throw e
    }
  }

  /** `winnerId` — кому зарахувати перемогу (±25); null — анулювати без зміни рейтингу. */
  async adminResolveDuel (id: string, winnerId: string | null): Promise<TDuel> {
    const body: TAdminResolveDuelDto = { winnerId }
    try {
      return await apiClient.post('/admin/duels/{id}/resolve', body, { dynamicKeys: { id } })
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося вирішити дуель'))
      throw e
    }
  }

  async adminListBots (): Promise<THostBot[]> {
    return await apiClient.get('/admin/duels/bots')
  }

  async adminCreateBot (dto: TCreateHostBotDto): Promise<THostBot> {
    try {
      return await apiClient.post('/admin/duels/bots', dto)
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося додати бота'))
      throw e
    }
  }

  /** Перезапустити всіх увімкнених ботів (воркер перелогінить їх протягом ~30 с). Повертає кількість. */
  async adminReloadBots (): Promise<number> {
    try {
      return await apiClient.post('/admin/duels/bots/reload')
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося перезапустити ботів'))
      throw e
    }
  }

  async adminReloadBot (id: number): Promise<number> {
    try {
      return await apiClient.post('/admin/duels/bots/{id}/reload', undefined, { dynamicKeys: { id } })
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося перезапустити бота'))
      throw e
    }
  }

  async adminUpdateBot (id: number, dto: TUpdateHostBotDto): Promise<THostBot> {
    try {
      return await apiClient.patch('/admin/duels/bots/{id}', dto, { dynamicKeys: { id } })
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося оновити бота'))
      throw e
    }
  }

  async adminRemoveBot (id: number): Promise<void> {
    try {
      await apiClient.delete('/admin/duels/bots/{id}', { dynamicKeys: { id } })
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося видалити бота'))
      throw e
    }
  }

  async adminSetRating (playerId: string, rating: number): Promise<TDuelRating> {
    try {
      return await apiClient.patch('/admin/duels/players/{id}/rating', { rating }, { dynamicKeys: { id: playerId } })
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося змінити рейтинг'))
      throw e
    }
  }
}

export const duelsService = new DuelsService()
