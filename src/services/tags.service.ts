import { apiClientV2 } from '@/api/client-v2'
import type { TTag } from './tags.types'

/**
 * Raw v2 calls for player moderation tags.
 *
 * Singleton, auto-imported by name (`tagsService`) alongside the other `src/services/*`
 * instances. Network only — loading state and toasts live in the consuming admin component
 * (mirrors `verification.service.ts`).
 *
 * The tag catalog (`GET /tags`) is the same for every player, so it is cached at the module
 * level after the first fetch and reused across players for the rest of the session.
 */

let catalogCache: TTag[] | null = null

class TagsService {
  /** Moderation tag catalog; fetched once per session, then served from cache. */
  async fetchCatalog (force = false): Promise<TTag[]> {
    if (catalogCache && !force) return catalogCache
    catalogCache = await apiClientV2.get<TTag[]>('/tags')
    return catalogCache
  }

  /** A player's currently assigned tags. */
  async fetchPlayerTags (playerId: string): Promise<TTag[]> {
    return apiClientV2.get<TTag[]>(`/players/${playerId}/tags`)
  }

  /** Assign a tag to a player (idempotent); returns the updated list. */
  async assignTag (playerId: string, tagId: string): Promise<TTag[]> {
    return apiClientV2.post<TTag[]>(`/players/${playerId}/tags/${tagId}`)
  }

  /** Remove a tag from a player; `204` (no body). */
  async removeTag (playerId: string, tagId: string): Promise<void> {
    return apiClientV2.delete<void>(`/players/${playerId}/tags/${tagId}`)
  }
}

export const tagsService = new TagsService()
