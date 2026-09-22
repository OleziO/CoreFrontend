export const tournamentFields = [
  { label: 'Назва', model: 'title', placeholder: 'Назва турніру' },
  { label: 'Опис', model: 'description', placeholder: 'Опис турніру' },
  { label: 'Призи', model: 'prizes', placeholder: 'Призи турніру' },
  { label: 'Початок турніру', model: 'start_time', placeholder: '2025-01-01' },
  { label: 'Кінець турніру', model: 'end_time', placeholder: '2025-01-02' },
  { label: 'Початок кваліфікації', model: 'start_registration', placeholder: '2025-01-01' },
  { label: 'Кінець кваліфікації', model: 'end_registration', placeholder: '2025-01-02' }
] as const

/**
 * Розміри видимої картки турніру (розміри списку = картка + gap, див. `VirtualList.vue` pb-20 pr-20 і `useVirtualGridLayout`).
 */
export const TOURNAMENT_CARD_WIDTH = 360
export const TOURNAMENT_CARD_HEIGHT = 400

export const tournamentByStatus = {
  'pre-registration': 'До кваліфікації',
  registration: 'Кваліфікація',
  'in-progress': 'У процессі',
  ended: 'Завершено'
}

export const tournamentTypeArr = [
  { key: 'team', label: '5x5' },
  { key: 'mix', label: 'Мікс' }
]

export const tournamentType = {
  all: 'Усі',
  team: '5x5',
  mix: 'Мікс'
}

export const DEFAULT_TOURNAMENT_FILTERS = {
  status: [],
  type: []
}
