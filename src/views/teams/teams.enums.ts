export const teamStatus = [
  { key: 'approved', label: 'Верифіковані' },
  { key: 'applied', label: 'Не верифіковані' }
]

/** Штраф очок при видаленні гравця з команди (query param `penalty`). */
export enum ERemovePlayerPenalty {
  /** Зменшує турнірні очки гравця до 30% (дефолт бекенду). */
  SUBTRACT = 'subtract',
  /** Прибирає гравця без зміни очок (адмін-оверрайд). */
  NONE = 'none',
}
