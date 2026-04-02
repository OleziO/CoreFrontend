export enum ETeamStatuses {
  APPLIED = 'applied',
  APPROVED = 'approved',
}

export enum ERole {
  ADMIN = 'admin',
  DEV = 'dev',
  MODERATOR = 'moderator',
  MEDIA = 'media',
  CAP = 'cap',
  PLAYER = 'player',
  GUEST = 'unverified',
  BLOCKED = 'blocked',

  // FE only
  DEFAULT = 'default'
}
