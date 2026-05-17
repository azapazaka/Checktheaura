import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, test } from 'vitest'
import { createInitialProfile } from '../rpg/progression'
import { useProgressStore } from '../store/progress-store'
import { AuthTestProvider } from '../test/AuthTestProvider'
import { createMockUser } from '../test/auth-mocks'
import { UpgradePage } from './UpgradePage'

function LocationProbe() {
  const location = useLocation()
  return <div>{`${location.pathname}${location.search}`}</div>
}

describe('UpgradePage', () => {
  beforeEach(() => {
    localStorage.clear()
    useProgressStore.setState(useProgressStore.getInitialState(), true)
  })

  test('preserves the invited room route when sending the player to onboarding', async () => {
    const user = userEvent.setup()

    render(
      <AuthTestProvider
        value={{
          isAuthenticated: true,
          user: createMockUser(),
          sessionMode: 'upgrading',
          localGuestProfile: createInitialProfile('strategist'),
        }}
      >
        <MemoryRouter initialEntries={['/upgrade?next=%2Frooms%2FABCDE']}>
          <Routes>
            <Route path="/upgrade" element={<UpgradePage />} />
            <Route path="/onboarding" element={<LocationProbe />} />
          </Routes>
        </MemoryRouter>
      </AuthTestProvider>,
    )

    await user.click(screen.getByRole('button', { name: /перенести локальный прогресс/i }))

    expect(
      await screen.findByText('/onboarding?next=%2Frooms%2FABCDE'),
    ).toBeInTheDocument()
  })
})
