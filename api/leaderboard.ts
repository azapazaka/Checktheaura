import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

function getRequiredEnv(name: string): string {
  const aliases: Record<string, string[]> = {
    SUPABASE_URL: ['SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'VITE_SUPABASE_URL'],
    SUPABASE_PUBLISHABLE_KEY: [
      'SUPABASE_PUBLISHABLE_KEY',
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
      'VITE_SUPABASE_PUBLISHABLE_KEY',
    ],
    SUPABASE_SERVICE_ROLE_KEY: ['SUPABASE_SERVICE_ROLE_KEY'],
  }

  const value = (aliases[name] ?? [name])
    .map((key) => process.env[key]?.trim())
    .find(Boolean)

  if (!value) {
    throw new Error(`Missing required env: ${name}`)
  }

  return value
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // 1. Verify Authentication
    const authorization = req.headers.authorization
    if (!authorization) {
      return res.status(401).json({ error: 'Missing Authorization header.' })
    }

    const requestClient = createClient(
      getRequiredEnv('SUPABASE_URL'),
      getRequiredEnv('SUPABASE_PUBLISHABLE_KEY'),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: {
            Authorization: authorization,
          },
        },
      },
    )

    const {
      data: { user },
      error: authError,
    } = await requestClient.auth.getUser()

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized request.' })
    }

    // 2. Fetch Leaderboard using Service Client
    const serviceClient = createClient(
      getRequiredEnv('SUPABASE_URL'),
      getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

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
