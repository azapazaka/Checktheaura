import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createInitialProfile } from '../rpg/progression'
import { useProgressStore } from '../store/progress-store'
import { AuthTestProvider } from '../test/AuthTestProvider'
import { createMockUser } from '../test/auth-mocks'
import { fetchLeaderboard } from '../cloud/leaderboard-service'
import { fetchCoachHistory } from '../cloud/profile-service'
import { ProfilePage } from './ProfilePage'

vi.mock('../cloud/leaderboard-service', () => ({
  fetchLeaderboard: vi.fn(),
}))

vi.mock('../cloud/profile-service', () => ({
  fetchCoachHistory: vi.fn(),
}))

const mockedFetchLeaderboard = vi.mocked(fetchLeaderboard)
const mockedFetchCoachHistory = vi.mocked(fetchCoachHistory)

describe('ProfilePage', () => {
  beforeEach(() => {
    localStorage.clear()
    useProgressStore.setState(useProgressStore.getInitialState(), true)
    mockedFetchLeaderboard.mockReset()
    mockedFetchCoachHistory.mockReset()
  })

  test('shows progression screen with development tracks and no manual stat spending', () => {
    useProgressStore.setState({
      ...useProgressStore.getInitialState(),
      profile: {
        ...createInitialProfile('strategist'),
        dailyQuests: {
          date: '2026-05-16',
          completed: {
            playMatch: true,
            winMedium: false,
            crownKing: false,
          },
        },
      },
    })

    render(<ProfilePage />)

    expect(screen.getByTestId('profile-progression-shell')).toBeInTheDocument()
    expect(screen.getByText(/develop your hero/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /\+1/i })).not.toBeInTheDocument()
    expect(screen.getByText(/сыграй 1 матч/i)).toBeInTheDocument()
    expect(screen.getByText(/победи на medium или выше/i)).toBeInTheDocument()
  })

  test('shows global and city rank for authenticated cloud players', async () => {
    useProgressStore.setState({
      ...useProgressStore.getInitialState(),
      profile: {
        ...createInitialProfile('warrior'),
        city: 'Актау',
      },
    })

    mockedFetchCoachHistory.mockResolvedValue([])
    mockedFetchLeaderboard
      .mockResolvedValueOnce({
        entries: [],
        currentUserEntry: {
          rank: 12,
          userId: 'test-user-id',
          title: 'Test Player',
          city: 'Актау',
          wins: 6,
          level: 3,
          xp: 140,
          rankScore: 6140,
          isCurrentUser: true,
        },
        totalPlayers: 40,
      })
      .mockResolvedValueOnce({
        entries: [],
        currentUserEntry: {
          rank: 3,
          userId: 'test-user-id',
          title: 'Test Player',
          city: 'Актау',
          wins: 6,
          level: 3,
          xp: 140,
          rankScore: 6140,
          isCurrentUser: true,
        },
        totalPlayers: 8,
      })

    render(
      <AuthTestProvider
        value={{
          isAuthenticated: true,
          user: createMockUser(),
        }}
      >
        <ProfilePage />
      </AuthTestProvider>,
    )

    expect(screen.getByText(/место по казахстану/i)).toBeInTheDocument()
    expect(screen.getByText(/место в городе/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('#12')).toBeInTheDocument()
      expect(screen.getByText('#3')).toBeInTheDocument()
    })
  })
})
