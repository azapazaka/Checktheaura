import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, test } from 'vitest'
import { createInitialProfile } from '../rpg/progression'
import { useProgressStore } from '../store/progress-store'
import { AuthTestProvider } from '../test/AuthTestProvider'
import { createMockUser } from '../test/auth-mocks'
import { ModeSelectPage } from './ModeSelectPage'

describe('ModeSelectPage', () => {
  beforeEach(() => {
    localStorage.clear()
    useProgressStore.setState(useProgressStore.getInitialState(), true)
  })

  test('renders three distinct play mode cards', () => {
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
          <ModeSelectPage />
        </MemoryRouter>
      </AuthTestProvider>,
    )

    expect(screen.getByTestId('mode-select-shell')).toBeInTheDocument()
    expect(screen.getByTestId('mode-card-training')).toBeInTheDocument()
    expect(screen.getByTestId('mode-card-friend')).toBeInTheDocument()
    expect(screen.getByTestId('mode-card-daily')).toBeInTheDocument()
  })

  test('friend room actions are only exposed inside friend mode flow', async () => {
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
        <MemoryRouter initialEntries={['/play']}>
          <Routes>
            <Route path="/play" element={<ModeSelectPage />} />
            <Route path="/play/friend" element={<div>friend-surface</div>} />
          </Routes>
        </MemoryRouter>
      </AuthTestProvider>,
    )

    expect(screen.queryByTestId('join-room-input')).not.toBeInTheDocument()

    await user.click(screen.getByTestId('mode-cta-friend'))

    expect(screen.getByText('friend-surface')).toBeInTheDocument()
  })
})
