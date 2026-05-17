import type { BoardCoord, Difficulty, GameOutcome, MatchMove, PieceColor } from '../game/types'
import type { MatchXpReward } from '../rpg/types'

export type CoachAnalyzeRequest = {
  moves: MatchMove[]
  result: GameOutcome
  playerColor: PieceColor
  difficulty: Difficulty
  xpSummary: MatchXpReward
}

export type ReplayMistake = {
  turnNumber: number
  madeMove: { from: BoardCoord; to: BoardCoord }
  betterMove: { from: BoardCoord; to: BoardCoord }
  explanation: string
}

export type CoachAnalyzeResponse = {
  highlights: string[]
  mistakes: ReplayMistake[]
  tip: string
  score: number
}
