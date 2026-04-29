import { supabase } from '@/api/client'
import type { TUserRole as UserRole, TCreateUserRoleDto as CreateUserRoleDto, TUpdateUserRoleDto as UpdateUserRoleDto } from '@/api/types/api.types'

/** Таблиця в Supabase (PostgreSQL): `user_roles` з колонками id, name, is_admin_role, color (за потреби). */
function rowToUserRole (row: Record<string, unknown>): UserRole {
  return {
    id: String(row.id),
    name: row.name as UserRole['name'],
    isAdminRole: Boolean(row.is_admin_role ?? row.isAdminRole),
    player: null,
    tournaments: []
  }
}

function throwIfError (error: { message: string } | null): asserts error is null {
  if (error) throw new Error(error.message)
}

class UserRolesService {
  async fetchUserRoles (): Promise<UserRole[]> {
    const { data, error } = await supabase.from('user_roles').select('*')
    throwIfError(error)
    return (data ?? []).map(r => rowToUserRole(r as Record<string, unknown>))
  }

  async fetchUserRole (id: string): Promise<UserRole> {
    const { data, error } = await supabase.from('user_roles').select('*').eq('id', id).maybeSingle()
    throwIfError(error)
    if (!data) throw new Error('Роль не знайдено')
    return rowToUserRole(data as Record<string, unknown>)
  }

  async createUserRole (data: CreateUserRoleDto): Promise<UserRole> {
    const { data: row, error } = await supabase
      .from('user_roles')
      .insert({
        name: data.name,
        is_admin_role: data.isAdminRole
      })
      .select()
      .single()
    throwIfError(error)
    return rowToUserRole(row as Record<string, unknown>)
  }

  async updateUserRole (id: string, data: UpdateUserRoleDto): Promise<UserRole> {
    const patch: Record<string, unknown> = {}
    if (data.name !== undefined) patch.name = data.name
    if (data.isAdminRole !== undefined) patch.is_admin_role = data.isAdminRole

    if (Object.keys(patch).length === 0) {
      return this.fetchUserRole(id)
    }

    const { data: row, error } = await supabase
      .from('user_roles')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    throwIfError(error)
    return rowToUserRole(row as Record<string, unknown>)
  }

  async deleteUserRole (id: string): Promise<void> {
    const { error } = await supabase.from('user_roles').delete().eq('id', id)
    throwIfError(error)
  }
}

export const userRolesService = new UserRolesService()
