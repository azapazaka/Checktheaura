import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test } from 'vitest'
import { HomePage } from './HomePage'
import { useProgressStore } from '../store/progress-store'
import { createInitialProfile } from '../rpg/progression'

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
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    expect(screen.getByTestId('lobby-shell')).toBeInTheDocument()
    expect(screen.getByTestId('lobby-profile-panel')).toBeInTheDocument()
    expect(screen.getByTestId('lobby-room-panel')).toBeInTheDocument()
    expect(screen.getByTestId('lobby-stage-shell')).toBeInTheDocument()
    expect(screen.getByTestId('battle-cta')).toBeInTheDocument()
    expect(screen.queryByText(/white mode lobby/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/session setup/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/daily quests/i)).not.toBeInTheDocument()
  })

  test('opens and closes the leaderboard overlay from the left action rail', async () => {
    const user = userEvent.setup()

    useProgressStore.setState({
      ...useProgressStore.getInitialState(),
      profile: createInitialProfile('strategist'),
    })

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /открыть рейтинг/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/рейтинг казахстана/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /закрыть/i }))
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
  })
})
