import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ZodError, z } from 'zod'
import {
  createServiceSupabaseClient,
  ensureCloudProfileExists,
  requireAuthenticatedUser,
} from '../_lib/supabase.js'

const replayMistakeSchema = z.object({
  turnNumber: z.number(),
  madeMove: z.object({
    from: z.object({ row: z.number(), col: z.number() }),
    to: z.object({ row: z.number(), col: z.number() }),
  }),
  betterMove: z.object({
    from: z.object({ row: z.number(), col: z.number() }),
    to: z.object({ row: z.number(), col: z.number() }),
  }),
  explanation: z.string(),
})

const requestSchema = z.object({
  matchId: z.string().uuid(),
  analysis: z.object({
    score: z.number(),
    highlights: z.array(z.string()),
    mistakes: z.array(replayMistakeSchema),
    tip: z.string(),
  }),
  source: z.enum(['live', 'fallback']),
  status: z.enum(['pending', 'ready', 'failed']).optional(),
})

function normalizeBody(body: unknown) {
  if (typeof body !== 'string') {
    return body
  }

  try {
    return JSON.parse(body)
  } catch {
    return body
  }
}

function isZodErrorLike(error: unknown): error is ZodError {
  if (error instanceof ZodError) {
    return true
  }

  return Boolean(
    error &&
      typeof error === 'object' &&
      'name' in error &&
      error.name === 'ZodError' &&
      'flatten' in error &&
      typeof error.flatten === 'function',
  )
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message
  }

  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message
  }

  return fallback
}

function isUnauthorizedError(error: unknown) {
  const message = getErrorMessage(error, '')
  return message === 'Unauthorized request.' || message === 'Missing Authorization header.'
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const user = await requireAuthenticatedUser(req)
    const payload = requestSchema.parse(normalizeBody(req.body))
    const serviceClient = createServiceSupabaseClient()
    await ensureCloudProfileExists(serviceClient, user)
    const normalizedScore = Math.round(payload.analysis.score)

    const { data, error } = await serviceClient
      .from('coach_analyses')
      .upsert(
        {
          match_id: payload.matchId,
          user_id: user.id,
          score: normalizedScore,
          analysis_data: payload.analysis,
          source: payload.source,
          status: payload.status ?? 'ready',
        },
        {
          onConflict: 'match_id,user_id',
        },
      )
      .select('*')
      .single()

    if (error) {
      throw error
    }

    if (!data) {
      throw new Error('Coach analysis was not returned after save.')
    }

    return res.status(200).json({
      analysis: {
        ...data,
        highlights: payload.analysis.highlights,
        mistakes: payload.analysis.mistakes,
        tip: payload.analysis.tip,
      },
    })
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return res.status(401).json({
        error: getErrorMessage(error, 'Unauthorized request.'),
        code: 'UNAUTHORIZED',
      })
    }

    if (isZodErrorLike(error)) {
      return res.status(400).json({
        error: 'Invalid coach analysis payload',
        code: 'INVALID_COACH_ANALYSIS_PAYLOAD',
        details: error.flatten(),
      })
    }

    return res.status(500).json({
      error: getErrorMessage(error, 'Failed to save coach analysis'),
      code: 'COACH_ANALYSIS_SAVE_FAILED',
    })
  }
}
