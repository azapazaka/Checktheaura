import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createInitialGameState } from '../../src/game/engine.js'
import {
  createServiceSupabaseClient,
  ensureCloudProfileExists,
  requireAuthenticatedUser,
} from '../_lib/supabase.js'

function generateRoomCode() {
  return Math.random().toString(36).slice(2, 7).toUpperCase()
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505'
  )
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const user = await requireAuthenticatedUser(req)
    const serviceClient = createServiceSupabaseClient()
    await ensureCloudProfileExists(serviceClient, user)

    let lastError: unknown = null

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const roomCode = generateRoomCode()
      const { data, error } = await serviceClient
        .from('rooms')
        .insert({
          room_code: roomCode,
          host_user_id: user.id,
          status: 'waiting',
          game_state: createInitialGameState(),
          current_turn: 'white',
        })
        .select('*')
        .single()

      if (!error) {
        return res.status(200).json({ room: data })
      }

      lastError = error

      if (!isUniqueConstraintError(error)) {
        throw error
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Failed to generate a unique room code.')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create room'
    return res.status(400).json({ error: message })
  }
}
