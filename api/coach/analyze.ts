import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ZodError } from 'zod'
import { analyzeCoachPayload } from '../../src/coach/service.js'

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

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const analysis = await analyzeCoachPayload(normalizeBody(req.body))
    return res.status(200).json(analysis)
  } catch (error) {
    if (isZodErrorLike(error)) {
      return res.status(400).json({
        error: 'Invalid coach payload',
        details: error.flatten(),
      })
    }

    if (req.headers['x-debug-coach'] === '1') {
      return res.status(500).json({
        error: 'Unexpected coach error',
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : typeof error,
        bodyType: typeof req.body,
      })
    }

    return res.status(500).json({ error: 'Unexpected coach error' })
  }
}
