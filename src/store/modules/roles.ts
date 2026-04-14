// import { userRolesService } from '@/services/user-roles.service'
// import type { TUserRole as UserRole } from '@/api/types/api.types'

// export const useRolesStore = defineStore('roles', () => {
//   const visibleRoles = ref<UserRole[]>([])

//   async function fetchVisibleRoles () {
//     try {
//       const res = await userRolesService.fetchUserRoles()
//       visibleRoles.value = res
//       return res
//     } catch (e) {
//       console.error('Error fetching roles:', e)
//       throw e
//     }
//   }

//   return {
//     visibleRoles,
//     fetchVisibleRoles
//   }
// })
