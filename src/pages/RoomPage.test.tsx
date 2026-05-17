import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createInitialGameState } from '../game/engine'
import { createInitialProfile } from '../rpg/progression'
import { useProgressStore } from '../store/progress-store'
import { AuthTestProvider } from '../test/AuthTestProvider'
import { createMockUser } from '../test/auth-mocks'
import type { RoomRecord } from '../cloud/types'
import { RoomPage } from './RoomPage'

const fetchRoomMock = vi.fn()
const joinRoomMock = vi.fn()
const subscribeToRoomMock = vi.fn()
const unsubscribeFromRoomMock = vi.fn()
const moveInRoomMock = vi.fn()

vi.mock('../cloud/room-service', () => ({
  fetchRoom: (...args: unknown[]) => fetchRoomMock(...args),
  joinRoom: (...args: unknown[]) => joinRoomMock(...args),
  subscribeToRoom: (...args: unknown[]) => subscribeToRoomMock(...args),
  unsubscribeFromRoom: (...args: unknown[]) => unsubscribeFromRoomMock(...args),
  moveInRoom: (...args: unknown[]) => moveInRoomMock(...args),
}))

describe('RoomPage', () => {
  beforeEach(() => {
    localStorage.clear()
    useProgressStore.setState(useProgressStore.getInitialState(), true)
    fetchRoomMock.mockReset()
    joinRoomMock.mockReset()
    subscribeToRoomMock.mockReset()
    unsubscribeFromRoomMock.mockReset()
    moveInRoomMock.mockReset()
    subscribeToRoomMock.mockReturnValue(null)
  })

  test('joins room when direct fetch is empty for a non-member viewer', async () => {
    const user = createMockUser({ id: 'guest-user-id' })
    const room: RoomRecord = {
      id: 'room-1',
      room_code: 'ABCDE',
      host_user_id: 'host-user-id',
      guest_user_id: 'guest-user-id',
      status: 'active',
      game_state: createInitialGameState(),
      current_turn: 'white',
      winner: null,
      last_move_at: null,
      created_at: '2026-05-18T00:00:00.000Z',
      updated_at: '2026-05-18T00:00:00.000Z',
    }

    useProgressStore.setState({
      ...useProgressStore.getInitialState(),
      profile: createInitialProfile('strategist'),
    })

    fetchRoomMock.mockResolvedValue(null)
    joinRoomMock.mockResolvedValue({ room })

    render(
      <AuthTestProvider
        value={{
          isAuthenticated: true,
          user,
        }}
      >
        <MemoryRouter initialEntries={['/rooms/abcde']}>
          <Routes>
            <Route path="/rooms/:roomCode" element={<RoomPage />} />
          </Routes>
        </MemoryRouter>
      </AuthTestProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText(/комната abcde/i)).toBeInTheDocument()
    })

    expect(fetchRoomMock).toHaveBeenCalledWith('ABCDE')
    expect(joinRoomMock).toHaveBeenCalledWith('ABCDE')
  })
})
