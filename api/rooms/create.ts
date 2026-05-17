import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createInitialGameState } from '../../src/game/engine.js'
import { createServiceSupabaseClient, requireAuthenticatedUser } from '../_lib/supabase.js'

function generateRoomCode() {
  return Math.random().toString(36).slice(2, 7).toUpperCase()
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const user = await requireAuthenticatedUser(req)
    const serviceClient = createServiceSupabaseClient()
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

    if (error) {
      throw error
    }

    return res.status(200).json({ room: data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create room'
    return res.status(400).json({ error: message })
  }
}
