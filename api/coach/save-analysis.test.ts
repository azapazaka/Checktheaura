import type { VercelRequest, VercelResponse } from '@vercel/node'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import handler from './save-analysis'

const createServiceSupabaseClientMock = vi.fn()
const requireAuthenticatedUserMock = vi.fn()

vi.mock('../_lib/supabase.js', () => ({
  createServiceSupabaseClient: (...args: unknown[]) =>
    createServiceSupabaseClientMock(...args),
  requireAuthenticatedUser: (...args: unknown[]) =>
    requireAuthenticatedUserMock(...args),
}))

function createResponseDouble() {
  const res = {} as VercelResponse
  res.setHeader = vi.fn()
  res.status = vi.fn(() => res)
  res.json = vi.fn(() => res)
  return res
}

describe('/api/coach/save-analysis', () => {
  beforeEach(() => {
    createServiceSupabaseClientMock.mockReset()
    requireAuthenticatedUserMock.mockReset()
    requireAuthenticatedUserMock.mockResolvedValue({ id: 'user-1' })
  })

  test('accepts structured replay mistakes and returns a normalized record', async () => {
    const insert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'analysis-1',
            match_id: '11111111-1111-4111-8111-111111111111',
            user_id: 'user-1',
            score: 9,
            source: 'live',
            status: 'ready',
            created_at: '2026-05-20T00:00:00.000Z',
            updated_at: '2026-05-20T00:00:00.000Z',
          },
          error: null,
        }),
      }),
    })
    const from = vi.fn().mockReturnValue({ insert })
    createServiceSupabaseClientMock.mockReturnValue({ from })

    const req = {
      method: 'POST',
      body: {
        matchId: '11111111-1111-4111-8111-111111111111',
        analysis: {
          score: 8.7,
          highlights: ['Сильный темп'],
          mistakes: [
            {
              turnNumber: 5,
              madeMove: {
                from: { row: 5, col: 0 },
                to: { row: 4, col: 1 },
              },
              betterMove: {
                from: { row: 5, col: 2 },
                to: { row: 4, col: 1 },
              },
              explanation: 'Нужно было держать длинную диагональ.',
            },
          ],
          tip: 'Проверяй ответную рубку.',
        },
        source: 'live',
        status: 'ready',
      },
    } as VercelRequest
    const res = createResponseDouble()

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        score: 9,
        analysis_data: expect.objectContaining({
          mistakes: [
            expect.objectContaining({
              turnNumber: 5,
              explanation: 'Нужно было держать длинную диагональ.',
            }),
          ],
        }),
      }),
    )
    expect(res.json).toHaveBeenCalledWith({
      analysis: expect.objectContaining({
        highlights: ['Сильный темп'],
        mistakes: [
          expect.objectContaining({
            turnNumber: 5,
          }),
        ],
        tip: 'Проверяй ответную рубку.',
      }),
    })
  })
})
