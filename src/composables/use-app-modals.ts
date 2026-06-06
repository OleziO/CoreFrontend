import { useModals } from '@/composables/use-modals'

/** Один виклик useModals у модулі — інакше різні closures / _components і ламані async-модалки. */
export const appModals = useModals({
  TeamsFilterModal: defineAsyncComponent(() => import('@/views/teams/modals/TeamFilterModal.vue')) as Component,
  TeamsPlayersDrawer: defineAsyncComponent(() => import('@/views/teams/components/TeamsPlayersDrawer.vue')) as Component,
  PlayersFilterModal: defineAsyncComponent(() => import('@/views/players/modals/PlayersFilterModal.vue')) as Component,
  PlayersCallModal: defineAsyncComponent(() => import('@/views/players/modals/PlayersCallModal.vue')) as Component,
  TournamentFilterModal: defineAsyncComponent(() => import('@/views/tournaments/modals/TournamentFilterModal.vue')) as Component,
  PlayerAddToTeamModal: defineAsyncComponent(() => import('@/components/modals/PlayerAddToTeamModal.vue')) as Component,
  TeamCreateModal: defineAsyncComponent(() => import('@/views/teams/modals/TeamCreateModal.vue')) as Component,
  PlayerEditProfileModal: defineAsyncComponent(() => import('@/views/players/modals/PlayerEditProfileModal.vue')) as Component,
  AdminAddPointsModal: defineAsyncComponent(() => import('@/views/players/modals/AdminAddPointsModal.vue')) as Component,
  ChangeCaptainModal: defineAsyncComponent(() => import('@/views/teams/modals/ChangeCaptainModal.vue')) as Component,
  CreateInviteModal: defineAsyncComponent(() => import('@/views/teams/modals/CreateInviteModal.vue')) as Component,
  ProfileRequestMmrModal: defineAsyncComponent(() => import('@/views/profile/components/modals/ProfileRequestMmrModal.vue')) as Component,
  AdminUpdateMmrModal: defineAsyncComponent(() => import('@/views/players/modals/AdminUpdateMmrModal.vue')) as Component,
  DueloPromoModal: defineAsyncComponent(() => import('@/views/tournaments/modals/DueloPromoModal.vue')) as Component,
  PlayoffSubmitResultModal:
    defineAsyncComponent(() => import('@/views/tournaments/modals/PlayoffSubmitResultModal.vue')) as Component,
  TestMatchCreationModal:
    defineAsyncComponent(() => import('@/views/tournaments/modals/TestMatchCreationModal.vue')) as Component,
  TechLossQualificationModal:
    defineAsyncComponent(() => import('@/views/tournaments/modals/TechLossQualificationModal.vue')) as Component,
  TechLossPlayoffModal:
    defineAsyncComponent(() => import('@/views/tournaments/modals/TechLossPlayoffModal.vue')) as Component,
  RenameOperationModal:
    defineAsyncComponent(() => import('@/views/finance-monitor/modals/RenameOperationModal.vue')) as Component,
  SelectIconModal:
    defineAsyncComponent(() => import('@/views/finance-monitor/modals/SelectIconModal.vue')) as Component,
  GroupOperationsModal:
    defineAsyncComponent(() => import('@/views/finance-monitor/modals/GroupOperationsModal.vue')) as Component,
  CreateCustomCategoryModal:
    defineAsyncComponent(() => import('@/views/finance-monitor/modals/CreateCustomCategoryModal.vue')) as Component
})

export function useAppModals () {
  return appModals
}
