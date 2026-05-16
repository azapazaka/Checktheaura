import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { createServiceSupabaseClient, requireAuthenticatedUser } from '../_lib/supabase'

const requestSchema = z.object({
  roomCode: z.string().min(5).max(5),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const user = await requireAuthenticatedUser(req)
    const { roomCode } = requestSchema.parse(req.body)
    const serviceClient = createServiceSupabaseClient()

    const { data: room, error: roomError } = await serviceClient
      .from('rooms')
      .select('*')
      .eq('room_code', roomCode)
      .single()

    if (roomError || !room) {
      throw new Error('Room not found.')
    }

    if (room.guest_user_id && room.guest_user_id !== user.id && room.host_user_id !== user.id) {
      throw new Error('Room is already full.')
    }

    if (room.host_user_id === user.id) {
      return res.status(200).json({ room })
    }

    const { data, error } = await serviceClient
      .from('rooms')
      .update({
        guest_user_id: user.id,
        status: 'active',
      })
      .eq('id', room.id)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    await serviceClient.from('room_events').insert({
      room_id: room.id,
      actor_user_id: user.id,
      event_type: 'join',
      snapshot: data.game_state,
    })

    return res.status(200).json({ room: data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to join room'
    return res.status(400).json({ error: message })
  }
}
