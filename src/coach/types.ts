import type { Difficulty, GameOutcome, MatchMove, PieceColor } from '../game/types'
import type { MatchXpReward } from '../rpg/types'

export type CoachAnalyzeRequest = {
  moves: MatchMove[]
  result: GameOutcome
  playerColor: PieceColor
  difficulty: Difficulty
  xpSummary: MatchXpReward
}

export type CoachAnalyzeResponse = {
  highlights: string[]
  mistakes: string[]
  tip: string
  score: number
}
