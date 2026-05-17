import type { VercelRequest, VercelResponse } from '@vercel/node'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import handler from './join'

const createServiceSupabaseClientMock = vi.fn()
const ensureCloudProfileExistsMock = vi.fn()
const requireAuthenticatedUserMock = vi.fn()

vi.mock('../_lib/supabase.js', () => ({
  createServiceSupabaseClient: (...args: unknown[]) => createServiceSupabaseClientMock(...args),
  ensureCloudProfileExists: (...args: unknown[]) => ensureCloudProfileExistsMock(...args),
  requireAuthenticatedUser: (...args: unknown[]) => requireAuthenticatedUserMock(...args),
}))

function createResponseDouble() {
  const res = {} as VercelResponse
  res.setHeader = vi.fn()
  res.status = vi.fn(() => res)
  res.json = vi.fn(() => res)
  return res
}

function createRoomsSelectClient(result: { data: unknown; error: unknown }) {
  const eq = vi.fn().mockReturnValue({
    single: vi.fn().mockResolvedValue(result),
  })

  const select = vi.fn().mockReturnValue({ eq })
  const from = vi.fn().mockReturnValue({ select })

  return { from, select, eq }
}

describe('/api/rooms/join', () => {
  beforeEach(() => {
    createServiceSupabaseClientMock.mockReset()
    ensureCloudProfileExistsMock.mockReset()
    requireAuthenticatedUserMock.mockReset()
    ensureCloudProfileExistsMock.mockResolvedValue(undefined)
    requireAuthenticatedUserMock.mockResolvedValue({ id: 'host-user-id' })
  })

  test('normalizes lowercase room code before lookup', async () => {
    const room = {
      id: 'room-1',
      room_code: 'ABCDE',
      host_user_id: 'host-user-id',
      guest_user_id: null,
      status: 'waiting',
      game_state: { board: [], currentTurn: 'white', moves: [] },
      current_turn: 'white',
      winner: null,
      last_move_at: null,
      created_at: '2026-05-18T00:00:00.000Z',
      updated_at: '2026-05-18T00:00:00.000Z',
    }
    const client = createRoomsSelectClient({ data: room, error: null })
    createServiceSupabaseClientMock.mockReturnValue({ from: client.from })

    const req = {
      method: 'POST',
      body: { roomCode: 'abcde' },
    } as VercelRequest
    const res = createResponseDouble()

    await handler(req, res)

    expect(client.eq).toHaveBeenCalledWith('room_code', 'ABCDE')
    expect(res.status).toHaveBeenCalledWith(200)
  })

  test('returns ROOM_NOT_FOUND when the room does not exist', async () => {
    const client = createRoomsSelectClient({ data: null, error: { code: 'PGRST116' } })
    createServiceSupabaseClientMock.mockReturnValue({ from: client.from })

    const req = {
      method: 'POST',
      body: { roomCode: 'ABCDE' },
    } as VercelRequest
    const res = createResponseDouble()

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      error: 'Комната не найдена.',
      code: 'ROOM_NOT_FOUND',
    })
  })

  test('returns ROOM_FULL when another guest already occupies the room', async () => {
    const room = {
      id: 'room-1',
      room_code: 'ABCDE',
      host_user_id: 'host-user-id',
      guest_user_id: 'other-guest-id',
      status: 'active',
      game_state: { board: [], currentTurn: 'white', moves: [] },
      current_turn: 'white',
      winner: null,
      last_move_at: null,
      created_at: '2026-05-18T00:00:00.000Z',
      updated_at: '2026-05-18T00:00:00.000Z',
    }
    const client = createRoomsSelectClient({ data: room, error: null })
    createServiceSupabaseClientMock.mockReturnValue({ from: client.from })
    requireAuthenticatedUserMock.mockResolvedValue({ id: 'new-guest-id' })

    const req = {
      method: 'POST',
      body: { roomCode: 'ABCDE' },
    } as VercelRequest
    const res = createResponseDouble()

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith({
      error: 'Комната уже занята.',
      code: 'ROOM_FULL',
    })
  })
})
