import { useModals } from '@/composables/use-modals'
import type { Component } from 'vue'

export function useAppModals () {
  return useModals({
    TeamsFilterModal: defineAsyncComponent(() => import('@/views/teams/modals/TeamFilterModal.vue')) as Component,
    TeamsPlayersDrawer: defineAsyncComponent(() => import('@/views/teams/components/TeamsPlayersDrawer.vue')) as Component,
    PlayersFilterModal: defineAsyncComponent(() => import('@/views/players/modals/PLayersFilterModal.vue')) as Component,
    PlayersCallModal: defineAsyncComponent(() => import('@/views/players/modals/PlayersCallModal.vue')) as Component,
    TournamentFilterModal: defineAsyncComponent(() => import('@/views/tournaments/modals/TournamentFilterModal.vue')) as Component,
    PlayerAddToTeamModal: defineAsyncComponent(() => import('@/components/modals/PlayerAddToTeamModal.vue')) as Component,
    TeamCreateModal: defineAsyncComponent(() => import('@/views/players/modals/TeamCreateModal.vue')) as Component,
    PLayerEditProfileModal: defineAsyncComponent(() => import('@/views/players/modals/PLayerEditProfileModal.vue')) as Component,
    AdminAddPointsModal: defineAsyncComponent(() => import('@/views/players/modals/AdminAddPointsModal.vue')) as Component,
    ChangeCaptainModal: defineAsyncComponent(() => import('@/views/teams/modals/ChangeCaptainModal.vue')) as Component,
    MixTournamentFilterModal: defineAsyncComponent(() => import('@/views/mix-tournaments/modals/MixTournamentFilterModal.vue')) as Component,
    CreateMixTeamModal: defineAsyncComponent(() => import('@/views/mix-tournaments/modals/CreateMixTeamModal.vue')) as Component,
    AddPlayerToMixTeamModal: defineAsyncComponent(() => import('@/views/mix-tournaments/modals/AddPlayerToMixTeamModal.vue')) as Component,
    RollPlayersModal: defineAsyncComponent(() => import('@/views/mix-tournaments/modals/RollPlayersModal.vue')) as Component,
    ProfileRequestMmrModal: defineAsyncComponent(() => import('@/views/players/modals/ProfileRequestMmrModal.vue')) as Component,
    AdminUpdateMmrModal: defineAsyncComponent(() => import('@/views/players/modals/AdminUpdateMmrModal.vue')) as Component,
    MailboxModal: defineAsyncComponent(() => import('@/components/modals/MailboxModal.vue')) as Component,
    BugReportModal: defineAsyncComponent(() => import('@/components/modals/BugReportModal.vue')) as Component
  })
}
