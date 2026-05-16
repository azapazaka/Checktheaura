import { chooseAiMove } from './ai'
import { applyMove } from './engine'
import type { GameState, Piece } from './types'

function createEmptyBoard() {
  return Array.from({ length: 8 }, () =>
    Array.from({ length: 8 }, () => null as Piece | null),
  )
}

function createState(overrides: Partial<GameState> = {}): GameState {
  return {
    board: createEmptyBoard(),
    currentTurn: 'black',
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

describe('local AI', () => {
  test('returns a legal move for the current black turn', () => {
    const board = createEmptyBoard()
    board[2][1] = { id: 'b1', color: 'black', kind: 'man' }
    board[5][0] = { id: 'w1', color: 'white', kind: 'man' }

    const state = createState({ board })
    const move = chooseAiMove(state, 'easy')

    expect(move).toBeTruthy()

    const nextState = applyMove(state, move!)
    expect(nextState.board[3][0] ?? nextState.board[3][2]).not.toBeNull()
  })

  test('prioritizes a winning capture when one is immediately available', () => {
    const board = createEmptyBoard()
    board[2][1] = { id: 'b1', color: 'black', kind: 'man' }
    board[3][2] = { id: 'w1', color: 'white', kind: 'man' }

    const state = createState({ board })
    const move = chooseAiMove(state, 'hard')

    expect(move).toEqual(
      expect.objectContaining({
        from: { row: 2, col: 1 },
        to: { row: 4, col: 3 },
        captured: [{ row: 3, col: 2 }],
      }),
    )
  })
})
