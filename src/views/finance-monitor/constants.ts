import type { TCurrentPlayerRole } from '@/api/types/api.types'

export function hasAdminRole (roles: Pick<TCurrentPlayerRole, 'isAdminRole'>[] | undefined): boolean {
  return !!(roles ?? []).some((r) => r.isAdminRole)
}
