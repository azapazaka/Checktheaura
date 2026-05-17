import { authorizedJsonFetch } from './http'
import { mapLeaderboardRow } from './mappers'
import type { LeaderboardSnapshot } from './types'

type LeaderboardScope = 'all' | string

interface LeaderboardApiRow {
  user_id: string
  rank: number
  title: string
  city: string | null
  wins: number
  level: number
  xp: number
  rank_score: number
}

export async function fetchLeaderboard(
  scope: LeaderboardScope,
  currentUserId?: string,
): Promise<LeaderboardSnapshot> {
  const url = scope === 'all' ? '/api/leaderboard' : `/api/leaderboard?city=${encodeURIComponent(scope)}`

  try {
    const data = await authorizedJsonFetch<{ entries: LeaderboardApiRow[] }>(url)
    const entries = (data.entries ?? []).map((row) =>
      mapLeaderboardRow(
        {
          user_id: row.user_id,
          rank: Number(row.rank),
          title: row.title,
          city: row.city,
          wins: row.wins,
          level: row.level,
          xp: row.xp,
          rank_score: row.rank_score,
        },
        currentUserId,
      ),
    )

    const currentUserEntry = entries.find((entry) => entry.userId === currentUserId) ?? null

    return {
      entries,
      currentUserEntry,
      totalPlayers: entries.length,
    }
  } catch (err) {
    console.error('Error fetching leaderboard:', err)
    throw err
  }
}
