export enum ERequestType {
  MMR_REQUEST = 'mmr_request',
  PlAYER_VERIFICATION_REQUEST = 'player_verification_request',
  TEAM_VERIFICATION_REQUEST = 'team_verification_request',
  TEAM_CHANGED = 'team_cganged', // Обратите внимание: у вас тут опечатка в значении 'team_cganged', я оставил как в исходнике
  ADMIN_MESSAGE = 'admin_message',
  TOURNAMENTS = 'tournaments',
  TEAM_INVITE = 'team_invite',
}

export const requestTypeLabelMap: Record<string, string> = {
  [ERequestType.MMR_REQUEST]: 'Оновлення MMR',
  [ERequestType.PlAYER_VERIFICATION_REQUEST]: 'Запит на верифікацію',
  [ERequestType.TEAM_VERIFICATION_REQUEST]: 'Запит на верифікацію',
  [ERequestType.TEAM_CHANGED]: 'Зміни в команді',
  [ERequestType.ADMIN_MESSAGE]: 'Інформаційне',
  [ERequestType.TOURNAMENTS]: 'Турніри',
  [ERequestType.TEAM_INVITE]: 'Запрошення в команду'
}

export const requestTypeClassMap: Record<string, string> = {
  // 💜 Фиолетовый (Ранг/Магия)
  [ERequestType.MMR_REQUEST]: `
    !border !border-purple-500/40 !bg-purple-500/10 !text-purple-400
    rounded-lg px-8 py-4 text-[11px] font-semibold  tracking-wide
    shadow-[0_0_12px_rgba(168,85,247,0.2)]
  `,

  // 💚 Изумрудный (Успех/Верификация игрока)
  [ERequestType.PlAYER_VERIFICATION_REQUEST]: `
    !border !border-green-500/40 !bg-green-500/10 !text-green-400
    rounded-lg px-8 py-4 text-[11px] font-semibold  tracking-wide
    shadow-[0_0_12px_rgba(16,185,129,0.2)]
  `,

  // 💙 Небесно-голубой (Верификация команды - официально)
  [ERequestType.TEAM_VERIFICATION_REQUEST]: `
    !border !border-blue-500/40 !bg-blue-500/10 !text-blue-400
    rounded-lg px-8 py-4 text-[11px] font-semibold  tracking-wide
    shadow-[0_0_12px_rgba(14,165,233,0.2)]
  `,

  // 🧡 Оранжевый (Изменения/Внимание)
  [ERequestType.TEAM_CHANGED]: `
    !border !border-orange-500/40 !bg-orange-500/10 !text-orange-400
    rounded-lg px-8 py-4 text-[11px] font-semibold  tracking-wide
    shadow-[0_0_12px_rgba(249,115,22,0.2)]
  `,

  // 🔴 Розовый/Красный (Админ/Системное/Важное)
  [ERequestType.ADMIN_MESSAGE]: `
    !border !border-red-500/40 !bg-red-500/10 !text-red-400
    rounded-lg px-8 py-4 text-[11px] font-semibold  tracking-wide
    shadow-[0_0_12px_rgba(244,63,94,0.2)]
  `,

  // 💛 Желтый/Золотой (Турниры/Трофеи)
  [ERequestType.TOURNAMENTS]: `
    !border !border-yellow-500/40 !bg-yellow-500/10 !text-yellow-400
    rounded-lg px-8 py-4 text-[11px] font-semibold  tracking-wide
    shadow-[0_0_12px_rgba(234,179,8,0.2)]
  `,
  // 💜 Фиолетовый (Ранг/Магия)
  [ERequestType.TEAM_INVITE]: `
    !border !border-purple-500/40 !bg-purple-500/10 !text-purple-400
    rounded-lg px-8 py-4 text-[11px] font-semibold  tracking-wide
    shadow-[0_0_12px_rgba(244,63,94,0.2)]
  `
}
