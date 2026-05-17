import { getSupabaseBrowserClient } from '../lib/supabase/client'

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
    if (response.status === 404 || response.status === 502 || response.status === 503) {
      throw new Error(getLocalApiHint())
    }

    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(payload.error ?? `Request failed with ${response.status}`)
  }

  return (await response.json()) as T
}
