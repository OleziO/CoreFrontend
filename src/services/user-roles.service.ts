import apiClient from '@/api/client'
import type { TUserRole as UserRole, TCreateUserRoleDto as CreateUserRoleDto, TUpdateUserRoleDto as UpdateUserRoleDto } from '@/api/types/api.types'

class UserRolesService {
  async fetchUserRoles () {
    return await apiClient.get('/user-roles') as unknown as UserRole[]
  }

  async fetchUserRole (id: string) {
    return await apiClient.get('/user-roles/{id}', {
      dynamicKeys: { id }
    }) as unknown as UserRole
  }

  async createUserRole (data: CreateUserRoleDto) {
    return await apiClient.post('/user-roles', data) as unknown as UserRole
  }

  async updateUserRole (id: string, data: UpdateUserRoleDto) {
    return await apiClient.patch('/user-roles/{id}', data, {
      dynamicKeys: { id }
    }) as unknown as UserRole
  }

  async deleteUserRole (id: string): Promise<void> {
    await apiClient.delete('/user-roles/{id}', {
      dynamicKeys: { id }
    })
  }
}

export const userRolesService = new UserRolesService()
