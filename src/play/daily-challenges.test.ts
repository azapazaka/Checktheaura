import { describe, expect, test } from 'vitest'
import {
  DAILY_CHALLENGES,
  getDailyChallengeById,
  getDailyChallengeForDate,
} from './daily-challenges'

describe('daily challenges', () => {
  test('maps the same date to the same challenge', () => {
    const first = getDailyChallengeForDate('2026-05-17')
    const second = getDailyChallengeForDate('2026-05-17')

    expect(first.id).toBe(second.id)
  })

  test('resolves a challenge by id', () => {
    const challenge = DAILY_CHALLENGES[0]

    expect(getDailyChallengeById(challenge.id)?.title).toBe(challenge.title)
  })
})
