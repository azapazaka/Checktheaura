import { act, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ResultsPage } from './ResultsPage'
import type { PlayerProfile } from '../rpg/types'
import { useProgressStore } from '../store/progress-store'
import { createInitialProfile } from '../rpg/progression'
import { AuthTestProvider } from '../test/AuthTestProvider'

const persistCloudMatchMock = vi.fn()
const persistCoachAnalysisMock = vi.fn()

vi.mock('../cloud/match-service', () => ({
  persistCloudMatch: (...args: unknown[]) => persistCloudMatchMock(...args),
  persistCoachAnalysis: (...args: unknown[]) => persistCoachAnalysisMock(...args),
}))

function createDeferred<T>() {
  let resolvePromise!: (value: T) => void
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve
  })

  return {
    promise,
    resolve: resolvePromise,
  }
}

describe('ResultsPage', () => {
  beforeEach(() => {
    localStorage.clear()
    useProgressStore.setState(useProgressStore.getInitialState(), true)
    vi.restoreAllMocks()
    persistCloudMatchMock.mockReset()
    persistCoachAnalysisMock.mockReset()
  })

  test('shows progress, unlocks, quest rewards, and coach section', () => {
    const profile: PlayerProfile = {
      ...createInitialProfile('shadow'),
      xp: 620,
      level: 6,
      title: 'Druzhinnik',
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

    expect(screen.getByText(/medium ai/i)).toBeInTheDocument()
    expect(screen.getByText(/dark theme/i)).toBeInTheDocument()
    expect(screen.getByText(/\+100 xp/i)).toBeInTheDocument()
    expect(screen.getByText(/ai coach/i)).toBeInTheDocument()
  })

  test('saves coach analysis at most once per match while a save is in flight', async () => {
    const profile: PlayerProfile = {
      ...createInitialProfile('shadow'),
      xp: 620,
      level: 6,
      title: 'Druzhinnik',
      unlocks: {
        themes: ['default', 'dark'],
        difficulties: ['easy', 'medium'],
      },
      history: [
        {
          id: 'match-1',
          matchId: '11111111-1111-4111-8111-111111111111',
          outcome: 'win',
          xpEarned: 400,
          playedAt: '2026-05-16T10:00:00.000Z',
          difficulty: 'medium',
          usedShadowHint: false,
          newUnlocks: {
            themes: [],
            difficulties: [],
          },
          dailyQuestRewards: {
            playMatch: 0,
            winMedium: 0,
            crownKing: 0,
          },
          analysisStatus: 'pending',
        },
      ],
    }

    useProgressStore.setState({
      ...useProgressStore.getInitialState(),
      profile,
      lastResult: {
        id: 'match-1',
        matchId: '11111111-1111-4111-8111-111111111111',
        outcome: 'win',
        xpEarned: 400,
        playedAt: '2026-05-16T10:00:00.000Z',
        difficulty: 'medium',
        moves: [
          {
            from: { row: 5, col: 0 },
            to: { row: 4, col: 1 },
            captured: [],
            turn: 1,
            player: 'white',
            pieceId: 'white-1',
            promoted: false,
          },
        ],
        usedShadowHint: false,
        newUnlocks: {
          themes: [],
          difficulties: [],
        },
        dailyQuestRewards: {
          playMatch: 0,
          winMedium: 0,
          crownKing: 0,
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
            playMatchQuest: 0,
            winMediumQuest: 0,
            crownKingQuest: 0,
          },
        },
        result: {
          winner: 'white',
          reason: 'captured-all',
        },
        analysisStatus: 'pending',
      },
    })

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          score: 8.7,
          highlights: ['Strong tempo'],
          mistakes: [],
          tip: 'Keep control of the center.',
        }),
      }),
    )

    const coachSaveDeferred = createDeferred<{
      analysis: {
        id: string
        match_id: string
        user_id: string
        score: number
        highlights: string[]
        mistakes: never[]
        tip: string
        source: 'live'
        status: 'ready'
        created_at: string
        updated_at: string
      }
    }>()
    persistCoachAnalysisMock.mockImplementation(
      () => coachSaveDeferred.promise,
    )

    render(
      <AuthTestProvider value={{ isAuthenticated: true }}>
        <MemoryRouter>
          <ResultsPage />
        </MemoryRouter>
      </AuthTestProvider>,
    )

    await waitFor(() => {
      expect(persistCoachAnalysisMock).toHaveBeenCalledTimes(1)
    })

    act(() => {
      useProgressStore.getState().hydrateHistory([
        {
          id: 'match-1',
          matchId: '11111111-1111-4111-8111-111111111111',
          outcome: 'win',
          xpEarned: 400,
          playedAt: '2026-05-16T10:00:00.000Z',
          difficulty: 'medium',
          usedShadowHint: false,
          newUnlocks: {
            themes: [],
            difficulties: [],
          },
          dailyQuestRewards: {
            playMatch: 0,
            winMedium: 0,
            crownKing: 0,
          },
          analysisStatus: 'pending',
        },
      ])
    })

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(persistCoachAnalysisMock).toHaveBeenCalledTimes(1)

    coachSaveDeferred.resolve({
      analysis: {
        id: 'analysis-1',
        match_id: '11111111-1111-4111-8111-111111111111',
        user_id: 'user-1',
        score: 9,
        highlights: ['Strong tempo'],
        mistakes: [],
        tip: 'Keep control of the center.',
        source: 'live',
        status: 'ready',
        created_at: '2026-05-20T00:00:00.000Z',
        updated_at: '2026-05-20T00:00:00.000Z',
      },
    })

    await waitFor(() => {
      expect(
        useProgressStore.getState().lastResult?.coachAnalysisId,
      ).toBe('analysis-1')
    })

    expect(persistCloudMatchMock).not.toHaveBeenCalled()
  })
})
