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
  VerificationBookingModal:
    defineAsyncComponent(() => import('@/views/teams/modals/VerificationBookingModal.vue')) as Component,
  AdminUpdateMmrModal: defineAsyncComponent(() => import('@/views/players/modals/AdminUpdateMmrModal.vue')) as Component,
  PlayerRequestMmrModal: defineAsyncComponent(() => import('@/views/players/modals/PlayerRequestMmrModal.vue')) as Component,
  DueloPromoModal: defineAsyncComponent(() => import('@/views/tournaments/modals/DueloPromoModal.vue')) as Component,
  PlayoffSubmitResultModal:
    defineAsyncComponent(() => import('@/views/tournaments/modals/PlayoffSubmitResultModal.vue')) as Component,
  TestMatchCreationModal:
    defineAsyncComponent(() => import('@/views/tournaments/modals/TestMatchCreationModal.vue')) as Component,
  TechLossQualificationModal:
    defineAsyncComponent(() => import('@/views/tournaments/modals/TechLossQualificationModal.vue')) as Component,
  TechLossPlayoffModal:
    defineAsyncComponent(() => import('@/views/tournaments/modals/TechLossPlayoffModal.vue')) as Component,
  LinkDotaMatchIdModal:
    defineAsyncComponent(() => import('@/views/tournaments/modals/LinkDotaMatchIdModal.vue')) as Component,
  EditOperationModal:
    defineAsyncComponent(() => import('@/views/finance-monitor/modals/EditOperationModal.vue')) as Component,
  EditGroupModal:
    defineAsyncComponent(() => import('@/views/finance-monitor/modals/EditGroupModal.vue')) as Component,
  GroupOperationsModal:
    defineAsyncComponent(() => import('@/views/finance-monitor/modals/GroupOperationsModal.vue')) as Component,
  CreateCustomCategoryModal:
    defineAsyncComponent(() => import('@/views/finance-monitor/modals/CreateCustomCategoryModal.vue')) as Component,
  MmrProofsLightboxModal:
    defineAsyncComponent(() => import('@/views/admin-panel/modals/MmrProofsLightboxModal.vue')) as Component,
  LoginModal: defineAsyncComponent(() => import('@/components/modals/LoginModal.vue')) as Component,
  VipModal: defineAsyncComponent(() => import('@/components/modals/VipModal.vue')) as Component,
  AdminVipModal: defineAsyncComponent(() => import('@/views/players/modals/AdminVipModal.vue')) as Component,
  DuelChallengeFriendModal:
    defineAsyncComponent(() => import('@/views/duels/modals/DuelChallengeFriendModal.vue')) as Component,
  DuelHowItWorksModal:
    defineAsyncComponent(() => import('@/views/duels/modals/DuelHowItWorksModal.vue')) as Component,
  DuelLeaderboardRowModal:
    defineAsyncComponent(() => import('@/views/duels/modals/DuelLeaderboardRowModal.vue')) as Component,
  DuelAdminMatchesModal:
    defineAsyncComponent(() => import('@/views/duels/modals/DuelAdminMatchesModal.vue')) as Component,
  LeaderboardRowModal:
    defineAsyncComponent(() => import('@/views/leaderboard/modals/LeaderboardRowModal.vue')) as Component
})

export function useAppModals () {
  return appModals
}
