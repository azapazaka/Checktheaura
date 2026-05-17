import { createClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'
import type { VercelRequest } from '@vercel/node'

function getRequiredEnv(name: string) {
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

export function createServiceSupabaseClient() {
  return createClient(
    getRequiredEnv('SUPABASE_URL'),
    getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}

export function createRequestSupabaseClient(req: VercelRequest) {
  const authorization = req.headers.authorization

  if (!authorization) {
    throw new Error('Missing Authorization header.')
  }

  return createClient(
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
}

export async function requireAuthenticatedUser(req: VercelRequest) {
  const requestClient = createRequestSupabaseClient(req)
  const {
    data: { user },
    error,
  } = await requestClient.auth.getUser()

  if (error || !user) {
    throw new Error('Unauthorized request.')
  }

  return user
}

export async function ensureCloudProfileExists(
  serviceClient: Pick<ReturnType<typeof createServiceSupabaseClient>, 'from'>,
  user: Pick<User, 'id'>,
) {
  const { error } = await serviceClient.from('profiles').upsert(
    {
      id: user.id,
    },
    {
      onConflict: 'id',
      ignoreDuplicates: true,
    },
  )

  if (error) {
    throw error
  }
}

export function buildRankScore({
  wins,
  level,
  xp,
}: {
  wins: number
  level: number
  xp: number
}) {
  return wins * 1000 + level * 100 + xp
}
