import {
  clampDifficultyForUnlocks,
  clampThemeForUnlocks,
  applyMatchRewards,
  calculateMatchXp,
  createInitialProfile,
  getLevelProgress,
  getUnlocksForLevel,
} from './progression'

describe('RPG progression', () => {
  test('creates a fresh profile with a chosen class', () => {
    const profile = createInitialProfile('warrior')

    expect(profile.classId).toBe('warrior')
    expect(profile.level).toBe(1)
    expect(profile.xp).toBe(0)
  })

  test('calculates XP for a strong winning game', () => {
    const xp = calculateMatchXp({
      outcome: 'win',
      captures: 4,
      crownedKing: true,
      perfectGame: true,
      difficulty: 'hard',
      movesPlayed: 18,
      playerClass: 'warrior',
    })

    expect(xp.total).toBe(600)
    expect(xp.breakdown.victory).toBe(150)
    expect(xp.breakdown.captures).toBe(160)
    expect(xp.breakdown.king).toBe(50)
    expect(xp.breakdown.perfectGame).toBe(100)
    expect(xp.breakdown.hardDifficulty).toBe(80)
    expect(xp.breakdown.quickWin).toBe(60)
  })

  test('unlocks dark theme and medium AI by level thresholds', () => {
    expect(getUnlocksForLevel(1)).toEqual({
      themes: ['default'],
      difficulties: ['easy'],
    })

    expect(getUnlocksForLevel(5)).toEqual({
      themes: ['default', 'dark'],
      difficulties: ['easy', 'medium'],
    })
  })

  test('clamps theme and difficulty to unlocked values', () => {
    const levelOneUnlocks = getUnlocksForLevel(1)

    expect(clampThemeForUnlocks('dark', levelOneUnlocks)).toBe('default')
    expect(clampDifficultyForUnlocks('hard', levelOneUnlocks)).toBe('easy')

    const levelTenUnlocks = getUnlocksForLevel(10)
    expect(clampThemeForUnlocks('dark', levelTenUnlocks)).toBe('dark')
    expect(clampDifficultyForUnlocks('hard', levelTenUnlocks)).toBe('hard')
  })

  test('applies match rewards and levels the player up', () => {
    const profile = createInitialProfile('strategist')
    const updated = applyMatchRewards(profile, {
      total: 620,
      breakdown: {
        victory: 150,
        defeat: 0,
        captures: 120,
        king: 50,
        perfectGame: 100,
        hardDifficulty: 80,
        quickWin: 60,
        strategistBonus: 100,
        shadowHintValue: 0,
        playMatchQuest: 0,
        winMediumQuest: 0,
        crownKingQuest: 0,
      },
    })

    expect(updated.xp).toBe(620)
    expect(updated.level).toBeGreaterThan(1)
    expect(updated.unspentStatPoints).toBe(updated.level - 1)
  })

  test('reports progress within the current level band', () => {
    expect(getLevelProgress(0)).toEqual({
      currentLevel: 1,
      currentXp: 0,
      nextLevel: 2,
      currentLevelXp: 0,
      nextLevelXp: 100,
      progressPercent: 0,
    })

    expect(getLevelProgress(150)).toEqual({
      currentLevel: 2,
      currentXp: 150,
      nextLevel: 3,
      currentLevelXp: 100,
      nextLevelXp: 200,
      progressPercent: 50,
    })
  })
})
