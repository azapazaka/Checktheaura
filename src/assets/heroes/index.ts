import strategistBaseThin from './strategist-base-thin.png'
import strategistBaseThinAvatar from './strategist-base-thin-avatar.png'
import strategistBaseThinMini from './strategist-base-thin-mini.png'
import strategistFull from './strategist-full.png'
import strategistFullAvatar from './strategist-full-avatar.png'
import strategistFullMini from './strategist-full-mini.png'
import warriorBaseThin from './warrior-base-thin.png'
import warriorBaseThinAvatar from './warrior-base-thin-avatar.png'
import warriorBaseThinMini from './warrior-base-thin-mini.png'
import warriorFull from './warrior-full.png'
import warriorFullAvatar from './warrior-full-avatar.png'
import warriorFullMini from './warrior-full-mini.png'

export const heroAssets = {
  warrior: {
    full: warriorFull,
    fullAvatar: warriorFullAvatar,
    fullMini: warriorFullMini,
    baseThin: warriorBaseThin,
    baseThinAvatar: warriorBaseThinAvatar,
    baseThinMini: warriorBaseThinMini,
  },
  strategist: {
    full: strategistFull,
    fullAvatar: strategistFullAvatar,
    fullMini: strategistFullMini,
    baseThin: strategistBaseThin,
    baseThinAvatar: strategistBaseThinAvatar,
    baseThinMini: strategistBaseThinMini,
  },
} as const

export type VisibleHeroClass = keyof typeof heroAssets
