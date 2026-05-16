import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { GamePage } from './GamePage'
import { useProgressStore } from '../store/progress-store'
import { createInitialProfile } from '../rpg/progression'

describe('GamePage', () => {
  beforeEach(() => {
    localStorage.clear()
    useProgressStore.setState(useProgressStore.getInitialState(), true)
  })

  test('renders hero miniatures on the board instead of abstract piece chips', () => {
    const profile = createInitialProfile('warrior')

    useProgressStore.setState({
      ...useProgressStore.getInitialState(),
      profile,
    })

    render(
      <MemoryRouter initialEntries={['/game']}>
        <Routes>
          <Route path="/game" element={<GamePage />} />
          <Route path="/results" element={<div>results</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(
      screen.getAllByTestId(/battle-mini-/i).length,
    ).toBeGreaterThan(0)
    expect(screen.queryByText('●')).not.toBeInTheDocument()
  })

  test('lets shadow class use exactly one hint per match', async () => {
    const user = userEvent.setup()
    const profile = createInitialProfile('shadow')

    useProgressStore.setState({
      ...useProgressStore.getInitialState(),
      profile,
    })

    render(
      <MemoryRouter initialEntries={['/game']}>
        <Routes>
          <Route path="/game" element={<GamePage />} />
          <Route path="/results" element={<div>results</div>} />
        </Routes>
      </MemoryRouter>,
    )

    const hintButton = screen.getByRole('button', { name: /теневой совет/i })
    expect(hintButton).toBeEnabled()

    await user.click(hintButton)

    expect(screen.getByText(/совет активирован/i)).toBeInTheDocument()
    expect(hintButton).toBeDisabled()
  })
})
