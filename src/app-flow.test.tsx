import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test } from 'vitest'
import App from './App'
import { useProgressStore } from './store/progress-store'
import { AuthTestProvider } from './test/AuthTestProvider'
import { createMockUser } from './test/auth-mocks'

describe('application flow', () => {
  beforeEach(() => {
    localStorage.clear()
    useProgressStore.setState(useProgressStore.getInitialState(), true)
    window.history.replaceState({}, '', '/')
  })

  test('redirects guests to auth before letting them reach protected routes', async () => {
    const user = userEvent.setup()

    render(
      <AuthTestProvider>
        <App />
      </AuthTestProvider>,
    )

    expect(screen.getByRole('heading', { name: /checktheaura/i })).toBeInTheDocument()

    await user.click(screen.getByTestId('auth-cta'))

    expect(
      await screen.findByRole('heading', { name: /войти на арену/i }),
    ).toBeInTheDocument()
  })

  test('guides an authenticated user from play mode select into training flow', async () => {
    const user = userEvent.setup()

    render(
      <AuthTestProvider
        value={{
          isAuthenticated: true,
          user: createMockUser(),
        }}
      >
        <App />
      </AuthTestProvider>,
    )

    expect(screen.getByRole('heading', { name: /checktheaura/i })).toBeInTheDocument()

    await user.click(screen.getByTestId('class-select-link'))
    expect(await screen.findByTestId('class-select-strategist')).toBeInTheDocument()

    await user.click(screen.getByTestId('class-select-strategist'))

    expect(useProgressStore.getState().profile?.classId).toBe('strategist')
    expect(screen.getByTestId('lobby-player-hud')).toBeInTheDocument()
    expect(screen.getByTestId('lobby-command-trigger')).toBeInTheDocument()
    expect(screen.getByTestId('battle-cta')).toBeInTheDocument()
    expect(screen.queryByTestId('lobby-room-hud')).not.toBeInTheDocument()

    await user.click(screen.getByTestId('battle-cta'))
    expect(await screen.findByTestId('mode-select-shell')).toBeInTheDocument()

    await user.click(screen.getByTestId('mode-cta-training'))
    expect(await screen.findByRole('heading', { name: /versus/i })).toBeInTheDocument()
    expect(screen.getByText(/автовход на боевую доску/i)).toBeInTheDocument()
  })
})
