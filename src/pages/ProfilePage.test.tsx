import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, test } from 'vitest'
import { ProfilePage } from './ProfilePage'
import { useProgressStore } from '../store/progress-store'
import { createInitialProfile } from '../rpg/progression'

describe('ProfilePage', () => {
  beforeEach(() => {
    localStorage.clear()
    useProgressStore.setState(useProgressStore.getInitialState(), true)
  })

  test('shows progression screen with development tracks and no manual stat spending', () => {
    useProgressStore.setState({
      ...useProgressStore.getInitialState(),
      profile: {
        ...createInitialProfile('strategist'),
        dailyQuests: {
          date: '2026-05-16',
          completed: {
            playMatch: true,
            winMedium: false,
            crownKing: false,
          },
        },
      },
    })

    render(<ProfilePage />)

    expect(screen.getByTestId('profile-progression-shell')).toBeInTheDocument()
    expect(screen.getByText(/develop your hero/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /\+1/i })).not.toBeInTheDocument()
    expect(screen.getByText(/сыграй 1 матч/i)).toBeInTheDocument()
    expect(screen.getByText(/победи на medium или выше/i)).toBeInTheDocument()
  })
})
