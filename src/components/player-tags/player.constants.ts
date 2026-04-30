import { ERole } from '@/types/general.types'
import { PhHandHeart, PhHandshake, PhLightning, PhShield, PhSword } from '@phosphor-icons/vue'

export const ROLES_ORDER = Object.values(ERole)

export const MAX_RATING = 22000

export enum EUserIsTeam {
  HAS_TEAM = 1,
  NO_TEAM = 0
}

export const hasTeamLabelMap: Record<EUserIsTeam, string> = {
  [EUserIsTeam.HAS_TEAM]: 'В команді',
  [EUserIsTeam.NO_TEAM]: 'Вільний'
}

/** Короткі підписи для пілюль без truncate; повний текст — у tooltip. */
export const hasTeamBadgeLabelMap: Record<EUserIsTeam, string> = {
  [EUserIsTeam.HAS_TEAM]: 'Склад',
  [EUserIsTeam.NO_TEAM]: 'Вільний'
}

export const roleLabelMap: Record<ERole, string> = {
  [ERole.ADMIN]: 'Адмін',
  [ERole.DEV]: 'ІТ',
  [ERole.MODERATOR]: 'Модер',
  [ERole.MEDIA]: 'Медіа',
  [ERole.CAP]: 'Капітан',
  [ERole.PLAYER]: 'Гравець',
  [ERole.GUEST]: 'Гість',
  [ERole.BLOCKED]: 'Заблокований',
  [ERole.DEFAULT]: 'Інше'
}

/** Компактні підписи тих самих ролей (перед показом — звірка по roleLabelMap або name). */
export const roleShortLabelMap: Record<ERole, string> = {
  [ERole.ADMIN]: 'Адмін',
  [ERole.DEV]: 'ІТ',
  [ERole.MODERATOR]: 'Мод.',
  [ERole.MEDIA]: 'Медіа',
  [ERole.CAP]: 'Кеп',
  [ERole.PLAYER]: 'Гр.',
  [ERole.GUEST]: 'Гість',
  [ERole.BLOCKED]: 'Блок.',
  [ERole.DEFAULT]: 'Інше'
}

/** Стандартна назва ролі для тегів: roleLabelMap або name з API. */
export function resolveRoleDisplayLabel (role: { name: string }): string {
  for (const er of ROLES_ORDER) {
    const longLabel = roleLabelMap[er]
    if (longLabel === role.name || er === role.name) return longLabel
  }
  return role.name
}

/** Компактний підпис там, де треба вкоротити (наприклад, фільтри). */
export function resolveRoleShortLabel (role: { name: string }): string {
  for (const er of ROLES_ORDER) {
    const longLabel = roleLabelMap[er]
    if (longLabel === role.name || er === role.name) return roleShortLabelMap[er]
  }
  return role.name
}

export const positionOptions = [
  { label: 'Carry', value: 1, icon: PhSword },
  { label: 'Mid', value: 2, icon: PhLightning },
  { label: 'Offlane', value: 3, icon: PhShield },
  { label: 'Roamer', value: 4, icon: PhHandshake },
  { label: 'Support', value: 5, icon: PhHandHeart }
]

export function getDotaPositionLabel (positionId: number): string {
  return positionOptions.find(p => p.value === positionId)?.label ?? String(positionId)
}

export const teamStatusOptions = [
  { label: 'В команді', value: true },
  { label: 'Не в команді', value: false }
]

export const DEFAULT_PLAYER_FILTERS = {
  ratingFrom: null,
  ratingTo: null,
  positions: [],
  roles: [],
  teamStatus: [],
  verificationStatus: []
}

export const verificationOptions = [
  { label: 'Верифікований', value: ERole.PLAYER },
  { label: 'Не верифікований', value: ERole.GUEST }
]

export const hasTeamClassMap = {
  [EUserIsTeam.HAS_TEAM]: 'border-green-500/40 bg-green-500/15 text-green-300',
  [EUserIsTeam.NO_TEAM]: 'border-gray-500/40 bg-gray-500/10 text-gray-300'
}

export const heroIdMap: Record<number, string> = {
  1: 'antimage',
  2: 'axe',
  3: 'bane',
  4: 'bloodseeker',
  5: 'crystal_maiden',
  6: 'drow_ranger',
  7: 'earthshaker',
  8: 'juggernaut',
  9: 'mirana',
  10: 'morphling',
  11: 'nevermore',
  12: 'phantom_lancer',
  13: 'puck',
  14: 'pudge',
  15: 'razor',
  16: 'sand_king',
  17: 'storm_spirit',
  18: 'sven',
  19: 'tiny',
  20: 'vengefulspirit',
  21: 'windrunner',
  22: 'zuus',
  23: 'kunkka',
  25: 'lina',
  26: 'lion',
  27: 'shadow_shaman',
  28: 'slardar',
  29: 'tidehunter',
  30: 'witch_doctor',
  31: 'lich',
  32: 'riki',
  33: 'enigma',
  34: 'tinker',
  35: 'sniper',
  36: 'necrophos',
  37: 'warlock',
  38: 'beastmaster',
  39: 'queenofpain',
  40: 'venomancer',
  41: 'faceless_void',
  42: 'skeleton_king',
  43: 'death_prophet',
  44: 'phantom_assassin',
  45: 'pugna',
  46: 'templar_assassin',
  47: 'viper',
  48: 'luna',
  49: 'dragon_knight',
  50: 'dazzle',
  51: 'rattletrap',
  52: 'leshrac',
  53: 'furion',
  54: 'life_stealer',
  55: 'dark_seer',
  56: 'clinkz',
  57: 'omniknight',
  58: 'enchantress',
  59: 'huskar',
  60: 'night_stalker',
  61: 'broodmother',
  62: 'bounty_hunter',
  63: 'weaver',
  64: 'jakiro',
  65: 'batrider',
  66: 'chen',
  67: 'spectre',
  68: 'ancient_apparition',
  69: 'doom_bringer',
  70: 'ursa',
  71: 'spirit_breaker',
  72: 'gyrocopter',
  73: 'alchemist',
  74: 'invoker',
  75: 'silencer',
  76: 'obsidian_destroyer',
  77: 'lycan',
  78: 'brewmaster',
  79: 'shadow_demon',
  80: 'lone_druid',
  81: 'chaos_knight',
  82: 'meepo',
  83: 'treant',
  84: 'ogre_magi',
  85: 'undying',
  86: 'rubick',
  87: 'disruptor',
  88: 'nyx_assassin',
  89: 'naga_siren',
  90: 'keeper_of_the_light',
  91: 'wisp',
  92: 'visage',
  93: 'slark',
  94: 'medusa',
  95: 'troll_warlord',
  96: 'centaur',
  97: 'magnus',
  98: 'timbersaw',
  99: 'bristleback',
  100: 'tusk',
  101: 'skywrath_mage',
  102: 'abaddon',
  103: 'elder_titan',
  104: 'legion_commander',
  105: 'techies',
  106: 'ember_spirit',
  107: 'earth_spirit',
  108: 'abyssal_underlord',
  109: 'terrorblade',
  110: 'phoenix',
  111: 'oracle',
  112: 'winter_wyvern',
  113: 'arc_warden',
  114: 'monkey_king',
  119: 'dark_willow',
  120: 'pangolier',
  121: 'grimstroke',
  123: 'hoodwink',
  126: 'void_spirit',
  128: 'snapfire',
  129: 'mars',
  135: 'dawnbreaker'
}
