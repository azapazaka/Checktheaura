import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { mapLeaderboardRow } from './mappers'
import type { LeaderboardEntry } from './types'

type LeaderboardScope = 'all' | string

type LeaderboardRpcRow = {
  user_id: string
  rank: number
  title: string
  city: string | null
  wins: number
  level: number
  xp: number
  rank_score: number
}

export async function fetchLeaderboard(scope: LeaderboardScope, currentUserId?: string) {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    return [] satisfies LeaderboardEntry[]
  }

  const cityFilter = scope === 'all' ? null : scope
  const { data, error } = await supabase.rpc('get_leaderboard', {
    city_filter: cityFilter,
  })

  if (error) {
    throw error
  }

  return ((data ?? []) as LeaderboardRpcRow[]).map((row) =>
    mapLeaderboardRow(row, currentUserId),
  )
}
