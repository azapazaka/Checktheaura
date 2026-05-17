import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createServiceSupabaseClient, requireAuthenticatedUser } from './_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // await requireAuthenticatedUser(req)
    const serviceClient = createServiceSupabaseClient()
    const cityFilter =
      typeof req.query.city === 'string' && req.query.city.length > 0
        ? req.query.city
        : null

    const { data, error } = await serviceClient.rpc('get_leaderboard', {
      city_filter: cityFilter,
    })

    if (error) {
      throw error
    }

    return res.status(200).json({ entries: data ?? [] })
  } catch (error) {
    console.error('Leaderboard API Error:', error)
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'message' in error
          ? String((error as Record<string, unknown>).message)
          : JSON.stringify(error)

    return res.status(500).json({ error: message })
  }
}
