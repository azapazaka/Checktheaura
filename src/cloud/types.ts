import type { GameOutcome, GameState, MatchMove, Move, PieceColor } from '../game/types'
import type {
  DailyQuestState,
  MatchSummary,
  PlayerProfile,
  RpgClass,
  StoredSettings,
} from '../rpg/types'
import type { LatestResult } from '../store/progress-store'

export type AppSessionMode =
  | 'guest'
  | 'authenticated'
  | 'upgrading'
  | 'onboarding'

export type AppSession = {
  mode: AppSessionMode
  userId?: string
}

export type CloudProfileRecord = {
  id: string
  city: string | null
  class_id: RpgClass | null
  xp: number
  level: number
  title: string
  wins: number
  games_played: number
  stats: PlayerProfile['stats']
  unspent_stat_points: number
  daily_quests: DailyQuestState
  unlocks: PlayerProfile['unlocks']
  rank_score: number
  created_at: string
  updated_at: string
}

export type CloudMatchRecord = {
  id: string
  user_id: string
  outcome: MatchSummary['outcome']
  difficulty: MatchSummary['difficulty']
  xp_earned: number
  used_shadow_hint: boolean
  summary: MatchSummary
  move_log: MatchMove[]
  result_metadata: GameOutcome
  created_at: string
}

export type CoachAnalysisRecord = {
  id: string
  match_id: string
  user_id: string
  score: number
  highlights: string[]
  mistakes: string[]
  tip: string
  source: 'live' | 'fallback'
  status: 'pending' | 'ready' | 'failed'
  created_at: string
  updated_at: string
}

export type RoomStatus = 'waiting' | 'active' | 'completed'
export type RoomJoinErrorCode =
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'UNAUTHORIZED'
  | 'INVALID_ROOM_CODE'

export type RoomParticipant = {
  userId: string
  displayName: string
  color: PieceColor
}

export type RoomRecord = {
  id: string
  room_code: string
  host_user_id: string
  guest_user_id: string | null
  status: RoomStatus
  game_state: GameState
  current_turn: PieceColor
  winner: PieceColor | null
  last_move_at: string | null
  created_at: string
  updated_at: string
}

export type RoomEventRecord = {
  id: string
  room_id: string
  actor_user_id: string
  event_type: 'join' | 'move' | 'complete' | 'sync'
  move: Move | null
  snapshot: GameState | null
  created_at: string
}

export type LeaderboardEntry = {
  rank: number
  userId: string
  title: string
  city: string | null
  wins: number
  level: number
  xp: number
  rankScore: number
  isCurrentUser?: boolean
}

export type LeaderboardSnapshot = {
  entries: LeaderboardEntry[]
  currentUserEntry: LeaderboardEntry | null
  totalPlayers: number
}

export type CloudProfileBootstrapPayload = {
  classId: RpgClass
  city: string
  importGuestProgress: boolean
  localProfile: PlayerProfile | null
  localSettings: StoredSettings
}

export type CloudBootstrapResponse = {
  profile: CloudProfileRecord
  importedHistory: MatchSummary[]
}

export type PersistedCoachSnapshot = {
  matchId: string
  coachAnalysisId: string
  source: 'live' | 'fallback'
  status: 'pending' | 'ready' | 'failed'
}

export type SaveMatchRequest = {
  latestResult: LatestResult
  profile: PlayerProfile
}
