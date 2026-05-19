import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ZodError } from 'zod'
import { analyzeCoachPayload } from '../../src/coach/service.js'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const analysis = await analyzeCoachPayload(req.body)
    return res.status(200).json(analysis)
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        error: 'Invalid coach payload',
        details: error.flatten(),
      })
    }

    return res.status(500).json({ error: 'Unexpected coach error' })
  }
}
