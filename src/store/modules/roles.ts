import apiClient from '@/api/client'

export const useRolesStore = defineStore('roles', () => {
  const visibleRoles = ref<TRole[]>([])

  async function fetchVisibleRoles () {
    try {
      console.log('Fetching visible roles...')
      const res = await apiClient.get('/api/v1/roles/visible')
      console.log('Roles response:', res)
      visibleRoles.value = res
      return res
    } catch (e) {
      console.error('Error fetching roles:', e)
      throw e
    }
  }

  return {
    visibleRoles,
    fetchVisibleRoles
  }
})
