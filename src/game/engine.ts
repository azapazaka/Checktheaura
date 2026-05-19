import type {
  BoardCoord,
  GameOutcome,
  GameState,
  MatchMove,
  Move,
  Piece,
  PieceColor,
} from './types.js'

const BOARD_SIZE = 8
const MAN_MOVE_DIRECTIONS: Record<PieceColor, BoardCoord[]> = {
  white: [
    { row: -1, col: -1 },
    { row: -1, col: 1 },
  ],
  black: [
    { row: 1, col: -1 },
    { row: 1, col: 1 },
  ],
}
const DIAGONALS: BoardCoord[] = [
  { row: -1, col: -1 },
  { row: -1, col: 1 },
  { row: 1, col: -1 },
  { row: 1, col: 1 },
]

function isInsideBoard(row: number, col: number) {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE
}

function cloneBoard(board: GameState['board']) {
  return board.map((row) => [...row])
}

function isSameCoord(left: BoardCoord | null, right: BoardCoord | null) {
  return left?.row === right?.row && left?.col === right?.col
}

function getPiece(board: GameState['board'], coord: BoardCoord) {
  return board[coord.row]?.[coord.col] ?? null
}

function createPiece(color: PieceColor, row: number, col: number): Piece {
  return {
    id: `${color}-${row}-${col}`,
    color,
    kind: 'man',
  }
}

function getManMoves(
  board: GameState['board'],
  origin: BoardCoord,
  color: PieceColor,
) {
  const quiet: Move[] = []
  const captures: Move[] = []

  for (const direction of MAN_MOVE_DIRECTIONS[color]) {
    const row = origin.row + direction.row
    const col = origin.col + direction.col

    if (isInsideBoard(row, col) && !board[row][col]) {
      quiet.push({
        from: origin,
        to: { row, col },
        captured: [],
      })
    }
  }

  for (const direction of DIAGONALS) {
    const jumped = {
      row: origin.row + direction.row,
      col: origin.col + direction.col,
    }
    const landing = {
      row: origin.row + direction.row * 2,
      col: origin.col + direction.col * 2,
    }

    if (!isInsideBoard(landing.row, landing.col)) {
      continue
    }

    const targetPiece = getPiece(board, jumped)
    if (
      targetPiece &&
      targetPiece.color !== color &&
      !getPiece(board, landing)
    ) {
      captures.push({
        from: origin,
        to: landing,
        captured: [jumped],
      })
    }
  }

  return { quiet, captures }
}

function getKingMoves(
  board: GameState['board'],
  origin: BoardCoord,
  color: PieceColor,
) {
  const quiet: Move[] = []
  const captures: Move[] = []

  for (const direction of DIAGONALS) {
    let row = origin.row + direction.row
    let col = origin.col + direction.col
    let enemyCoord: BoardCoord | null = null

    while (isInsideBoard(row, col)) {
      const occupant = board[row][col]

      if (!occupant) {
        if (enemyCoord) {
          captures.push({
            from: origin,
            to: { row, col },
            captured: [enemyCoord],
          })
        } else {
          quiet.push({
            from: origin,
            to: { row, col },
            captured: [],
          })
        }

        row += direction.row
        col += direction.col
        continue
      }

      if (occupant.color === color) {
        break
      }

      if (enemyCoord) {
        break
      }

      enemyCoord = { row, col }
      row += direction.row
      col += direction.col
    }
  }

  return { quiet, captures }
}

function getMovesForPiece(
  board: GameState['board'],
  coord: BoardCoord,
  piece: Piece,
) {
  return piece.kind === 'king'
    ? getKingMoves(board, coord, piece.color)
    : getManMoves(board, coord, piece.color)
}

function shouldPromote(piece: Piece, destination: BoardCoord) {
  if (piece.kind === 'king') {
    return false
  }

  return (
    (piece.color === 'white' && destination.row === 0) ||
    (piece.color === 'black' && destination.row === BOARD_SIZE - 1)
  )
}

function getNextTurn(color: PieceColor): PieceColor {
  return color === 'white' ? 'black' : 'white'
}

