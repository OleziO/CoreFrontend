import { AxiosError } from 'axios'

export const useTournamentStore = defineStore('tournaments', () => {
  const tournamentsData = ref<TTournamentWithParticipants[]>([])
  const divisionsData = ref<TDivision[]>([])
  const loading = ref(false)

  const getDivisions = async () => {
    loading.value = true
    try {
      const data = await tournamentsService.fetchDivisions()

      divisionsData.value = data || []
    } catch (e) {
      if (e instanceof Error) {
        ElMessage.error(e)
      }
    } finally {
      loading.value = false
    }
  }

  async function getTournaments () {
    if (tournamentsData.value.length) return

    loading.value = true
    try {
      const data = await tournamentsService.fetchTournaments()

      tournamentsData.value = data || []
      return data
    } catch (e) {
      if (e instanceof AxiosError) {
        ElMessage.error(e.response?.data.detail)
      }
    } finally {
      loading.value = false
    }
  }

  async function findTournament (tournamentId: number | null) {
    if (!tournamentsData.value.length) {
      await getTournaments()
    }

    if (!tournamentId) return null

    return tournamentsData.value.find(tournament => tournament.id === tournamentId) || null
  }

  async function registerInTeamTournament (tournamentId: number) {
    loading.value = true
    try {
      const res = await tournamentsService.registerInTeamTournament(tournamentId)

      if (res) {
        const currTournament = await findTournament(tournamentId)

        if (currTournament) {
          Object.assign(currTournament, res)
        }
      }
      ElMessage.success('Команду успішно зареєстровано на турнір')
    } catch (e: any) {
      console.log(e)
      ElMessage.error(e.response.data.detail)
    } finally {
      loading.value = false
    }
  }

  async function unRegisterInTeamTournament (tournamentId: number) {
    loading.value = true
    try {
      const res = await tournamentsService.unregisterFromTeamTournament(tournamentId)
      if (res) {
        const currTournament = await findTournament(tournamentId)
        if (currTournament) {
          Object.assign(currTournament, res)
        }
      }
      ElMessage.success('Турнір успішно покинуто')
    } catch (e: any) {
      ElMessage.error(e.response.data.detail)
    } finally {
      loading.value = false
    }
  }

  const startTournament = async (tournamentId: number) => {
    loading.value = true
    try {
      const res = await tournamentsService.startTournament(tournamentId)

      if (res) {
        const currTournament = await findTournament(tournamentId)
        if (currTournament) {
          Object.assign(currTournament, res)
        }
      }
      ElMessage.success('Турнір успішно розпочато')
    } catch (e: any) {
      ElMessage.error(e.response.data.detail)
    } finally {
      loading.value = false
    }
  }

  const openRegistrationTournament = async (tournamentId: number) => {
    loading.value = true
    try {
      const res = await tournamentsService.openRegistrationTournament(tournamentId)

      if (res) {
        const currTournament = await findTournament(tournamentId)
        if (currTournament) {
          Object.assign(currTournament, res)
        }
      }
      ElMessage.success('Реєстрацію турніру успішно відкрито')
    } catch (e: any) {
      ElMessage.error(e.response.data.detail)
    } finally {
      loading.value = false
    }
  }

  const endTournament = async (tournamentId: number, winnerId: number, _points: number) => {
    loading.value = true
    try {
      const res = await tournamentsService.endTournament(tournamentId, winnerId, _points)

      if (res) {
        const currTournament = await findTournament(tournamentId)
        if (currTournament) {
          Object.assign(currTournament, res)
        }
      }
      ElMessage.success('Турнір успішно завершено та поінти нараховано')
    } catch (e: any) {
      ElMessage.error(e.response?.data?.detail || 'Помилка при завершенні турніру')
    } finally {
      loading.value = false
    }
  }

  async function getOpenMatches (tournamentId: number, _loading = true) {
    loading.value = _loading

    try {
      const res = await tournamentsService.getOpenMatches(tournamentId)
      return res
    } finally {
      loading.value = false
    }
  }

  const adminUnregisterTeamFromTournament = async (tournamentId: number, teamId: number) => {
    loading.value = true
    try {
      const res = await tournamentsService.adminUnregisterTeamFromTournament(
        tournamentId,
        teamId
      ) as TTournamentWithParticipants

      if (res) {
        const currTournament = await findTournament(tournamentId)
        if (currTournament) {
          Object.assign(currTournament, res)
        }
      }
      ElMessage.success('Команду успішно видалено з турніру')
      return res
    } catch (e: any) {
      ElMessage.error(e.response?.data?.detail || 'Помилка при видаленні команди з турніру')
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    tournamentsData,
    divisionsData,
    loading,
    registerInTeamTournament,
    unRegisterInTeamTournament,
    startTournament,
    findTournament,
    getDivisions,
    getTournaments,
    getOpenMatches,
    adminUnregisterTeamFromTournament,
    openRegistrationTournament,
    endTournament
  }
})
