import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import type { LatestResult } from '../../src/store/progress-store.js'
import type { PlayerProfile } from '../../src/rpg/types.js'
import {
  buildRankScore,
  createServiceSupabaseClient,
  ensureCloudProfileExists,
  requireAuthenticatedUser,
} from '../_lib/supabase.js'

const requestSchema = z.object({
  latestResult: z.any(),
  profile: z.any(),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const user = await requireAuthenticatedUser(req)
    const { latestResult, profile } = requestSchema.parse(req.body) as {
      latestResult: LatestResult
      profile: PlayerProfile
    }
    const serviceClient = createServiceSupabaseClient()
    await ensureCloudProfileExists(serviceClient, user)

    const { data: match, error: matchError } = await serviceClient
      .from('matches')
      .insert({
        user_id: user.id,
        outcome: latestResult.outcome,
        difficulty: latestResult.difficulty,
        xp_earned: latestResult.xpEarned,
        used_shadow_hint: latestResult.usedShadowHint,
        summary: latestResult,
        move_log: latestResult.moves,
        result_metadata: latestResult.result,
        created_at: latestResult.playedAt,
      })
      .select('*')
      .single()

    if (matchError) {
      throw matchError
    }

    const { error: profileError } = await serviceClient
      .from('profiles')
      .update({
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
        rank_score: buildRankScore({
          wins: profile.wins,
          level: profile.level,
          xp: profile.xp,
        }),
      })
      .eq('id', user.id)

    if (profileError) {
      throw profileError
    }

    return res.status(200).json({
      match: {
        ...latestResult,
        matchId: match.id,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save match'
    return res.status(400).json({ error: message })
  }
}
