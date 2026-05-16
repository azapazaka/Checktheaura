import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { createInitialProfile } from '../../src/rpg/progression'
import type { MatchSummary, PlayerProfile } from '../../src/rpg/types'
import { mapPlayerProfileToCloudPayload } from '../../src/cloud/mappers'
import { buildRankScore, createServiceSupabaseClient, requireAuthenticatedUser } from '../_lib/supabase'

const payloadSchema = z.object({
  classId: z.enum(['warrior', 'strategist', 'shadow']),
  city: z.string().min(1),
  importGuestProgress: z.boolean(),
  localProfile: z.any().nullable(),
  localSettings: z.any(),
})

function coerceProfile(
  localProfile: PlayerProfile | null,
  classId: PlayerProfile['classId'],
  city: string,
  userId: string,
) {
  const base = localProfile ?? createInitialProfile(classId)

  return {
    ...base,
    id: userId,
    authUserId: userId,
    classId,
    city,
    isGuest: false,
    rankScore: buildRankScore({
      wins: base.wins,
      level: base.level,
      xp: base.xp,
    }),
  }
}

async function importHistory(
  serviceClient: ReturnType<typeof createServiceSupabaseClient>,
  userId: string,
  history: MatchSummary[],
) {
  if (history.length === 0) {
    return
  }

  const { count } = await serviceClient
    .from('matches')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if ((count ?? 0) > 0) {
    return
  }

  const rows = history.map((match) => ({
    user_id: userId,
    outcome: match.outcome,
    difficulty: match.difficulty,
    xp_earned: match.xpEarned,
    used_shadow_hint: match.usedShadowHint,
    summary: match,
    move_log: [],
    result_metadata: { winner: null, reason: 'blocked' },
    created_at: match.playedAt,
  }))

  if (rows.length > 0) {
    await serviceClient.from('matches').insert(rows)
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const user = await requireAuthenticatedUser(req)
    const payload = payloadSchema.parse(req.body)
    const serviceClient = createServiceSupabaseClient()

    const profile = coerceProfile(
      payload.importGuestProgress ? (payload.localProfile as PlayerProfile | null) : null,
      payload.classId,
      payload.city,
      user.id,
    )

    const cloudPayload = mapPlayerProfileToCloudPayload(profile)

    const { data, error } = await serviceClient
      .from('profiles')
      .upsert({
        id: user.id,
        ...cloudPayload,
      })
      .select('*')
      .single()

    if (error) {
      throw error
    }

    const importedHistory = payload.importGuestProgress
      ? ((payload.localProfile as PlayerProfile | null)?.history ?? [])
      : []

    await importHistory(serviceClient, user.id, importedHistory)

    return res.status(200).json({
      profile: data,
      importedHistory,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Profile upgrade failed'
    return res.status(400).json({ error: message })
  }
}
