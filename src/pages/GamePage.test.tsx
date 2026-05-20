import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { chooseAiMove } from '../game/ai'
import type { DailyChallengeDefinition } from '../play/types'
import { createInitialProfile } from '../rpg/progression'
import { useProgressStore } from '../store/progress-store'
import { GamePage } from './GamePage'

vi.mock('../game/ai', async () => {
  const actual = await vi.importActual<typeof import('../game/ai')>('../game/ai')
  return {
    ...actual,
    chooseAiMove: vi.fn(actual.chooseAiMove),
  }
})

vi.mock('../play/daily-challenges', async () => {
  const actual = await vi.importActual<typeof import('../play/daily-challenges')>(
    '../play/daily-challenges',
  )
  return {
    ...actual,
    getDailyChallengeById: vi.fn(actual.getDailyChallengeById),
  }
})

const mockedChooseAiMove = vi.mocked(chooseAiMove)

const chainChallenge: DailyChallengeDefinition = {
  id: 'chain-black',
  title: 'Black Chain',
  subtitle: 'Regression scenario',
  goal: 'AI must continue a forced capture chain.',
  rewardXp: 100,
  difficulty: 'medium',
  accent: 'linear-gradient(135deg, rgba(255, 185, 60, 0.28), rgba(255, 120, 36, 0.08))',
  initialGameState: {
    board: Array.from({ length: 8 }, (_, row) =>
      Array.from({ length: 8 }, (_, col) => {
        if (row === 2 && col === 1) {
          return { id: 'b1', color: 'black' as const, kind: 'man' as const }
        }

        if ((row === 3 && col === 2) || (row === 5 && col === 4)) {
          return { id: `w-${row}-${col}`, color: 'white' as const, kind: 'man' as const }
        }

        return null
      }),
    ),
    currentTurn: 'black',
    moveCountWithoutCapture: 0,
    winner: null,
    pendingPromotion: null,
    selectedPiece: null,
    forcedSequence: null,
    turn: 1,
    moves: [],
  },
}

describe('GamePage', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('checktheaura-sfx', 'off')
    useProgressStore.setState(useProgressStore.getInitialState(), true)
    mockedChooseAiMove.mockClear()
    vi.useRealTimers()
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

    expect(screen.getAllByTestId(/battle-mini-/i).length).toBeGreaterThan(0)
    expect(screen.queryByText('в—Џ')).not.toBeInTheDocument()
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

    const hintButton = screen.getByRole('button', { name: /Теневой совет/i })
    expect(hintButton).toBeEnabled()

    await user.click(hintButton)

    expect(screen.getByText(/Совет активирован/i)).toBeInTheDocument()
    expect(hintButton).toBeDisabled()
  })

  test('continues black forced capture chains without freezing the match', async () => {
    vi.useFakeTimers()

    const { getDailyChallengeById } = await import('../play/daily-challenges')
    const mockedGetDailyChallengeById = vi.mocked(getDailyChallengeById)
    mockedGetDailyChallengeById.mockImplementation((id) =>
      id === 'chain-black' ? chainChallenge : null,
    )

    useProgressStore.setState({
      ...useProgressStore.getInitialState(),
      profile: createInitialProfile('warrior'),
    })

    render(
      <MemoryRouter initialEntries={['/game?mode=daily&challenge=chain-black']}>
        <Routes>
          <Route path="/game" element={<GamePage />} />
          <Route path="/results" element={<div>results</div>} />
        </Routes>
      </MemoryRouter>,
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350)
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350)
    })

    expect(mockedChooseAiMove).toHaveBeenCalledTimes(2)
    expect(screen.getByText('results')).toBeInTheDocument()
  })
})
