// Обрати внимание: значения (values) точно такие, как ты просил в списке
export enum ERequestStatus {
  NEW = 'new',
  ASSIGNED = 'assigned',
  COMMITED = 'commited', // Оставил как в твоем списке (обычно пишется committed)
  MERGED = 'merged',
  CLOSED = 'closed',
}

export const requestStatusLabelMap: Record<string, string> = {
  [ERequestStatus.NEW]: 'Новий',
  [ERequestStatus.ASSIGNED]: 'В роботі', // Или 'Призначено'
  [ERequestStatus.COMMITED]: 'Зафіксовано',
  [ERequestStatus.MERGED]: 'Об’єднано',
  [ERequestStatus.CLOSED]: 'Закрито'
}

export const requestStatusClassMap: Record<string, string> = {
  // 🔵 Синий (Новый/Свежий)
  [ERequestStatus.NEW]: `
    !border !border-blue-500/40 !bg-blue-500/10 !text-blue-400
    rounded-lg px-8 py-4 text-[11px] font-semibold tracking-wide
    shadow-[0_0_12px_rgba(59,130,246,0.2)]
  `,

  // 🟠 Оранжевый/Янтарный (В работе/Назначен)
  [ERequestStatus.ASSIGNED]: `
    !border !border-amber-500/40 !bg-amber-500/10 !text-amber-400
    rounded-lg px-8 py-4 text-[11px] font-semibold tracking-wide
    shadow-[0_0_12px_rgba(245,158,11,0.2)]
  `,

  // 💜 Фиолетовый (Закоммичен/Код)
  [ERequestStatus.COMMITED]: `
    !border !border-purple-500/40 !bg-purple-500/10 !text-purple-400
    rounded-lg px-8 py-4 text-[11px] font-semibold tracking-wide
    shadow-[0_0_12px_rgba(168,85,247,0.2)]
  `,

  // 💚 Изумрудный (Смержен/Успех)
  [ERequestStatus.MERGED]: `
    !border !border-emerald-500/40 !bg-emerald-500/10 !text-emerald-400
    rounded-lg px-8 py-4 text-[11px] font-semibold tracking-wide
    shadow-[0_0_12px_rgba(16,185,129,0.2)]
  `,

  // ⚫ Серый/Слейт (Закрыт/Архив)
  [ERequestStatus.CLOSED]: `
    !border !border-slate-500/40 !bg-slate-500/10 !text-slate-400
    rounded-lg px-8 py-4 text-[11px] font-semibold tracking-wide
    shadow-[0_0_12px_rgba(148,163,184,0.2)]
  `
}
