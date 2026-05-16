import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Move } from '../game/types'
import { authorizedJsonFetch } from './http'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import type { RoomRecord } from './types'

export async function createRoom() {
  return authorizedJsonFetch<{ room: RoomRecord }>('/api/rooms/create', {
    method: 'POST',
  })
}

export async function joinRoom(roomCode: string) {
  return authorizedJsonFetch<{ room: RoomRecord }>('/api/rooms/join', {
    method: 'POST',
    body: JSON.stringify({ roomCode }),
  })
}

export async function moveInRoom(roomCode: string, move: Move) {
  return authorizedJsonFetch<{ room: RoomRecord }>('/api/rooms/move', {
    method: 'POST',
    body: JSON.stringify({ roomCode, move }),
  })
}

export async function fetchRoom(roomCode: string) {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error('Supabase client is not configured.')
  }

  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('room_code', roomCode)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data as RoomRecord | null
}

export function subscribeToRoom(
  roomCode: string,
  onRoom: (room: RoomRecord) => void,
) {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    return null
  }

  const channel: RealtimeChannel = supabase
    .channel(`room:${roomCode}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'rooms',
        filter: `room_code=eq.${roomCode}`,
      },
      (payload) => {
        if (payload.new) {
          onRoom(payload.new as RoomRecord)
        }
      },
    )

  void channel.subscribe()
  return channel
}

export function unsubscribeFromRoom(channel: RealtimeChannel | null) {
  if (!channel) {
    return
  }

  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    return
  }

  void supabase.removeChannel(channel)
}
