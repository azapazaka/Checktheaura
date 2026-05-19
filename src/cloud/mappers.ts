import { createInitialProfile } from '../rpg/progression.js'
import type { MatchSummary, PlayerProfile } from '../rpg/types.js'
import type {
  CloudMatchRecord,
  CloudProfileRecord,
  CoachAnalysisRecord,
  LeaderboardEntry,
} from './types.js'

export function mapCloudProfileToPlayerProfile(
  record: CloudProfileRecord,
  history: MatchSummary[] = [],
): PlayerProfile {
  const base = createInitialProfile(record.class_id ?? 'warrior')

  return {
    ...base,
    id: record.id,
    authUserId: record.id,
    isGuest: false,
    city: record.city,
    rankScore: record.rank_score,
    classId: record.class_id ?? base.classId,
    xp: record.xp,
    level: record.level,
    title: record.title,
    wins: record.wins,
    gamesPlayed: record.games_played,
    stats: {
      ...base.stats,
      ...record.stats,
    },
    unspentStatPoints: record.unspent_stat_points,
    dailyQuests: record.daily_quests,
    unlocks: record.unlocks,
    history,
  }
}

export function mapPlayerProfileToCloudPayload(profile: PlayerProfile) {
  return {
    city: profile.city ?? null,
    class_id: profile.classId,
    xp: profile.xp,
    level: profile.level,
    title: profile.title,
    wins: profile.wins,
    games_played: profile.gamesPlayed,
    stats: profile.stats,
    unspent_stat_points: profile.unspentStatPoints,
    daily_quests: profile.dailyQuests,
    unlocks: profile.unlocks,
    rank_score: profile.rankScore ?? computeRankScore(profile),
  }
}

export function mapCloudMatchToSummary(record: CloudMatchRecord): MatchSummary {
  return {
    ...record.summary,
    id: record.summary.id ?? record.id,
    matchId: record.id,
  }
}

export function mergeAnalysisIntoHistory(
  history: MatchSummary[],
  analyses: CoachAnalysisRecord[],
) {
  const analysesByMatchId = new Map(analyses.map((analysis) => [analysis.match_id, analysis]))

  return history.map((match) => {
    const analysis =
      (match.matchId ? analysesByMatchId.get(match.matchId) : null) ?? null

    return analysis
      ? {
          ...match,
          coachAnalysisId: analysis.id,
          analysisStatus: analysis.status,
        }
      : match
  })
}

export function mapLeaderboardRow(row: {
  user_id: string
  rank: number
  title: string
  city: string | null
  wins: number
  level: number
  xp: number
  rank_score: number
}, currentUserId?: string): LeaderboardEntry {
  return {
    rank: row.rank,
    userId: row.user_id,
    title: row.title,
    city: row.city,
    wins: row.wins,
    level: row.level,
    xp: row.xp,
    rankScore: row.rank_score,
    isCurrentUser: currentUserId === row.user_id,
  }
}

export function computeRankScore(profile: Pick<PlayerProfile, 'wins' | 'level' | 'xp'>) {
  return profile.wins * 1000 + profile.level * 100 + profile.xp
}
