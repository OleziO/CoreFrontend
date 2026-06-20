<template>
  <div
    v-loading.fullscreen="teamsStore.loading || playersStore.loading"
    class="w-full flex justify-center overflow-auto py-20 px-20 lg:px-40"
  >
    <div
      class="nm:pt-60 pt-20 relative grid lg:grid-cols-[1fr_2fr] h-full w-full lg:max-w-[1400px] gap-20
      lg:items-stretch scrollbar-gutter-stable"
    >
      <AppBackButton />

      <aside class="flex flex-1 flex-col gap-20 max-w-full lg:max-w-[600px] lg:self-stretch">
        <TeamProfileCard
          :team="team"
          :can-edit-team-profile="canEditTeamProfile"
          :can-edit-team-roster="canEditTeamRoster"
          :is-admin="isAdmin"
          :can-verify-players="isTeamCaptain"
          :verify-team-loading="verifyTeamLoading"
          :is-mobile="isMobile"
          :window-width="currWindow.width.value"
          @edit-team="open('TeamCreateModal', { team, onSubmit: handleTeamUpdate })"
          @verify-players="openVerificationBooking"
          @verify-team="handleVerifyTeam"
          @unverify-team="handleUnverifyTeam"
          @transfer-captain="changeCapTeam"
          @disband-team="handleDisbandTeam"
        />

        <TeamTournamentHistory :tournaments="teamTournaments" />
      </aside>

      <TeamRoster
        :team="team"
        :can-edit-team-roster="canEditTeamRoster"
        :is-admin="isAdmin"
        :remove-player-loading-id="removePlayerLoadingId"
        :remove-coach-loading="removeCoachLoading"
        @remove-player="handleRemovePlayer"
        @remove-coach="handleRemoveCoach"
        @add-player="handleOpenAddPlayer"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessageBox } from 'element-plus'
import { useWindowSize } from '@vueuse/core'
import { teamsService } from '@/views/teams/teams.service'
import type { TUpdateTeamPayload } from '@/views/teams/teams.service'
import { ERemovePlayerPenalty } from '@/views/teams/teams.enums'

const route = useRoute()
const id = String(route.params.id)

const { open, close } = useAppModals()

const authStore = useAuthStore()
const currWindow = useWindowSize()
const isMobile = computed(() => currWindow.width.value < 850)

const teamsStore = useTeamsStore()
const playersStore = usePlayersStore()

const team = ref<TTeam | null>(null)

const isAdmin = computed(() => authStore.isAdmin.isAdmin || authStore.isAdmin.isModerator)

const isTeamCaptain = computed(
  () =>
    !!authStore.user?.id &&
    !!team.value?.captain?.id &&
    authStore.user.id === team.value!.captain!.id
)

const rosterLockedForEdits = computed(() => false)

const canEditTeamRoster = computed(
  () => (isAdmin.value || isTeamCaptain.value) && !rosterLockedForEdits.value
)

const canEditTeamProfile = computed(() => canEditTeamRoster.value)

const teamTournaments = computed(() => team.value?.tournaments ?? [])

const verifyTeamLoading = ref(false)
const removePlayerLoadingId = ref<string | null>(null)
const removeCoachLoading = ref(false)

async function handleVerifyTeam () {
  const tid = team.value?.id
  if (!tid || team.value?.isVerified) return
  verifyTeamLoading.value = true
  const updated = await teamsService.verifyTeam(tid)
  if (updated) {
    teamsStore.patchTeamInList(updated)
    team.value = updated
  }
  verifyTeamLoading.value = false
}

async function handleUnverifyTeam () {
  const tid = team.value?.id
  if (!tid || !team.value?.isVerified) return
  const confirmed = await ElMessageBox.confirm(
    'Верифікацію буде знято з команди.',
    'Зняти верифікацію?',
    {
      confirmButtonText: 'Зняти',
      cancelButtonText: 'Скасувати',
      type: 'warning',
      distinguishCancelAndClose: true
    }
  ).then(() => true).catch(() => false)
  if (!confirmed) return
  verifyTeamLoading.value = true
  const updated = await teamsService.unverifyTeam(tid)
  if (updated) {
    teamsStore.patchTeamInList(updated)
    team.value = updated
  }
  verifyTeamLoading.value = false
}

async function handleRemovePlayer (playerId: string, penalty?: ERemovePlayerPenalty) {
  const tid = team.value?.id
  if (!tid) return
  removePlayerLoadingId.value = playerId
  const updated = await teamsService.removePlayerFromTeam(tid, playerId, penalty)
  if (updated) {
    playersStore.setPlayerTeamIdClientside(playerId, null)
    teamsStore.patchTeamInList(updated)
    team.value = updated
  }
  removePlayerLoadingId.value = null
}

async function handleRemoveCoach () {
  const tid = team.value?.id
  if (!tid) return
  removeCoachLoading.value = true
  const updated = await teamsService.removeCoach(tid)
  if (updated) {
    teamsStore.patchTeamInList(updated)
    team.value = updated
  }
  removeCoachLoading.value = false
}

async function handleTeamUpdate (payload: TUpdateTeamPayload) {
  const tid = team.value?.id
  if (!tid) return
  const updated = await teamsService.updateTeamProfile(tid, payload)
  if (updated) {
    teamsStore.patchTeamInList(updated)
    team.value = updated
    close('TeamCreateModal')
  }
}

function openVerificationBooking () {
  if (!team.value) return
  open('VerificationBookingModal', { team: team.value })
}

function changeCapTeam () {
  if (!team.value?.id) return
  open('ChangeCaptainModal', {
    team: team.value,
    teamId: team.value.id,
    onUpdated: (updated: TTeam) => {
      team.value = updated
    }
  })
}

function handleDisbandTeam () {
  const tid = team.value?.id
  if (!tid) return
  teamsStore.deleteTeam(tid)
}

function handleOpenAddPlayer (slot: 'main' | 'reserved' | 'coach') {
  if (isAdmin.value) {
    open('PlayerAddToTeamModal', {
      team: team.value,
      isMain: slot === 'main',
      isCoach: slot === 'coach',
      onAdded: async () => {
        const updated = await teamsService.loadTeam(team.value?.id ?? id)
        if (updated) {
          teamsStore.patchTeamInList(updated)
          team.value = updated
        }
      }
    })
  } else {
    open('CreateInviteModal', {
      teamId: team.value?.id,
      slot
    })
  }
}

onMounted(async () => {
  const cached = await teamsStore.findTeam(id)
  if (cached) {
    team.value = cached
  } else {
    const loaded = await teamsService.loadTeam(id)
    if (loaded) teamsStore.patchTeamInList(loaded)
    team.value = loaded
  }
})
</script>