export function createInitialGameState(): GameState {
  const board = Array.from({ length: BOARD_SIZE }, (_, row) =>
    Array.from({ length: BOARD_SIZE }, (_, col) => {
      if ((row + col) % 2 === 0) {
        return null
      }

      if (row < 3) {
        return createPiece('black', row, col)
      }

      if (row > 4) {
        return createPiece('white', row, col)
      }

      return null
    }),
  )

  return {
    board,
    currentTurn: 'white',
    moveCountWithoutCapture: 0,
    winner: null,
    pendingPromotion: null,
    selectedPiece: null,
    forcedSequence: null,
    turn: 1,
    moves: [],
  }
}

export function cloneGameState(state: GameState): GameState {
  return {
    ...state,
    board: state.board.map((row) =>
      row.map((piece) => (piece ? { ...piece } : null)),
    ),
    pendingPromotion: state.pendingPromotion
      ? { ...state.pendingPromotion }
      : null,
    selectedPiece: state.selectedPiece ? { ...state.selectedPiece } : null,
    forcedSequence: state.forcedSequence ? { ...state.forcedSequence } : null,
    moves: state.moves.map((move) => ({
      ...move,
      from: { ...move.from },
      to: { ...move.to },
      captured: move.captured.map((coord) => ({ ...coord })),
    })),
  }
}

export function getLegalMoves(
  state: GameState,
  color: PieceColor = state.currentTurn,
) {
  const quietMoves: Move[] = []
  const captureMoves: Move[] = []

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const coord = { row, col }
      const piece = state.board[row][col]
      if (!piece || piece.color !== color) {
        continue
      }

      if (state.forcedSequence && !isSameCoord(state.forcedSequence, coord)) {
        continue
      }

      const moves = getMovesForPiece(state.board, coord, piece)
      captureMoves.push(...moves.captures)

      if (!state.forcedSequence) {
        quietMoves.push(...moves.quiet)
      }
    }
  }

  return captureMoves.length > 0 ? captureMoves : quietMoves
}

export function applyMove(state: GameState, move: Move): GameState {
  const piece = getPiece(state.board, move.from)
  if (!piece) {
    throw new Error('Cannot move a piece from an empty square')
  }

  const board = cloneBoard(state.board)
  board[move.from.row][move.from.col] = null

  for (const captured of move.captured) {
    board[captured.row][captured.col] = null
  }

  const promoted = shouldPromote(piece, move.to)
  const nextPiece: Piece = promoted ? { ...piece, kind: 'king' } : piece
  board[move.to.row][move.to.col] = nextPiece

  const baseState: GameState = {
    ...state,
    board,
    selectedPiece: null,
    pendingPromotion: promoted ? move.to : null,
    moveCountWithoutCapture:
      move.captured.length > 0 ? 0 : state.moveCountWithoutCapture + 1,
  }

  const continuationState: GameState = {
    ...baseState,
    forcedSequence: move.to,
  }

  const canContinueCapture =
    move.captured.length > 0 &&
    getLegalMoves(continuationState, piece.color).some(
      (candidate) => candidate.captured.length > 0,
    )

  const nextTurn = canContinueCapture ? piece.color : getNextTurn(piece.color)
  const nextMove: MatchMove = {
    ...move,
    turn: state.turn,
    player: piece.color,
    pieceId: piece.id,
    promoted,
  }

  return {
    ...baseState,
    currentTurn: nextTurn,
    forcedSequence: canContinueCapture ? move.to : null,
    turn: canContinueCapture ? state.turn : state.turn + 1,
    moves: [...state.moves, nextMove],
  }
}

export function getGameOutcome(state: GameState): GameOutcome | null {
  if (state.moveCountWithoutCapture >= 50) {
    return {
      winner: null,
      reason: 'fifty-move-rule',
    }
  }

  const whitePieces = state.board.flat().filter((piece) => piece?.color === 'white')
  const blackPieces = state.board.flat().filter((piece) => piece?.color === 'black')

  if (whitePieces.length === 0) {
    return { winner: 'black', reason: 'captured-all' }
  }

  if (blackPieces.length === 0) {
    return { winner: 'white', reason: 'captured-all' }
  }

  const currentMoves = getLegalMoves(state, state.currentTurn)
  if (currentMoves.length === 0) {
    const opponent = getNextTurn(state.currentTurn)
    const opponentMoves = getLegalMoves({ ...state, currentTurn: opponent }, opponent)

    if (opponentMoves.length === 0) {
      return { winner: null, reason: 'stalemate' }
    }

    return { winner: opponent, reason: 'blocked' }
  }

  return null
}
