import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { mapLeaderboardRow } from './mappers'
import type { LeaderboardSnapshot } from './types'

type LeaderboardScope = 'all' | string

type LeaderboardProfileRow = {
  id: string
  title: string
  city: string | null
  wins: number
  level: number
  xp: number
  rank_score: number
}

function compareRows(a: LeaderboardProfileRow, b: LeaderboardProfileRow) {
  return (
    b.rank_score - a.rank_score ||
    b.wins - a.wins ||
    b.level - a.level ||
    b.xp - a.xp
  )
}

function isSameRankGroup(a: LeaderboardProfileRow, b: LeaderboardProfileRow) {
  return (
    a.rank_score === b.rank_score &&
    a.wins === b.wins &&
    a.level === b.level &&
    a.xp === b.xp
  )
}

function rankRows(rows: LeaderboardProfileRow[], currentUserId?: string) {
  const sorted = [...rows].sort(compareRows)
  let currentRank = 0
  let previous: LeaderboardProfileRow | null = null

  return sorted.map((row, index) => {
    if (!previous || !isSameRankGroup(previous, row)) {
      currentRank = index + 1
    }

    previous = row

    return mapLeaderboardRow(
      {
        user_id: row.id,
        rank: currentRank,
        title: row.title,
        city: row.city,
        wins: row.wins,
        level: row.level,
        xp: row.xp,
        rank_score: row.rank_score,
      },
      currentUserId,
    )
  })
}

export async function fetchLeaderboard(
  scope: LeaderboardScope,
  currentUserId?: string,
): Promise<LeaderboardSnapshot> {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    return {
      entries: [],
      currentUserEntry: null,
      totalPlayers: 0,
    } satisfies LeaderboardSnapshot
  }

  let query = supabase
    .from('profiles')
    .select('id,title,city,wins,level,xp,rank_score')
    .order('rank_score', { ascending: false })
    .order('wins', { ascending: false })
    .order('level', { ascending: false })
    .order('xp', { ascending: false })

  if (scope !== 'all') {
    query = query.eq('city', scope)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  const rankedEntries = rankRows((data ?? []) as LeaderboardProfileRow[], currentUserId)
  const currentUserEntry =
    rankedEntries.find((entry) => entry.userId === currentUserId) ?? null

  return {
    entries: rankedEntries.slice(0, 10),
    currentUserEntry,
    totalPlayers: rankedEntries.length,
  }
}
