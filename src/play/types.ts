import type { Difficulty, GameState } from '../game/types'

export type PlayMode = 'training' | 'friend' | 'daily'

export type DailyChallengeDefinition = {
  id: string
  title: string
  subtitle: string
  goal: string
  rewardXp: number
  difficulty: Difficulty
  accent: string
  initialGameState: GameState
}
