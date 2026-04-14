import apiClient from '@/api/client'
import type { TUserRole as UserRole, TCreateUserRoleDto as CreateUserRoleDto, TUpdateUserRoleDto as UpdateUserRoleDto } from '@/api/types/api.types'

class UserRolesService {
  async fetchUserRoles (): Promise<UserRole[]> {
    const res = await apiClient.get('/user-roles')
    return res as UserRole[]
  }

  async fetchUserRole (id: string): Promise<UserRole> {
    const res = await apiClient.get('/user-roles/{id}', {
      dynamicKeys: { id }
    })
    return res as UserRole
  }

  async createUserRole (data: CreateUserRoleDto): Promise<UserRole> {
    const res = await apiClient.post('/user-roles', data)
    return res as UserRole
  }

  async updateUserRole (id: string, data: UpdateUserRoleDto): Promise<UserRole> {
    const res = await apiClient.patch('/user-roles/{id}', data, {
      dynamicKeys: { id }
    })
    return res as UserRole
  }

  async deleteUserRole (id: string): Promise<void> {
    await apiClient.delete('/user-roles/{id}', {
      dynamicKeys: { id }
    })
  }
}

export const userRolesService = new UserRolesService()
