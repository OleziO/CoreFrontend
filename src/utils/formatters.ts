// export const getStatusLabel = (status: string) => {
//   const statusMap: Record<string, string> = {
//     received: 'Отримано',
//     approved: 'Схвалено',
//     rejected: 'Відхилено',
//     pending: 'В очікуванні'
//   }
//   return statusMap[status] || status
// }

// export const getTypeLabel = (type: string | undefined | null) => {
//   const typeMap: Record<string, string> = {
//     mmr: 'Оновлення MMR',
//     position: 'Оновлення позиції'
//   }
//   return typeMap[type as string] || type
// }

// export const getTournamentType = (name: string | undefined | null) => {
//   const tournamentType: Record<string, string> = {
//     team: 'Командний',
//     mix: 'Мікс'
//   }
//   return tournamentType[name as keyof typeof tournamentType]
// }

// export const getTournamentStatus = (name: string | undefined | null) => {
//   const tournamentType: Record<string, string> = {
//     'pre-registration': 'Реєстрація буде незабаром',
//     registration: 'Реєстрація',
//     'in-progress': 'Триває',
//     ended: 'Завершено'
//   }
//   return tournamentType[name as keyof typeof tournamentType]
// }

import {
  tournamentAdminStatusOptions
} from '@/components/tournaments-tags/tournament.constants'

/** Статуси турніру для фільтрів списку та застарілого UpdateTournamentDrawer. */
export const tournamentStatuses = tournamentAdminStatusOptions.map(({ key, label }) => ({
  key,
  label
}))
