import { applyMove, getGameOutcome, getLegalMoves } from './engine'
import type { Difficulty, GameState, Move, PieceColor } from './types'

function evaluateState(state: GameState, perspective: PieceColor) {
  const outcome = getGameOutcome(state)
  if (outcome) {
    if (outcome.winner === perspective) {
      return 10_000
    }

    if (outcome.winner && outcome.winner !== perspective) {
      return -10_000
    }

    return 0
  }

  let score = 0
  for (const piece of state.board.flat()) {
    if (!piece) {
      continue
    }

    const value = piece.kind === 'king' ? 5 : 3
    score += piece.color === perspective ? value : -value
  }

  const mobility =
    getLegalMoves(state, perspective).length -
    getLegalMoves(
      { ...state, currentTurn: perspective === 'white' ? 'black' : 'white' },
      perspective === 'white' ? 'black' : 'white',
    ).length

  return score * 10 + mobility
}

function getSearchDepth(difficulty: Difficulty) {
  if (difficulty === 'hard') {
    return 4
  }

  if (difficulty === 'medium') {
    return 2
  }

  return 1
}

function minimax(
  state: GameState,
  depth: number,
  maximizingColor: PieceColor,
  alpha: number,
  beta: number,
): number {
  const outcome = getGameOutcome(state)
  if (depth === 0 || outcome) {
    return evaluateState(state, maximizingColor)
  }

  const currentColor = state.currentTurn
  const moves = getLegalMoves(state, currentColor)
  if (moves.length === 0) {
    return evaluateState(state, maximizingColor)
  }

  if (currentColor === maximizingColor) {
    let best = Number.NEGATIVE_INFINITY
    for (const move of moves) {
      best = Math.max(
        best,
        minimax(applyMove(state, move), depth - 1, maximizingColor, alpha, beta),
      )
      alpha = Math.max(alpha, best)
      if (beta <= alpha) {
        break
      }
    }

    return best
  }

  let best = Number.POSITIVE_INFINITY
  for (const move of moves) {
    best = Math.min(
      best,
      minimax(applyMove(state, move), depth - 1, maximizingColor, alpha, beta),
    )
    beta = Math.min(beta, best)
    if (beta <= alpha) {
      break
    }
  }

  return best
}

export function chooseAiMove(
  state: GameState,
  difficulty: Difficulty,
  color: PieceColor = state.currentTurn,
): Move | null {
  const moves = getLegalMoves(state, color)
  if (moves.length === 0) {
    return null
  }

  if (difficulty === 'easy') {
    return moves[0]
  }

  const depth = getSearchDepth(difficulty)
  let bestMove = moves[0]
  let bestScore = Number.NEGATIVE_INFINITY

  for (const move of moves) {
    const nextState = applyMove(state, move)
    const score = minimax(
      nextState,
      depth - 1,
      color,
      Number.NEGATIVE_INFINITY,
      Number.POSITIVE_INFINITY,
    )

    if (score > bestScore) {
      bestScore = score
      bestMove = move
    }
  }

  return bestMove
}
