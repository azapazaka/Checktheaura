import type { CoachAnalyzeResponse } from '../coach/types'
import { authorizedJsonFetch } from './http'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import type { MatchSummary } from '../rpg/types'
import type { LatestResult } from '../store/progress-store'
import type {
  CoachAnalysisRecord,
  PersistedCoachSnapshot,
  SaveMatchRequest,
} from './types'

export async function persistCloudMatch(request: SaveMatchRequest) {
  return authorizedJsonFetch<{ match: MatchSummary & { matchId: string } }>(
    '/api/matches/save',
    {
      method: 'POST',
      body: JSON.stringify(request),
    },
  )
}

export async function persistCoachAnalysis(payload: {
  matchId: string
  analysis: CoachAnalyzeResponse
  source: 'live' | 'fallback'
  status?: 'pending' | 'ready' | 'failed'
}) {
  return authorizedJsonFetch<{ analysis: CoachAnalysisRecord }>(
    '/api/coach/save-analysis',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
}

export async function fetchCoachAnalysis(matchId: string) {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    return null
  }

  const { data, error } = await supabase
    .from('coach_analyses')
    .select('*')
    .eq('match_id', matchId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  const analysisData = (data as Record<string, unknown>).analysis_data as
    | { highlights?: string[]; mistakes?: unknown[]; tip?: string }
    | undefined

  return {
    ...data,
    highlights: analysisData?.highlights ?? [],
    mistakes: analysisData?.mistakes ?? [],
    tip: analysisData?.tip ?? '',
  } as unknown as CoachAnalysisRecord
}

export function mergePersistedAnalysis(
  latestResult: LatestResult,
  snapshot: PersistedCoachSnapshot | null,
) {
  if (!snapshot || snapshot.matchId !== latestResult.matchId) {
    return latestResult
  }

  return {
    ...latestResult,
    coachAnalysisId: snapshot.coachAnalysisId,
    analysisStatus: snapshot.status,
  }
}
