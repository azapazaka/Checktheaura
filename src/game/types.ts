export type PieceColor = 'white' | 'black'

export type PieceKind = 'man' | 'king'

export type Difficulty = 'easy' | 'medium' | 'hard'

export type BoardCoord = {
  row: number
  col: number
}

export type Piece = {
  id: string
  color: PieceColor
  kind: PieceKind
}

export type Move = {
  from: BoardCoord
  to: BoardCoord
  captured: BoardCoord[]
}

export type CaptureSequence = Move[]

export type MatchMove = Move & {
  turn: number
  player: PieceColor
  pieceId: string
  promoted: boolean
}

export type GameOutcome = {
  winner: PieceColor | null
  reason:
    | 'captured-all'
    | 'blocked'
    | 'stalemate'
    | 'fifty-move-rule'
}

export type GameState = {
  board: (Piece | null)[][]
  currentTurn: PieceColor
  moveCountWithoutCapture: number
  winner: PieceColor | null
  pendingPromotion: BoardCoord | null
  selectedPiece: BoardCoord | null
  forcedSequence: BoardCoord | null
  turn: number
  moves: MatchMove[]
}
