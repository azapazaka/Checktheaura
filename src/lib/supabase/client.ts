import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseConfig } from './config'

let browserClient: SupabaseClient | null = null

export function getSupabaseBrowserClient() {
  const config = getSupabaseConfig()

  if (!config) {
    return null
  }

  if (!browserClient) {
    browserClient = createBrowserClient(config.url, config.publishableKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
        storageKey: 'checktheaura-auth',
      },
    })
  }

  return browserClient
}
