import { AxiosError } from 'axios'

export const useMixTournamentStore = defineStore('mix', () => {
  const playersStore = usePlayersStore()
  const mixTournaments = ref<TMixTournament[]>([])
  const openMatches = ref<Record<number, TMixOpenMatch[]>>({})
  const isLoading = ref(false)

  async function getMixTournaments (withReload = false) {
    if (mixTournaments.value.length && !withReload) return

    isLoading.value = true

    try {
      const res = await mixTournamentsService.fetchMixTournaments()
      await playersStore.getPlayers()

      mixTournaments.value = res || []
    } catch (e) {
      if (e instanceof AxiosError) {
        ElMessage.error(e.response?.data.detail)
      }
    } finally {
      isLoading.value = false
    }
  }

  async function getMixTournament (tournamentId: number) {
    isLoading.value = true

    try {
      const res = await mixTournamentsService.fetchMixTournament(tournamentId)
      const currTournament = await findMixTournament(tournamentId)

      if (currTournament) {
        Object.assign(currTournament, res)
      }
    } catch (e) {
      if (e instanceof AxiosError) {
        ElMessage.error(e.response?.data.detail)
      }
    } finally {
      isLoading.value = false
    }
  }

  async function getOpenMatches (tournamentId: number) {
    isLoading.value = true

    try {
      openMatches.value[tournamentId] = await mixTournamentsService.getOpenMatches(tournamentId)
    } catch (e) {
      if (e instanceof AxiosError) {
        ElMessage.error(e.response?.data.detail)
      }
    } finally {
      isLoading.value = false
    }
  }

  async function findMixTournament (mixTournamentId: number) {
    if (!mixTournaments.value.length) {
      await getMixTournaments()
    }

    if (!mixTournamentId) return null

    return mixTournaments.value.find(tournament => tournament.id === mixTournamentId) || null
  }

  async function setPlayerPoll (tournamentId: number, playerId: number, poolValue: number) {
    isLoading.value = true

    try {
      const resTournament = await mixTournamentsService.setPlayerPool(
        tournamentId,
        playerId,
        poolValue
      )

      const currTournament = await findMixTournament(tournamentId)

      if (currTournament) {
        Object.assign(currTournament, resTournament)
      }

      ElMessage.success('Пул успішно змінено')
    } catch (e) {
      if (e instanceof AxiosError) {
        ElMessage.error(e.response?.data.detail)
      }
    } finally {
      isLoading.value = false
    }
  }

  async function updateOpenMath (
    tournamentId: number,
    matchId: number,
    score: { team_1_score: number; team_2_score: number }
  ) {
    isLoading.value = true

    try {
      const newMatches = await mixTournamentsService.updateMatchResult(
        tournamentId,
        matchId,
        {
          team_1_score: score.team_1_score,
          team_2_score: score.team_2_score
        }
      )

      openMatches.value[tournamentId] = newMatches

      ElMessage.success('Матчі оновлено')
    } catch (e) {
      if (e instanceof AxiosError) {
        ElMessage.error(e.response?.data.detail)
      }
    } finally {
      isLoading.value = false
    }
  }

  async function startMixBracket (tournamentId: number) {
    isLoading.value = true

    try {
      const resTournament = await mixTournamentsService.startMixBracket(tournamentId)

      const currTournament = await findMixTournament(tournamentId)

      if (currTournament) {
        Object.assign(currTournament, resTournament)
      }

      ElMessage.success('Пул успішно змінено')
    } catch (e) {
      if (e instanceof AxiosError) {
        ElMessage.error(e.response?.data.detail)
      }
    } finally {
      isLoading.value = false
    }
  }

  async function distributePools (tournamentId: number) {
    isLoading.value = true

    try {
      const resTournament = await mixTournamentsService.distributePools(tournamentId)

      const currTournament = await findMixTournament(tournamentId)

      if (currTournament) {
        Object.assign(currTournament, resTournament)
      }

      ElMessage.success('Пул успішно змінено')
    } catch (e) {
      if (e instanceof AxiosError) {
        ElMessage.error(e.response?.data.detail)
      }
    } finally {
      isLoading.value = false
    }
  }

  async function addPlayerToMix (player: TPlayer, tournamentId: number) {
    isLoading.value = true

    try {
      const resTournament = await mixTournamentsService.addPlayerToMix(tournamentId, player.id)

      const currTournament = await findMixTournament(tournamentId)

      if (currTournament) {
        Object.assign(currTournament, resTournament)
      }

      ElMessage.success('Гравця додано до турніру')
    } catch (e) {
      if (e instanceof AxiosError) {
        ElMessage.error(e.response?.data.detail)
      }
    } finally {
      isLoading.value = false
    }
  }

  async function addPlayerToMixTeam (playerId: number, tournamentId: number, teamID: number) {
    isLoading.value = true

    try {
      const resTournament = await mixTournamentsService.addPlayerToMixTeam(
        tournamentId,
        teamID,
        playerId
      )

      const currTournament = await findMixTournament(tournamentId)

      if (currTournament) {
        Object.assign(currTournament, resTournament)
      }

      ElMessage.success('Гравця додано до команди')
    } catch (e) {
      if (e instanceof AxiosError) {
        ElMessage.error(e.response?.data.detail)
      }
    } finally {
      isLoading.value = false
    }
  }

  async function removePlayerFromMix (mixTournament: TMixTournament, playerID: number) {
    isLoading.value = true

    try {
      const resTournament = await mixTournamentsService.removePlayerFromMix(mixTournament.id, playerID)

      const currTournament = await findMixTournament(mixTournament.id)

      if (currTournament) {
        Object.assign(currTournament, resTournament)
      }

      ElMessage.success('Гравця видалено з турніру')
    } catch (e) {
      if (e instanceof AxiosError) {
        ElMessage.error(e.response?.data.detail)
      }
    } finally {
      isLoading.value = false
    }
  }

  async function removePlayerFromTeam (mixTournament: TMixTournament, playerID: number, teamId: number) {
    isLoading.value = true

    try {
      const resTournament = await mixTournamentsService.removePlayerFromMixTeam(mixTournament.id, teamId, playerID)

      const currTournament = await findMixTournament(mixTournament.id)

      if (currTournament) {
        Object.assign(currTournament, resTournament)
      }

      ElMessage.success('Гравця видалено з турніру')
    } catch (e) {
      if (e instanceof AxiosError) {
        ElMessage.error(e.response?.data.detail)
      }
    } finally {
      isLoading.value = false
    }
  }

  async function rewardMixTeam (winnerTeamId: number, points: number, tournamentId: number) {
    isLoading.value = true

    try {
      const resTournament = await mixTournamentsService.rewardMixTournamentWinners(tournamentId, {
        winner_team_id: winnerTeamId,
        points
      })

      const currTournament = await findMixTournament(tournamentId)

      if (currTournament) {
        Object.assign(currTournament, resTournament)
      }
    } catch (e) {
      if (e instanceof AxiosError) {
        ElMessage.error(e.response?.data.detail)
      }
    } finally {
      isLoading.value = false
    }
  }

  async function toggleCapitanPlayer (tournamentId: number, playerId: number, isCap: boolean) {
    const statusMsg = isCap ? 'призначено капітаном' : 'знято з капітанства'

    try {
      const resTournament = await mixTournamentsService.toggleCapitanPlayer(tournamentId, playerId, isCap)

      const currTournament = await findMixTournament(tournamentId)

      if (currTournament) {
        Object.assign(currTournament, resTournament)
      }

      ElMessage.success(`Гравця успішно ${statusMsg}`)
    } catch (e) {
      if (e instanceof AxiosError) {
        ElMessage.error(e.response?.data.detail)
      }
    }
  }

  async function register (id: number) {
    isLoading.value = true

    try {
      const resTournament = await mixTournamentsService.register(id)

      const currTournament = await findMixTournament(id)

      if (currTournament) {
        Object.assign(currTournament, resTournament)
      }
    } finally {
      isLoading.value = false
    }
  }

  async function unregister (id: number) {
    isLoading.value = true

    try {
      const resTournament = await mixTournamentsService.unregister(id)

      const currTournament = await findMixTournament(id)

      if (currTournament) {
        Object.assign(currTournament, resTournament)
      }
    } finally {
      isLoading.value = false
    }
  }

  async function createTeam (tournament: TMixTournament, teamData: ICreateTeamForm) {
    const myID = useAuthStore().user!.id

    isLoading.value = true

    try {
      const resTournament = await mixTournamentsService.createMixTeam(tournament.id, myID, teamData)

      const currTournament = await findMixTournament(tournament.id)

      if (currTournament) {
        Object.assign(currTournament, resTournament)
      }
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    mixTournaments,
    getOpenMatches,
    openMatches,
    createTeam,
    getMixTournaments,
    getMixTournament,
    startMixBracket,
    findMixTournament,
    distributePools,
    updateOpenMath,
    toggleCapitanPlayer,
    addPlayerToMixTeam,
    removePlayerFromMix,
    setPlayerPoll,
    rewardMixTeam,
    removePlayerFromTeam,
    addPlayerToMix,
    register,
    unregister
  }
})
