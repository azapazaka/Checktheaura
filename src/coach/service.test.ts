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

  test('falls back gracefully when the provider request fails', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('network'))
    const response = await analyzeCoachPayload(validPayload, {
      fetchImpl,
      apiKey: 'test-key',
      provider: 'groq',
    })

    expect(response.highlights.length).toBeGreaterThan(0)
    expect(response.tip).toMatch(/взятие|клетку|диагональ|темп/i)
  })

  test('parses a Groq chat completion response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                highlights: ['Strong opening control', 'You held tempo after the exchange'],
                mistakes: [
                  {
                    turnNumber: 5,
                    madeMove: { from: { row: 5, col: 0 }, to: { row: 4, col: 1 } },
                    betterMove: { from: { row: 5, col: 2 }, to: { row: 4, col: 1 } },
                    explanation: 'Watch the long diagonal after each capture',
                  }
                ],
                tip: 'Before every exchange, check the landing square and the reply path.',
                score: 8,
              }),
            },
          },
        ],
      }),
    })

    const response = await analyzeCoachPayload(validPayload, {
      fetchImpl,
      apiKey: 'test-key',
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
    })

    expect(response.score).toBe(8)
    expect(response.highlights[0]).toMatch(/Strong opening control/)
  })

  test('returns fallback analysis when match log is empty', async () => {
    const response = await analyzeCoachPayload(
      { ...validPayload, moves: [] },
      {
        apiKey: 'test-key',
      },
    )

    expect(response.mistakes.length).toBe(0)
  })
})
