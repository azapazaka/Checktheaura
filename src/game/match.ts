import type { GameOutcome, GameState, PieceColor } from './types'
import { calculateMatchXp } from '../rpg/progression'
import type { RpgClass } from '../rpg/types'
import type { LatestResult } from '../store/progress-store'

export function summarizeFinishedMatch({
  state,
  outcome,
  difficulty,
  playerClass,
  playerColor,
  usedShadowHint,
}: {
  state: GameState
  outcome: GameOutcome
  difficulty: 'easy' | 'medium' | 'hard'
  playerClass: RpgClass
  playerColor: PieceColor
  usedShadowHint: boolean
}): LatestResult {
  const playerMoves = state.moves.filter((move) => move.player === playerColor)
  const opponentMoves = state.moves.filter((move) => move.player !== playerColor)
  const playerCaptures = playerMoves.reduce(
    (total, move) => total + move.captured.length,
    0,
  )
  const playerLosses = opponentMoves.reduce(
    (total, move) => total + move.captured.length,
    0,
  )
  const crownedKing = playerMoves.some((move) => move.promoted)

  const outcomeLabel =
    outcome.winner === playerColor
      ? 'win'
      : outcome.winner === null
        ? 'draw'
        : 'loss'

  const xpSummary = calculateMatchXp({
    outcome: outcomeLabel,
    captures: playerCaptures,
    crownedKing,
    perfectGame: outcome.winner === playerColor && playerLosses === 0,
    difficulty,
    movesPlayed: state.moves.length,
    playerClass,
  })

  return {
    id: `match-${Date.now()}`,
    outcome: outcomeLabel,
    xpEarned: xpSummary.total,
    playedAt: new Date().toISOString(),
    difficulty,
    moves: state.moves,
    usedShadowHint,
    newUnlocks: {
      themes: [],
      difficulties: [],
    },
    dailyQuestRewards: {
      playMatch: 0,
      winMedium: 0,
      crownKing: 0,
    },
    xpSummary,
    result: outcome,
  }
}
