import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test } from 'vitest'
import App from './App'
import { useProgressStore } from './store/progress-store'

describe('application flow', () => {
  beforeEach(() => {
    localStorage.clear()
    useProgressStore.setState(useProgressStore.getInitialState(), true)
    window.history.replaceState({}, '', '/')
  })

  test('guides the user from class selection into the dark premium lobby and battle flow', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole('heading', { name: /checktheaura/i })).toBeInTheDocument()

    await user.click(screen.getByTestId('class-select-link'))

    expect(
      screen.getByRole('heading', { name: /выберите архетип/i }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /стратег/i }))

    expect(useProgressStore.getState().profile?.classId).toBe('strategist')
    expect(screen.getByTestId('lobby-profile-panel')).toBeInTheDocument()
    expect(screen.getByTestId('lobby-room-panel')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /играть/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /играть/i }))

    expect(
      await screen.findByRole('heading', { name: /versus/i }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: /battle board/i }),
    ).toBeInTheDocument()
  })
})
