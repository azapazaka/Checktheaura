import type { Difficulty } from '../game/types.js'

export type RpgClass = 'warrior' | 'strategist' | 'shadow'

export type ThemeId = 'default' | 'dark'

export type Unlocks = {
  themes: ThemeId[]
  difficulties: Difficulty[]
}

export type NewUnlocks = {
  themes: ThemeId[]
  difficulties: Difficulty[]
}

export type CharacterStats = {
  str: number
  int: number
  agi: number
  lck: number
}

export type DailyQuestCompletion = {
  playMatch: boolean
  winMedium: boolean
  crownKing: boolean
}

export type DailyQuestRewards = {
  playMatch: number
  winMedium: number
  crownKing: number
}

export type DailyQuestState = {
  date: string
  completed: DailyQuestCompletion
}

export type XpBreakdown = {
  victory: number
  defeat: number
  captures: number
  king: number
  perfectGame: number
  hardDifficulty: number
  quickWin: number
  strategistBonus: number
  shadowHintValue: number
  playMatchQuest: number
  winMediumQuest: number
  crownKingQuest: number
}

export type MatchXpReward = {
  total: number
  breakdown: XpBreakdown
}

export type MatchSummary = {
  id: string
  matchId?: string
  coachAnalysisId?: string
  analysisStatus?: 'pending' | 'ready' | 'failed'
  outcome: 'win' | 'loss' | 'draw'
  xpEarned: number
  playedAt: string
  difficulty: Difficulty
  usedShadowHint: boolean
  newUnlocks: NewUnlocks
  dailyQuestRewards: DailyQuestRewards
}

export type PlayerProfile = {
  id?: string
  city?: string | null
  authUserId?: string
  isGuest?: boolean
  rankScore?: number
  classId: RpgClass
  level: number
  xp: number
  title: string
  stats: CharacterStats
  unspentStatPoints: number
  unlocks: Unlocks
  gamesPlayed: number
  wins: number
  history: MatchSummary[]
  dailyQuests: DailyQuestState
}

export type StoredSettings = {
  preferredTheme: ThemeId
  preferredDifficulty: Difficulty
}
