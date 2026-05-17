import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { AuthorizedFetchError } from '../cloud/http'
import type { RoomRecord } from '../cloud/types'
import { createInitialGameState } from '../game/engine'
import { createInitialProfile } from '../rpg/progression'
import { useProgressStore } from '../store/progress-store'
import { AuthTestProvider } from '../test/AuthTestProvider'
import { createMockUser } from '../test/auth-mocks'
import { RoomPage } from './RoomPage'

function LocationProbe() {
  const location = useLocation()
  return <div>{`${location.pathname}${location.search}`}</div>
}

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

  test('shows a user-facing full room message', async () => {
    const user = createMockUser({ id: 'outsider-user-id' })

    useProgressStore.setState({
      ...useProgressStore.getInitialState(),
      profile: createInitialProfile('strategist'),
    })

    fetchRoomMock.mockResolvedValue(null)
    joinRoomMock.mockRejectedValue(
      new AuthorizedFetchError('Комната уже занята.', 409, 'ROOM_FULL'),
    )

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

    expect(await screen.findByText(/комната уже занята двумя игроками/i)).toBeInTheDocument()
  })

  test('redirects incomplete cloud users into onboarding while keeping the room path', async () => {
    render(
      <AuthTestProvider
        value={{
          isAuthenticated: true,
          user: createMockUser(),
          sessionMode: 'onboarding',
        }}
      >
        <MemoryRouter initialEntries={['/rooms/abcde']}>
          <Routes>
            <Route path="/rooms/:roomCode" element={<RoomPage />} />
            <Route path="/onboarding" element={<LocationProbe />} />
          </Routes>
        </MemoryRouter>
      </AuthTestProvider>,
    )

    await waitFor(() => {
      expect(
        screen.getByText('/onboarding?next=%2Frooms%2Fabcde'),
      ).toBeInTheDocument()
    })
  })
})
