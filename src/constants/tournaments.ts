export const tournamentFields = [
  { label: 'Назва', model: 'title', placeholder: 'Назва турніру' },
  { label: 'Опис', model: 'description', placeholder: 'Опис турніру' },
  { label: 'Призи', model: 'prizes', placeholder: 'Призи турніру' },
  { label: 'ID Дівізіону', model: 'division_id', placeholder: 'ID Дівізіону турніру' },
  { label: 'Початок турніру', model: 'start_time', placeholder: '2025-01-01' },
  { label: 'Кінець турніру', model: 'end_time', placeholder: '2025-01-02' },
  { label: 'Старт реєстрації', model: 'start_registration', placeholder: '2025-01-01' },
  { label: 'Кінець реєстрації', model: 'end_registration', placeholder: '2025-01-02' }
] as const

export const tournamentByStatus = {
  'pre-registration': 'Пре-реєстрація',
  registration: 'Реєстрація',
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
  division: [],
  type: []
}

export const divisions = [
  { name: 'Дивізіон I', id: 1 },
  { name: 'Дивізіон II', id: 2 },
  { name: 'Дивізіон III', id: 3 },
  { name: 'Напів-професійний Дивізіон', id: 4 },
  { name: 'Професійний Дивізіон', id: 5 }
]
