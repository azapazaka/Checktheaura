import type { CoachAnalyzeRequest, CoachAnalyzeResponse, ReplayMistake } from './types'

export function buildFallbackCoachAnalysis(
  payload: CoachAnalyzeRequest,
): CoachAnalyzeResponse {
  const playerMoves = payload.moves.filter(
    (move) => move.player === payload.playerColor,
  )
  const captureCount = playerMoves.reduce(
    (total, move) => total + move.captured.length,
    0,
  )
  const promoted = playerMoves.some((move) => move.promoted)

  const highlights = [
    captureCount > 0
      ? `Ты нашёл ${captureCount} взятий(я) по ходу партии и держал темп.`
      : 'Партия прошла осторожно: акцент был на позиционном манёвре.',
    promoted
      ? 'Удалось довести фигуру до дамки, а значит ты хорошо работал с флангом.'
      : 'До дамки не дошло, значит стоит раньше готовить проходные диагонали.',
  ]

  const mistakes: ReplayMistake[] = []

  const score =
    payload.result.winner === payload.playerColor
      ? 8.4
      : payload.result.winner === null
        ? 6.8
        : 5.9

  return {
    highlights,
    mistakes,
    tip:
      payload.difficulty === 'hard'
        ? 'На Hard полезно перед каждым разменом проверять, не откроешь ли ты длинную диагональ под ответную рубку.'
        : 'Смотри не только на ближайшее взятие, но и на клетку приземления после него: именно там чаще всего рождается контратака.',
    score,
  }
}
