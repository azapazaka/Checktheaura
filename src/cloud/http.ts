import { getSupabaseBrowserClient } from '../lib/supabase/client'

export class AuthorizedFetchError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'AuthorizedFetchError'
    this.status = status
    this.code = code
  }
}

export function isAuthorizedFetchError(error: unknown): error is AuthorizedFetchError {
  return error instanceof AuthorizedFetchError
}

function getLocalApiHint() {
  if (typeof window === 'undefined') {
    return 'Cloud API routes are unavailable.'
  }

  const isLocalHost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'

  if (!isLocalHost) {
    return 'Cloud API routes are unavailable.'
  }

  return 'Local cloud API routes are not running. Start the app with `npm run dev:cloud` so the Vercel /api routes are available.'
}

export async function authorizedJsonFetch<T>(path: string, init: RequestInit = {}) {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error('Supabase client is not configured.')
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('No active Supabase session.')
  }

  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      ...(init.headers ?? {}),
    },
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string
      code?: string
    }
    if (
      (response.status === 404 || response.status === 502 || response.status === 503) &&
      !payload.error
    ) {
      throw new AuthorizedFetchError(getLocalApiHint(), response.status)
    }

    throw new AuthorizedFetchError(
      payload.error ?? `Request failed with ${response.status}`,
      response.status,
      payload.code,
    )
  }

  return (await response.json()) as T
}
