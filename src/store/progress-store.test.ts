import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { useProgressStore } from './progress-store'

describe('progress store', () => {
  beforeEach(() => {
    localStorage.clear()
    useProgressStore.setState(useProgressStore.getInitialState(), true)
    vi.useRealTimers()
  })

  test('selects a class and creates a fresh profile', () => {
    const { result } = renderHook(() => useProgressStore())

    act(() => {
      result.current.selectClass('shadow')
    })

    expect(result.current.profile?.classId).toBe('shadow')
    expect(result.current.profile?.level).toBe(1)
  })

  test('stores preferred theme and difficulty only when they are unlocked', () => {
    const { result } = renderHook(() => useProgressStore())

    act(() => {
      result.current.selectClass('warrior')
      result.current.setTheme('dark')
      result.current.setDifficulty('medium')
    })

    expect(result.current.settings.preferredTheme).toBe('default')
    expect(result.current.settings.preferredDifficulty).toBe('easy')

    act(() => {
      result.current.finishMatch({
        id: 'level-up',
        outcome: 'win',
        xpEarned: 700,
        playedAt: '2026-05-16T00:00:00.000Z',
        difficulty: 'easy',
        moves: [],
        usedShadowHint: false,
        newUnlocks: {
          themes: ['dark'],
          difficulties: ['medium'],
        },
        dailyQuestRewards: {
          playMatch: 100,
          winMedium: 0,
          crownKing: 0,
        },
        xpSummary: {
          total: 700,
          breakdown: {
            victory: 150,
            defeat: 0,
            captures: 400,
            king: 50,
            perfectGame: 0,
            hardDifficulty: 0,
            quickWin: 0,
            strategistBonus: 0,
            shadowHintValue: 0,
            playMatchQuest: 100,
            winMediumQuest: 0,
            crownKingQuest: 0,
          },
        },
        result: {
          winner: 'white',
          reason: 'captured-all',
        },
      })
      result.current.setTheme('dark')
      result.current.setDifficulty('medium')
    })

    expect(result.current.settings.preferredTheme).toBe('dark')
    expect(result.current.settings.preferredDifficulty).toBe('medium')
  })

  test('applies match rewards and remembers the latest result', () => {
    const { result } = renderHook(() => useProgressStore())

    act(() => {
      result.current.selectClass('warrior')
      result.current.finishMatch({
        id: 'match-1',
        outcome: 'win',
        xpEarned: 600,
        playedAt: '2026-05-16T00:00:00.000Z',
        difficulty: 'hard',
        moves: [],
        usedShadowHint: false,
        newUnlocks: {
          themes: ['dark'],
          difficulties: ['medium', 'hard'],
        },
        dailyQuestRewards: {
          playMatch: 100,
          winMedium: 150,
          crownKing: 80,
        },
        xpSummary: {
          total: 600,
          breakdown: {
            victory: 150,
            defeat: 0,
            captures: 160,
            king: 50,
            perfectGame: 100,
            hardDifficulty: 80,
            quickWin: 60,
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
      })
    })

    expect(result.current.profile?.xp).toBe(930)
    expect(result.current.lastResult?.id).toBe('match-1')
    expect(result.current.profile?.history).toHaveLength(1)
  })

  test('awards daily quest bonuses only once per local day', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-16T10:00:00'))

    const { result } = renderHook(() => useProgressStore())

    act(() => {
      result.current.selectClass('shadow')
      result.current.finishMatch({
        id: 'match-1',
        outcome: 'win',
        xpEarned: 400,
        playedAt: '2026-05-16T10:00:00.000Z',
        difficulty: 'medium',
        moves: [],
        usedShadowHint: true,
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
      })
    })

    expect(result.current.lastResult?.dailyQuestRewards).toEqual({
      playMatch: 100,
      winMedium: 150,
      crownKing: 80,
    })
    expect(result.current.profile?.dailyQuests.completed).toEqual({
      playMatch: true,
      winMedium: true,
      crownKing: true,
    })

    act(() => {
      result.current.finishMatch({
        id: 'match-2',
        outcome: 'win',
        xpEarned: 200,
        playedAt: '2026-05-16T11:00:00.000Z',
        difficulty: 'medium',
        moves: [],
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
          total: 200,
          breakdown: {
            victory: 150,
            defeat: 0,
            captures: 20,
            king: 0,
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
      })
    })

    expect(result.current.lastResult?.dailyQuestRewards).toEqual({
      playMatch: 0,
      winMedium: 0,
      crownKing: 0,
    })
  })
})
