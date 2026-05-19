import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { createServiceSupabaseClient, requireAuthenticatedUser } from '../_lib/supabase.js'

const requestSchema = z.object({
  matchId: z.string().uuid(),
  analysis: z.object({
    score: z.number(),
    highlights: z.array(z.string()),
    mistakes: z.array(z.string()),
    tip: z.string(),
  }),
  source: z.enum(['live', 'fallback']),
  status: z.enum(['pending', 'ready', 'failed']).optional(),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const user = await requireAuthenticatedUser(req)
    const payload = requestSchema.parse(req.body)
    const serviceClient = createServiceSupabaseClient()
    const normalizedScore = Math.round(payload.analysis.score)

    const { data, error } = await serviceClient
      .from('coach_analyses')
      .insert({
        match_id: payload.matchId,
        user_id: user.id,
        score: normalizedScore,
        analysis_data: payload.analysis,
        source: payload.source,
        status: payload.status ?? 'ready',
      })
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return res.status(200).json({ analysis: data })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to save coach analysis'
    return res.status(400).json({ error: message })
  }
}
