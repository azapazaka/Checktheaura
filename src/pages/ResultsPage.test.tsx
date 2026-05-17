import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ResultsPage } from './ResultsPage'
import type { PlayerProfile } from '../rpg/types'
import { useProgressStore } from '../store/progress-store'
import { createInitialProfile } from '../rpg/progression'

describe('ResultsPage', () => {
  beforeEach(() => {
    localStorage.clear()
    useProgressStore.setState(useProgressStore.getInitialState(), true)
    vi.restoreAllMocks()
  })

  test('shows progress, unlocks, quest rewards, and coach section', () => {
    const profile: PlayerProfile = {
      ...createInitialProfile('shadow'),
      xp: 620,
      level: 6,
      title: 'Дружинник',
      unlocks: {
        themes: ['default', 'dark'],
        difficulties: ['easy', 'medium'],
      },
    }

    useProgressStore.setState({
      ...useProgressStore.getInitialState(),
      profile,
      lastResult: {
        id: 'match-1',
        outcome: 'win',
        xpEarned: 400,
        playedAt: '2026-05-16T10:00:00.000Z',
        difficulty: 'medium',
        moves: [],
        usedShadowHint: true,
        newUnlocks: {
          themes: ['dark'],
          difficulties: ['medium'],
        },
        dailyQuestRewards: {
          playMatch: 100,
          winMedium: 150,
          crownKing: 80,
        },
        xpSummary: {
          total: 400,
          breakdown: {
            victory: 150,
            defeat: 0,
            captures: 20,
            king: 50,
            perfectGame: 0,
            hardDifficulty: 0,
            quickWin: 0,
            strategistBonus: 0,
            shadowHintValue: 0,
            playMatchQuest: 100,
            winMediumQuest: 150,
            crownKingQuest: 80,
          },
        },
        result: {
          winner: 'white',
          reason: 'captured-all',
        },
      },
    })

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))

    render(
      <MemoryRouter>
        <ResultsPage />
      </MemoryRouter>,
    )

    expect(screen.getByText(/прогресс до следующего уровня/i)).toBeInTheDocument()
    expect(screen.getByText(/новые разблокировки/i)).toBeInTheDocument()
    expect(screen.getByText(/medium ai/i)).toBeInTheDocument()
    expect(screen.getByText(/dark theme/i)).toBeInTheDocument()
    expect(screen.getByText(/\+100 xp/i)).toBeInTheDocument()
    expect(
      screen.getByText(/матч сыгран с подсказкой shadow/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/ai coach/i)).toBeInTheDocument()
    expect(screen.getByText(/разбор партии/i)).toBeInTheDocument()
  })
})
