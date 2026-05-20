import type { VercelRequest, VercelResponse } from '@vercel/node'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import handler from './save-analysis'

const createServiceSupabaseClientMock = vi.fn()
const ensureCloudProfileExistsMock = vi.fn()
const requireAuthenticatedUserMock = vi.fn()

vi.mock('../_lib/supabase.js', () => ({
  createServiceSupabaseClient: (...args: unknown[]) =>
    createServiceSupabaseClientMock(...args),
  ensureCloudProfileExists: (...args: unknown[]) =>
    ensureCloudProfileExistsMock(...args),
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
    ensureCloudProfileExistsMock.mockReset()
    requireAuthenticatedUserMock.mockReset()
    requireAuthenticatedUserMock.mockResolvedValue({ id: 'user-1' })
    ensureCloudProfileExistsMock.mockResolvedValue(undefined)
  })

  test('accepts structured replay mistakes and returns a normalized record', async () => {
    const upsert = vi.fn().mockReturnValue({
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
    const from = vi.fn().mockReturnValue({ upsert })
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
    expect(ensureCloudProfileExistsMock).toHaveBeenCalledWith(
      expect.objectContaining({ from }),
      { id: 'user-1' },
    )
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        match_id: '11111111-1111-4111-8111-111111111111',
        user_id: 'user-1',
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
      expect.objectContaining({
        onConflict: 'match_id,user_id',
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

  test('accepts a stringified JSON request body', async () => {
    const upsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'analysis-2',
            match_id: '11111111-1111-4111-8111-111111111111',
            user_id: 'user-1',
            score: 8,
            source: 'fallback',
            status: 'ready',
            created_at: '2026-05-20T00:00:00.000Z',
            updated_at: '2026-05-20T00:00:00.000Z',
          },
          error: null,
        }),
      }),
    })
    const from = vi.fn().mockReturnValue({ upsert })
    createServiceSupabaseClientMock.mockReturnValue({ from })

    const req = {
      method: 'POST',
      body: JSON.stringify({
        matchId: '11111111-1111-4111-8111-111111111111',
        analysis: {
          score: 7.6,
          highlights: ['strong center control'],
          mistakes: [],
          tip: 'keep pressure on long diagonals',
        },
        source: 'fallback',
      }),
    } as VercelRequest
    const res = createResponseDouble()

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        score: 8,
      }),
      expect.any(Object),
    )
  })

  test('returns validation details for malformed payloads', async () => {
    const req = {
      method: 'POST',
      body: {
        matchId: 'not-a-uuid',
        analysis: {
          score: 9,
          highlights: [],
          mistakes: [],
          tip: 'tip',
        },
        source: 'live',
      },
    } as VercelRequest
    const res = createResponseDouble()

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Invalid coach analysis payload',
        code: 'INVALID_COACH_ANALYSIS_PAYLOAD',
        details: expect.any(Object),
      }),
    )
    expect(ensureCloudProfileExistsMock).not.toHaveBeenCalled()
  })

  test('returns 401 when authentication fails', async () => {
    requireAuthenticatedUserMock.mockRejectedValue(new Error('Unauthorized request.'))

    const req = {
      method: 'POST',
      body: {},
    } as VercelRequest
    const res = createResponseDouble()

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unauthorized request.',
      code: 'UNAUTHORIZED',
    })
  })

  test('returns a server error payload when persistence fails', async () => {
    const upsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'duplicate key value violates unique constraint' },
        }),
      }),
    })
    const from = vi.fn().mockReturnValue({ upsert })
    createServiceSupabaseClientMock.mockReturnValue({ from })

    const req = {
      method: 'POST',
      body: {
        matchId: '11111111-1111-4111-8111-111111111111',
        analysis: {
          score: 8.7,
          highlights: ['strong center control'],
          mistakes: [],
          tip: 'keep pressure on long diagonals',
        },
        source: 'live',
        status: 'ready',
      },
    } as VercelRequest
    const res = createResponseDouble()

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      error: 'duplicate key value violates unique constraint',
      code: 'COACH_ANALYSIS_SAVE_FAILED',
    })
  })
})
