import type { GameState, Piece, PieceColor, PieceKind } from '../game/types'
import type { DailyChallengeDefinition } from './types'

function createPiece(id: string, color: PieceColor, kind: PieceKind = 'man'): Piece {
  return { id, color, kind }
}

function createStateFromRows(rows: string[], currentTurn: PieceColor): GameState {
  const board = rows.map((row, rowIndex) =>
    row.split('').map((cell, colIndex) => {
      switch (cell) {
        case 'w':
          return createPiece(`w-${rowIndex}-${colIndex}`, 'white', 'man')
        case 'W':
          return createPiece(`W-${rowIndex}-${colIndex}`, 'white', 'king')
        case 'b':
          return createPiece(`b-${rowIndex}-${colIndex}`, 'black', 'man')
        case 'B':
          return createPiece(`B-${rowIndex}-${colIndex}`, 'black', 'king')
        default:
          return null
      }
    }),
  )

  return {
    board,
    currentTurn,
    moveCountWithoutCapture: 0,
    winner: null,
    pendingPromotion: null,
    selectedPiece: null,
    forcedSequence: null,
    turn: 1,
    moves: [],
  }
}

export const DAILY_CHALLENGES: DailyChallengeDefinition[] = [
  {
    id: 'sun-gate',
    title: 'Врата солнца',
    subtitle: 'Тихий перевес, но только один точный маршрут.',
    goal: 'Выиграй из этой позиции и не отдай темп.',
    rewardXp: 160,
    difficulty: 'medium',
    accent: 'linear-gradient(135deg, rgba(255, 185, 60, 0.28), rgba(255, 120, 36, 0.08))',
    initialGameState: createStateFromRows(
      [
        '.b......',
        '......b.',
        '...w....',
        '........',
        '.w......',
        '......w.',
        '...w....',
        '........',
      ],
      'white',
    ),
  },
  {
    id: 'emerald-fork',
    title: 'Изумрудная вилка',
    subtitle: 'Короткий эндшпиль, где король решает всё.',
    goal: 'Используй дамку и доведи позицию до победы.',
    rewardXp: 210,
    difficulty: 'hard',
    accent: 'linear-gradient(135deg, rgba(52, 211, 153, 0.22), rgba(15, 118, 110, 0.08))',
    initialGameState: createStateFromRows(
      [
        '........',
        '....b...',
        '.B......',
        '........',
        '...w....',
        '........',
        '.W......',
        '........',
      ],
      'white',
    ),
  },
  {
    id: 'royal-lantern',
    title: 'Королевский фонарь',
    subtitle: 'Редкая позиция на чтение диагоналей и терпение.',
    goal: 'Выиграй после первого ключевого взятия.',
    rewardXp: 185,
    difficulty: 'medium',
    accent: 'linear-gradient(135deg, rgba(167, 139, 250, 0.24), rgba(91, 33, 182, 0.08))',
    initialGameState: createStateFromRows(
      [
        '.....b..',
        '..b.....',
        '........',
        '...w....',
        '......w.',
        '.w......',
        '........',
        '.......W',
      ],
      'white',
    ),
  },
]

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function hashDateKey(dateKey: string) {
  return Array.from(dateKey).reduce(
    (total, char, index) => total + char.charCodeAt(0) * (index + 17),
    0,
  )
}

export function getDailyChallengeForDate(dateKey = getLocalDateKey()) {
  const index = hashDateKey(dateKey) % DAILY_CHALLENGES.length
  return DAILY_CHALLENGES[index]
}

export function getTodayDailyChallenge() {
  return getDailyChallengeForDate()
}

export function getDailyChallengeById(id: string | null) {
  if (!id) {
    return null
  }

  return DAILY_CHALLENGES.find((challenge) => challenge.id === id) ?? null
}
