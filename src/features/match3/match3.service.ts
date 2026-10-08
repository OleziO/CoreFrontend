import apiClient from '@/api/client'
import type { TMatch3Action } from '@/features/match3/match3-engine.utils'
import type {
  TFinishMatch3RunDto,
  TMatch3Leaderboard,
  TMatch3RunResult,
  TMatch3RunStart
} from '@/api/types/api.types'

/**
 * Мережа міні-гри «три в ряд». Без тостів — модалка сама показує стан (гра працює й офлайн,
 * просто без запису в таблицю).
 */
class Match3Service {
  /** Топ-10 і моє місце (з токеном). Публічний ендпоінт. */
  async fetchLeaderboard (): Promise<TMatch3Leaderboard> {
    return await apiClient.get('/match3/leaderboard')
  }

  /** Новий забіг: сервер видає seed поля. Незавершений попередній забіг сервер відкидає. */
  async startRun (): Promise<TMatch3RunStart> {
    return await apiClient.post('/match3/runs')
  }

  /** Сервер програє журнал дій від seed і сам рахує очки. */
  async finishRun (id: string, actions: TMatch3Action[]): Promise<TMatch3RunResult> {
    const body: TFinishMatch3RunDto = { actions }
    return await apiClient.post('/match3/runs/{id}/finish', body, { dynamicKeys: { id } })
  }
}

export const match3Service = new Match3Service()
