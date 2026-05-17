import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fetchLeaderboard } from '../cloud/leaderboard-service'
import { createInitialProfile } from '../rpg/progression'
import { useProgressStore } from '../store/progress-store'
import { AuthTestProvider } from '../test/AuthTestProvider'
import { createMockUser } from '../test/auth-mocks'
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

  test('renders the lobby shell without the old room panel', () => {
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
    expect(screen.getByTestId('lobby-hero-stage')).toBeInTheDocument()
    expect(screen.getByTestId('battle-cta')).toBeInTheDocument()
    expect(screen.queryByTestId('lobby-room-hud')).not.toBeInTheDocument()
    expect(screen.queryByText(/room code/i)).not.toBeInTheDocument()
  })

  test('opens leaderboard overlay from the command drawer and highlights the current user', async () => {
    const user = userEvent.setup()

    useProgressStore.setState({
      ...useProgressStore.getInitialState(),
      profile: {
        ...createInitialProfile('strategist'),
        city: 'Aktau',
      },
    })

    mockedFetchLeaderboard.mockResolvedValue({
      entries: [
        {
          rank: 1,
          userId: 'a',
          title: 'Khan Prime',
          city: 'Almaty',
          wins: 20,
          level: 8,
          xp: 500,
          rankScore: 20500,
        },
        {
          rank: 2,
          userId: 'b',
          title: 'Nomad Ice',
          city: 'Astana',
          wins: 18,
          level: 7,
          xp: 400,
          rankScore: 18400,
        },
        {
          rank: 3,
          userId: 'c',
          title: 'Steppe Fox',
          city: 'Shymkent',
          wins: 16,
          level: 7,
          xp: 350,
          rankScore: 16350,
        },
        {
          rank: 4,
          userId: 'test-user-id',
          title: 'Test Player',
          city: 'Aktau',
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
        city: 'Aktau',
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

    await user.click(screen.getByTestId('lobby-command-trigger'))
    expect(screen.getByTestId('lobby-command-panel')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Открыть лидерборд'))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/лидерборд казахстана/i)).toBeInTheDocument()
    expect(screen.getAllByText('Ты').length).toBeGreaterThan(0)
    expect(screen.getByText(/твоя позиция/i)).toBeInTheDocument()
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

  test('opens and closes the leaderboard overlay from the command flow', async () => {
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

    await user.click(screen.getByTestId('lobby-command-trigger'))
    await user.click(screen.getByLabelText('Открыть лидерборд'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Закрыть окно'))
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })
})
