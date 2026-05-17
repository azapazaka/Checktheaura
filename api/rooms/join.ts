import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ZodError, z } from 'zod'
import {
  createServiceSupabaseClient,
  ensureCloudProfileExists,
  requireAuthenticatedUser,
} from '../_lib/supabase.js'

const requestSchema = z.object({
  roomCode: z.string().trim().min(5).max(5).transform((value) => value.toUpperCase()),
})

class JoinRoomError extends Error {
  status: number
  code: 'ROOM_NOT_FOUND' | 'ROOM_FULL' | 'UNAUTHORIZED' | 'INVALID_ROOM_CODE'

  constructor(
    message: string,
    status: number,
    code: 'ROOM_NOT_FOUND' | 'ROOM_FULL' | 'UNAUTHORIZED' | 'INVALID_ROOM_CODE',
  ) {
    super(message)
    this.name = 'JoinRoomError'
    this.status = status
    this.code = code
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    let user
    try {
      user = await requireAuthenticatedUser(req)
    } catch {
      throw new JoinRoomError('Sign in to join this room.', 401, 'UNAUTHORIZED')
    }

    const { roomCode } = requestSchema.parse(req.body)
    const serviceClient = createServiceSupabaseClient()
    await ensureCloudProfileExists(serviceClient, user)

    const { data: room, error: roomError } = await serviceClient
      .from('rooms')
      .select('*')
      .eq('room_code', roomCode)
      .single()

    if (roomError || !room) {
      throw new JoinRoomError('Комната не найдена.', 404, 'ROOM_NOT_FOUND')
    }

    if (room.guest_user_id && room.guest_user_id !== user.id && room.host_user_id !== user.id) {
      throw new JoinRoomError('Комната уже занята.', 409, 'ROOM_FULL')
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
    if (error instanceof JoinRoomError) {
      return res.status(error.status).json({ error: error.message, code: error.code })
    }

    if (error instanceof ZodError) {
      return res.status(400).json({
        error: 'Код комнаты должен содержать 5 символов.',
        code: 'INVALID_ROOM_CODE',
      })
    }

    const message = error instanceof Error ? error.message : 'Failed to join room'
    return res.status(400).json({ error: message, code: 'INVALID_ROOM_CODE' })
  }
}
