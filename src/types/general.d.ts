type TIndexedObject<T = any> = {
  [key: string]: T
}

type TCallbackFn<T extends unknown[] = [], R = void> = (...args: T) => R

// TODO: Set proper type for axios error
type TAppAxiosError = import('axios').AxiosError

// Mail types
type TMail = {
  id: number
  type: string
  message: string
  target_group: string
  created_on: string
  team_id?: number
  invite_id?: number
}

type TMailBoxItem = {
  player_id: number
  mail_id: number
  is_readed: boolean
  mail: TMail
}

type TNewMailWebSocketData = {
  type: 'new_mail'
  mail: {
    id: number
    type: string
    message: string
    target_group: string
    created_on: string | null
    is_readed: boolean
    team_id?: number
    invite_id?: number
  }
}

// Team invite types
type TTeamInvite = {
  id: number
  player_id: number
  team_id: number
  is_team_main: boolean
  created_on: string
  status?: 'pending' | 'confirmed' | 'rejected'
}

type TTeamInviteWithTeam = {
  team: {
    id: number
    team_name: string
    avatar_url: string | null
    status: string
    dota_team_id: number | null
    wins: number
    players: any[]
  }
  invites: TTeamInvite[]
}

// Single team invite with team (для эндпоинта /invites/{invite_id})
type TTeamInviteWithTeamSingle = {
  team: {
    id: number
    team_name: string
    avatar_url: string | null
    status: string
    dota_team_id: number | null
    wins: number
    players: any[]
  }
  invite: TTeamInvite
}
