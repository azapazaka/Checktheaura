import {
  applyMove,
  createInitialGameState,
  getGameOutcome,
  getLegalMoves,
} from './engine'
import type { GameState, Piece } from './types'

function createEmptyBoard() {
  return Array.from({ length: 8 }, () =>
    Array.from({ length: 8 }, () => null as Piece | null),
  )
}

function createState(overrides: Partial<GameState> = {}): GameState {
  return {
    board: createEmptyBoard(),
    currentTurn: 'white',
    moveCountWithoutCapture: 0,
    winner: null,
    pendingPromotion: null,
    selectedPiece: null,
    forcedSequence: null,
    turn: 1,
    moves: [],
    ...overrides,
  }
}

describe('checkers engine', () => {
  test('creates the standard starting layout with white to move', () => {
    const state = createInitialGameState()
    const allPieces = state.board.flat().filter(Boolean)

    expect(allPieces).toHaveLength(24)
    expect(state.currentTurn).toBe('white')
    expect(state.board[5][0]?.color).toBe('white')
    expect(state.board[2][1]?.color).toBe('black')
  })

  test('returns only capture moves when a capture is available', () => {
    const board = createEmptyBoard()
    board[5][0] = { id: 'w1', color: 'white', kind: 'man' }
    board[4][1] = { id: 'b1', color: 'black', kind: 'man' }
    board[6][3] = { id: 'w2', color: 'white', kind: 'man' }

    const state = createState({ board })
    const moves = getLegalMoves(state, 'white')

    expect(moves).toHaveLength(1)
    expect(moves[0].from).toEqual({ row: 5, col: 0 })
    expect(moves[0].captured).toEqual([{ row: 4, col: 1 }])
  })

  test('keeps the same piece active during a mandatory multi-capture chain', () => {
    const board = createEmptyBoard()
    board[5][0] = { id: 'w1', color: 'white', kind: 'man' }
    board[4][1] = { id: 'b1', color: 'black', kind: 'man' }
    board[2][3] = { id: 'b2', color: 'black', kind: 'man' }

    const state = createState({ board })
    const firstJump = getLegalMoves(state, 'white')[0]
    const nextState = applyMove(state, firstJump)

    expect(nextState.currentTurn).toBe('white')
    expect(nextState.forcedSequence).toEqual({ row: 3, col: 2 })

    const followUp = getLegalMoves(nextState, 'white')
    expect(followUp).toHaveLength(1)
    expect(followUp[0].from).toEqual({ row: 3, col: 2 })
    expect(followUp[0].to).toEqual({ row: 1, col: 4 })
  })

  test('promotes a man to king when it reaches the last row', () => {
    const board = createEmptyBoard()
    board[1][2] = { id: 'w1', color: 'white', kind: 'man' }

    const state = createState({ board })
    const move = getLegalMoves(state, 'white').find(
      (candidate) => candidate.to.row === 0 && candidate.to.col === 1,
    )

    expect(move).toBeDefined()

    const nextState = applyMove(state, move!)

    expect(nextState.board[0][1]?.kind).toBe('king')
  })

  test('allows kings to move multiple squares diagonally', () => {
    const board = createEmptyBoard()
    board[3][3] = { id: 'wk', color: 'white', kind: 'king' }

    const state = createState({ board })
    const moves = getLegalMoves(state, 'white')

    expect(moves).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ to: { row: 0, col: 0 } }),
        expect.objectContaining({ to: { row: 6, col: 6 } }),
      ]),
    )
  })

  test('declares victory when the opponent has no legal moves', () => {
    const board = createEmptyBoard()
    board[0][1] = { id: 'b1', color: 'black', kind: 'man' }
    board[1][0] = { id: 'w1', color: 'white', kind: 'man' }
    board[1][2] = { id: 'w2', color: 'white', kind: 'man' }
    board[2][3] = { id: 'w3', color: 'white', kind: 'man' }

    const state = createState({ board, currentTurn: 'black' })

    expect(getGameOutcome(state)).toEqual({
      winner: 'white',
      reason: 'blocked',
    })
  })

  test('declares a draw after fifty quiet moves', () => {
    const state = createState({ moveCountWithoutCapture: 50 })

    expect(getGameOutcome(state)).toEqual({
      winner: null,
      reason: 'fifty-move-rule',
    })
  })
})
