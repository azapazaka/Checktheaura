import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createInitialProfile } from '../rpg/progression'
import { useProgressStore } from '../store/progress-store'
import { AuthTestProvider } from '../test/AuthTestProvider'
import { createMockUser } from '../test/auth-mocks'
import { fetchLeaderboard } from '../cloud/leaderboard-service'
import { HomePage } from './HomePage'

vi.mock('../cloud/leaderboard-service', () => ({
  fetchLeaderboard: vi.fn(),
}))

const mockedFetchLeaderboard = vi.mocked(fetchLeaderboard)

describe('HomePage', () => {
  beforeEach(() => {
    localStorage.clear()
    useProgressStore.setState(useProgressStore.getInitialState(), true)
    mockedFetchLeaderboard.mockReset()
  })

  test('renders the dark premium lobby shell with pinned hud and the 2d hero stage', () => {
    useProgressStore.setState({
      ...useProgressStore.getInitialState(),
      profile: createInitialProfile('warrior'),
    })

    render(
      <AuthTestProvider
        value={{
          isAuthenticated: true,
          user: createMockUser(),
        }}
      >
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </AuthTestProvider>,
    )

    expect(screen.getByTestId('lobby-shell')).toBeInTheDocument()
    expect(screen.getByTestId('lobby-profile-panel')).toBeInTheDocument()
    expect(screen.getByTestId('lobby-room-panel')).toBeInTheDocument()
    expect(screen.getByTestId('lobby-stage-shell')).toBeInTheDocument()
    expect(screen.getByTestId('battle-cta')).toBeInTheDocument()
    expect(screen.queryByText(/session setup/i)).not.toBeInTheDocument()
  })

  test('opens leaderboard overlay with top-3 and highlighted current user row', async () => {
    const user = userEvent.setup()

    useProgressStore.setState({
      ...useProgressStore.getInitialState(),
      profile: {
        ...createInitialProfile('strategist'),
        city: 'Актау',
      },
    })

    mockedFetchLeaderboard.mockResolvedValue({
      entries: [
        {
          rank: 1,
          userId: 'a',
          title: 'Khan Prime',
          city: 'Алматы',
          wins: 20,
          level: 8,
          xp: 500,
          rankScore: 20500,
        },
        {
          rank: 2,
          userId: 'b',
          title: 'Nomad Ice',
          city: 'Астана',
          wins: 18,
          level: 7,
          xp: 400,
          rankScore: 18400,
        },
        {
          rank: 3,
          userId: 'c',
          title: 'Steppe Fox',
          city: 'Шымкент',
          wins: 16,
          level: 7,
          xp: 350,
          rankScore: 16350,
        },
        {
          rank: 4,
          userId: 'test-user-id',
          title: 'Test Player',
          city: 'Актау',
          wins: 12,
          level: 5,
          xp: 250,
          rankScore: 12250,
          isCurrentUser: true,
        },
      ],
      currentUserEntry: {
        rank: 4,
        userId: 'test-user-id',
        title: 'Test Player',
        city: 'Актау',
        wins: 12,
        level: 5,
        xp: 250,
        rankScore: 12250,
        isCurrentUser: true,
      },
      totalPlayers: 18,
    })

    render(
      <AuthTestProvider
        value={{
          isAuthenticated: true,
          user: createMockUser(),
        }}
      >
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </AuthTestProvider>,
    )

    await user.click(screen.getByLabelText('Open leaderboard'))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Kazakhstan Leaderboard')).toBeInTheDocument()
    expect(screen.getAllByText('Вы').length).toBeGreaterThan(0)
    expect(screen.getByText(/ваше место/i)).toBeInTheDocument()
    expect(screen.getByText(/18 игроков/i)).toBeInTheDocument()
  })

  test('sends unauthenticated players to auth from the upgrade CTA', async () => {
    const user = userEvent.setup()

    render(
      <AuthTestProvider>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<div>auth-screen</div>} />
          </Routes>
        </MemoryRouter>
      </AuthTestProvider>,
    )

    expect(screen.getByTestId('auth-cta')).toBeInTheDocument()
    await user.click(screen.getByTestId('auth-cta'))
    expect(screen.getByText('auth-screen')).toBeInTheDocument()
  })

  test('opens and closes the leaderboard overlay from the left action rail', async () => {
    const user = userEvent.setup()

    useProgressStore.setState({
      ...useProgressStore.getInitialState(),
      profile: createInitialProfile('strategist'),
    })

    mockedFetchLeaderboard.mockResolvedValue({
      entries: [],
      currentUserEntry: null,
      totalPlayers: 0,
    })

    render(
      <AuthTestProvider
        value={{
          isAuthenticated: true,
          user: createMockUser(),
        }}
      >
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </AuthTestProvider>,
    )

    await user.click(screen.getByLabelText('Open leaderboard'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Close overlay'))
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })
})
