import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { applyMove, getGameOutcome, getLegalMoves } from '../../src/game/engine.js'
import type { BoardCoord, Move, PieceColor } from '../../src/game/types.js'
import {
  createServiceSupabaseClient,
  ensureCloudProfileExists,
  requireAuthenticatedUser,
} from '../_lib/supabase.js'

const coordSchema = z.object({
  row: z.number().int().min(0).max(7),
  col: z.number().int().min(0).max(7),
})

const moveSchema = z.object({
  from: coordSchema,
  to: coordSchema,
  captured: z.array(coordSchema),
})

const requestSchema = z.object({
  roomCode: z.string().trim().min(5).max(5).transform((value) => value.toUpperCase()),
  move: moveSchema,
})

function sameCoord(
  left: { row: number; col: number },
  right: { row: number; col: number },
) {
  return left.row === right.row && left.col === right.col
}

function sameMove(left: Move, right: Move) {
  return (
    sameCoord(left.from, right.from) &&
    sameCoord(left.to, right.to) &&
    left.captured.length === right.captured.length &&
    left.captured.every((coord: BoardCoord, index: number) => sameCoord(coord, right.captured[index]))
  )
}

function getPlayerColor(room: {
  host_user_id: string
  guest_user_id: string | null
}, userId: string): PieceColor {
  if (room.host_user_id === userId) {
    return 'white'
  }

  if (room.guest_user_id === userId) {
    return 'black'
  }

  throw new Error('You are not a member of this room.')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const user = await requireAuthenticatedUser(req)
    const { roomCode, move } = requestSchema.parse(req.body)
    const serviceClient = createServiceSupabaseClient()
    await ensureCloudProfileExists(serviceClient, user)

    const { data: room, error: roomError } = await serviceClient
      .from('rooms')
      .select('*')
      .eq('room_code', roomCode)
      .single()

    if (roomError || !room) {
      throw new Error('Room not found.')
    }

    const color = getPlayerColor(room, user.id)
    const gameState = room.game_state

    if (gameState.currentTurn !== color) {
      throw new Error('It is not your turn.')
    }

    const legalMove = getLegalMoves(gameState).find((candidate: Move) => sameMove(candidate, move))
    if (!legalMove) {
      throw new Error('Illegal move.')
    }

    const nextState = applyMove(gameState, legalMove)
    const outcome = getGameOutcome(nextState)
    const nextStatus = outcome ? 'completed' : room.status

    const { data, error } = await serviceClient
      .from('rooms')
      .update({
        game_state: nextState,
        current_turn: nextState.currentTurn,
        winner: outcome?.winner ?? null,
        status: nextStatus,
        last_move_at: new Date().toISOString(),
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
      event_type: outcome ? 'complete' : 'move',
      move: legalMove,
      snapshot: nextState,
    })

    return res.status(200).json({ room: data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to apply room move'
    return res.status(400).json({ error: message })
  }
}
