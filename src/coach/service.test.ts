import { describe, expect, test, vi } from 'vitest'
import { analyzeCoachPayload, coachAnalyzeRequestSchema } from './service'

const validPayload = {
  moves: [
    {
      from: { row: 5, col: 0 },
      to: { row: 4, col: 1 },
      captured: [],
      turn: 1,
      player: 'white',
      pieceId: 'w1',
      promoted: false,
    },
  ],
  result: {
    winner: 'white',
    reason: 'captured-all',
  },
  playerColor: 'white',
  difficulty: 'medium',
  xpSummary: {
    total: 180,
    breakdown: {
      victory: 150,
      defeat: 0,
      captures: 20,
      king: 0,
      perfectGame: 0,
      hardDifficulty: 0,
      quickWin: 0,
      strategistBonus: 0,
      shadowHintValue: 0,
      playMatchQuest: 0,
      winMediumQuest: 0,
      crownKingQuest: 0,
    },
  },
} as const

describe('coach service', () => {
  test('validates a well-formed request payload', () => {
    expect(() => coachAnalyzeRequestSchema.parse(validPayload)).not.toThrow()
  })

  test('rejects malformed input', () => {
    expect(() =>
      coachAnalyzeRequestSchema.parse({ ...validPayload, moves: 'oops' }),
    ).toThrow()
  })

  test('falls back gracefully when the Anthropic request fails', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('network'))
    const response = await analyzeCoachPayload(validPayload, {
      fetchImpl,
      apiKey: 'test-key',
    })

    expect(response.highlights.length).toBeGreaterThan(0)
    expect(response.tip).toMatch(/взятие|клетк|диагонал|темп/i)
  })

  test('returns fallback analysis when match log is empty', async () => {
    const response = await analyzeCoachPayload(
      { ...validPayload, moves: [] },
      {
        apiKey: 'test-key',
      },
    )

    expect(response.mistakes.length).toBeGreaterThan(0)
  })
})
