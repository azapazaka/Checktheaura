import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, test } from 'vitest'
import { createInitialProfile } from '../rpg/progression'
import { useProgressStore } from '../store/progress-store'
import { AuthTestProvider } from '../test/AuthTestProvider'
import { createMockUser } from '../test/auth-mocks'
import { HomePage } from './HomePage'

describe('HomePage', () => {
  beforeEach(() => {
    localStorage.clear()
    useProgressStore.setState(useProgressStore.getInitialState(), true)
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

  test('opens and closes the leaderboard overlay from the left action rail', async () => {
    const user = userEvent.setup()

    useProgressStore.setState({
      ...useProgressStore.getInitialState(),
      profile: createInitialProfile('strategist'),
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
})
