import { describe, expect, test } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import handler from './analyze'

function createResponseMock() {
  const response = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: undefined as unknown,
    setHeader(name: string, value: string) {
      this.headers[name] = value
    },
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(payload: unknown) {
      this.body = payload
      return this
    },
  }

  return response as unknown as VercelResponse & {
    statusCode: number
    headers: Record<string, string>
    body: unknown
  }
}

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

describe('api/coach/analyze', () => {
  test('accepts a JSON string body like a serverless runtime', async () => {
    const req = {
      method: 'POST',
      body: JSON.stringify(validPayload),
    } as VercelRequest
    const res = createResponseMock()

    await handler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({
      highlights: expect.any(Array),
      mistakes: expect.any(Array),
      tip: expect.any(String),
      score: expect.any(Number),
    })
  })

  test('returns 400 for malformed JSON string payloads', async () => {
    const req = {
      method: 'POST',
      body: '{"moves":"oops"}',
    } as VercelRequest
    const res = createResponseMock()

    await handler(req, res)

    expect(res.statusCode).toBe(400)
    expect(res.body).toMatchObject({
      error: 'Invalid coach payload',
    })
  })
})
