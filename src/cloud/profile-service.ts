import type { User } from '@supabase/supabase-js'
import { authorizedJsonFetch } from './http'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import type { PlayerProfile } from '../rpg/types'
import { useProgressStore } from '../store/progress-store'
import { mapCloudProfileToPlayerProfile } from './mappers'
import type {
  CloudBootstrapResponse,
  CloudMatchRecord,
  CloudProfileBootstrapPayload,
  CloudProfileRecord,
  CoachAnalysisRecord,
} from './types'

export async function fetchCloudProfile(userId: string) {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    return null
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data as CloudProfileRecord | null
}

export async function fetchCloudHistory(userId: string) {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    throw error
  }

  return (data ?? []) as CloudMatchRecord[]
}

export async function fetchCoachHistory(userId: string) {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from('coach_analyses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    throw error
  }

  return (data ?? []) as CoachAnalysisRecord[]
}

export async function bootstrapCloudProfile(
  payload: CloudProfileBootstrapPayload,
) {
  return authorizedJsonFetch<CloudBootstrapResponse>('/api/profile/upgrade', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function hydrateStoreFromCloud(record: CloudProfileRecord, history: PlayerProfile['history']) {
  const nextProfile = mapCloudProfileToPlayerProfile(record, history)
  useProgressStore.getState().hydrateProfile(nextProfile)
  return nextProfile
}

export async function getSessionUser() {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    return null
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user satisfies User | null
}
