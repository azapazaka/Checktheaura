import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createInitialProfile } from '../rpg/progression'
import { useProgressStore } from '../store/progress-store'
import { AuthTestProvider } from '../test/AuthTestProvider'
import { createMockUser } from '../test/auth-mocks'
import { OnboardingPage } from './OnboardingPage'

describe('OnboardingPage', () => {
  beforeEach(() => {
    localStorage.clear()
    useProgressStore.setState(useProgressStore.getInitialState(), true)
  })

  test('keeps onboarding flow but uses shorter product-oriented copy', async () => {
    const user = userEvent.setup()
    const completeOnboarding = vi.fn().mockResolvedValue({ error: null })

    render(
      <AuthTestProvider
        value={{
          isAuthenticated: true,
          user: createMockUser(),
          sessionMode: 'onboarding',
          localGuestProfile: {
            ...createInitialProfile('strategist'),
            city: 'Актау',
          },
          completeOnboarding,
        }}
      >
        <MemoryRouter initialEntries={['/onboarding']}>
          <Routes>
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/" element={<div>lobby</div>} />
          </Routes>
        </MemoryRouter>
      </AuthTestProvider>,
    )

    expect(screen.getByText(/выбери путь батыра/i)).toBeInTheDocument()
    expect(screen.getByText(/закрепи свой город/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /войти в арену/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /войти в арену/i }))

    expect(completeOnboarding).toHaveBeenCalledWith({
      classId: 'warrior',
      city: 'Актау',
      importGuestProgress: false,
    })
  })
})
