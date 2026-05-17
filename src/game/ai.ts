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
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = state.board[row][col]
      if (!piece) {
        continue
      }

      // Kings are worth 50 points, normal pieces are worth 30 points
      const baseValue = piece.kind === 'king' ? 50 : 30
      
      // Slight positional bonus: favor pieces closer to promotion and center control
      let positionalBonus = 0
      if (piece.kind !== 'king') {
        const advanceRow = piece.color === 'white' ? (7 - row) : row
        positionalBonus += advanceRow * 2 // encourages moving forward
      }
      
      // Encourage controlling center columns (columns 2, 3, 4, 5)
      if (col >= 2 && col <= 5) {
        positionalBonus += 1
      }

      const value = baseValue + positionalBonus
      score += piece.color === perspective ? value : -value
    }
  }

  return score
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

function sortMoves(moves: Move[]) {
  return [...moves].sort((a, b) => {
    // 1. Prioritize captures (more captures first)
    if (b.captured.length !== a.captured.length) {
      return b.captured.length - a.captured.length
    }
    
    // 2. Prioritize moves that lead to promotion (white to row 0, black to row 7)
    const aPromotes = a.to.row === 0 || a.to.row === 7
    const bPromotes = b.to.row === 0 || b.to.row === 7
    if (aPromotes !== bPromotes) {
      return bPromotes ? 1 : -1
    }
    
    return 0
  })
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

  const sortedMoves = sortMoves(moves)

  if (currentColor === maximizingColor) {
    let best = Number.NEGATIVE_INFINITY
    for (const move of sortedMoves) {
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
  for (const move of sortedMoves) {
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
    return moves[Math.floor(Math.random() * moves.length)]
  }

  const depth = getSearchDepth(difficulty)
  const sortedMoves = sortMoves(moves)
  let bestMove = sortedMoves[0]
  let bestScore = Number.NEGATIVE_INFINITY

  for (const move of sortedMoves) {
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
