import type { Difficulty } from '../game/types'
import type {
  DailyQuestCompletion,
  DailyQuestRewards,
  DailyQuestState,
  MatchXpReward,
  NewUnlocks,
  PlayerProfile,
  RpgClass,
  ThemeId,
  Unlocks,
  XpBreakdown,
} from './types'

const LEVEL_THRESHOLDS = [
  0, 100, 200, 300, 400, 500, 700, 900, 1100, 1300, 1500, 1800, 2100, 2400,
  2700, 3000, 3300, 3600, 3900, 4200, 4600, 5000, 5400, 5800, 6200, 6600,
  7000, 7400, 7800, 8200,
] as const

export const DAILY_QUEST_REWARDS: DailyQuestRewards = {
  playMatch: 100,
  winMedium: 150,
  crownKing: 80,
}

function createEmptyQuestCompletion(): DailyQuestCompletion {
  return {
    playMatch: false,
    winMedium: false,
    crownKing: false,
  }
}

export function createEmptyQuestRewards(): DailyQuestRewards {
  return {
    playMatch: 0,
    winMedium: 0,
    crownKing: 0,
  }
}

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function createDailyQuestState(date = getLocalDateKey()): DailyQuestState {
  return {
    date,
    completed: createEmptyQuestCompletion(),
  }
}

function createBaseBreakdown(): XpBreakdown {
  return {
    victory: 0,
    defeat: 0,
    captures: 0,
    king: 0,
    perfectGame: 0,
    hardDifficulty: 0,
    quickWin: 0,
    strategistBonus: 0,
    shadowHintValue: 0,
    playMatchQuest: 0,
    winMediumQuest: 0,
    crownKingQuest: 0,
  }
}

function getXpThresholdForLevel(level: number) {
  if (level <= LEVEL_THRESHOLDS.length) {
    return LEVEL_THRESHOLDS[Math.max(level - 1, 0)]
  }

  return (
    LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] +
    (level - LEVEL_THRESHOLDS.length) * 500
  )
}

function getTitle(level: number) {
  if (level >= 31) {
    return 'Хан'
  }

  if (level >= 21) {
    return 'Легенда'
  }

  if (level >= 11) {
    return 'Ветеран'
  }

  if (level >= 6) {
    return 'Дружинник'
  }

  return 'Новобранец'
}

export function getLevelFromXp(xp: number) {
  let level = 1

  for (let index = 0; index < LEVEL_THRESHOLDS.length; index += 1) {
    if (xp >= LEVEL_THRESHOLDS[index]) {
      level = index + 1
    }
  }

  if (xp >= LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]) {
    const overflow = xp - LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
    level += Math.floor(overflow / 500)
  }

  return level
}

export function getUnlocksForLevel(level: number): Unlocks {
  const themes: Unlocks['themes'] = ['default']
  const difficulties: Unlocks['difficulties'] = ['easy']

  if (level >= 3) {
    themes.push('dark')
  }

  if (level >= 5) {
    difficulties.push('medium')
  }

  if (level >= 10) {
    difficulties.push('hard')
  }

  return { themes, difficulties }
}

export function clampThemeForUnlocks(theme: ThemeId, unlocks: Unlocks): ThemeId {
  return unlocks.themes.includes(theme) ? theme : unlocks.themes[0]
}

export function clampDifficultyForUnlocks(
  difficulty: Difficulty,
  unlocks: Unlocks,
): Difficulty {
  return unlocks.difficulties.includes(difficulty)
    ? difficulty
    : unlocks.difficulties[0]
}

export function getLevelProgress(xp: number) {
  const currentLevel = getLevelFromXp(xp)
  const nextLevel = currentLevel + 1
  const currentLevelXp = getXpThresholdForLevel(currentLevel)
  const nextLevelXp = getXpThresholdForLevel(nextLevel)
  const span = Math.max(nextLevelXp - currentLevelXp, 1)
  const progressPercent = Math.max(
    0,
    Math.min(100, Math.round(((xp - currentLevelXp) / span) * 100)),
  )

  return {
    currentLevel,
    currentXp: xp,
    nextLevel,
    currentLevelXp,
    nextLevelXp,
    progressPercent,
  }
}

export function getNewUnlocks(previous: Unlocks, next: Unlocks): NewUnlocks {
  return {
    themes: next.themes.filter((theme) => !previous.themes.includes(theme)),
    difficulties: next.difficulties.filter(
      (difficulty) => !previous.difficulties.includes(difficulty),
    ),
  }
}

export function getCurrentDailyQuests(
  dailyQuests?: DailyQuestState,
  today = getLocalDateKey(),
) {
  if (!dailyQuests || dailyQuests.date !== today) {
    return createDailyQuestState(today)
  }

  return {
    date: dailyQuests.date,
    completed: {
      ...createEmptyQuestCompletion(),
      ...dailyQuests.completed,
    },
  }
}

export function resolveDailyQuestRewards({
  dailyQuests,
  outcome,
  difficulty,
  crownedKing,
  today = getLocalDateKey(),
}: {
  dailyQuests?: DailyQuestState
  outcome: 'win' | 'loss' | 'draw'
  difficulty: Difficulty
  crownedKing: boolean
  today?: string
}) {
  const nextDailyQuests = getCurrentDailyQuests(dailyQuests, today)
  const rewards = createEmptyQuestRewards()

  if (!nextDailyQuests.completed.playMatch) {
    rewards.playMatch = DAILY_QUEST_REWARDS.playMatch
    nextDailyQuests.completed.playMatch = true
  }

  if (
    outcome === 'win' &&
    difficulty !== 'easy' &&
    !nextDailyQuests.completed.winMedium
  ) {
    rewards.winMedium = DAILY_QUEST_REWARDS.winMedium
    nextDailyQuests.completed.winMedium = true
  }

  if (crownedKing && !nextDailyQuests.completed.crownKing) {
    rewards.crownKing = DAILY_QUEST_REWARDS.crownKing
    nextDailyQuests.completed.crownKing = true
  }

  return {
    dailyQuests: nextDailyQuests,
    rewards,
  }
}

export function applyQuestRewards(
  baseReward: MatchXpReward,
  questRewards: DailyQuestRewards,
): MatchXpReward {
  const breakdown: XpBreakdown = {
    ...baseReward.breakdown,
    playMatchQuest: questRewards.playMatch,
    winMediumQuest: questRewards.winMedium,
    crownKingQuest: questRewards.crownKing,
  }

  return {
    total:
      baseReward.total +
      questRewards.playMatch +
      questRewards.winMedium +
      questRewards.crownKing,
    breakdown,
  }
}

export function createInitialProfile(classId: RpgClass): PlayerProfile {
  return {
    isGuest: true,
    city: null,
    classId,
    level: 1,
    xp: 0,
    title: getTitle(1),
    stats: {
      str: 0,
      int: 0,
      agi: 0,
      lck: 0,
    },
    unspentStatPoints: 0,
    unlocks: getUnlocksForLevel(1),
    gamesPlayed: 0,
    wins: 0,
    history: [],
    dailyQuests: createDailyQuestState(),
  }
}

export function calculateMatchXp({
  outcome,
  captures,
  crownedKing,
  perfectGame,
  difficulty,
  movesPlayed,
  playerClass,
}: {
  outcome: 'win' | 'loss' | 'draw'
  captures: number
  crownedKing: boolean
  perfectGame: boolean
  difficulty: Difficulty
  movesPlayed: number
  playerClass: RpgClass
}): MatchXpReward {
  const breakdown = createBaseBreakdown()

  if (outcome === 'win') {
    breakdown.victory = 150
  } else {
    breakdown.defeat = 30
  }

  const captureValue = playerClass === 'warrior' ? 40 : 20
  breakdown.captures = captures * captureValue

  if (crownedKing) {
    breakdown.king = 50
  }

  if (perfectGame && outcome === 'win') {
    breakdown.perfectGame = 100
  }

  if (difficulty === 'hard' && outcome === 'win') {
    breakdown.hardDifficulty = 80
  }

  if (movesPlayed < 20 && outcome === 'win') {
    breakdown.quickWin = 60
  }

  if (playerClass === 'strategist' && perfectGame && outcome === 'win') {
    breakdown.strategistBonus = 100
  }

  const total = Object.values(breakdown).reduce((sum, value) => sum + value, 0)
  return { total, breakdown }
}

export function applyMatchRewards(
  profile: PlayerProfile,
  reward: MatchXpReward,
): PlayerProfile {
  const nextXp = profile.xp + reward.total
  const nextLevel = getLevelFromXp(nextXp)

  return {
    ...profile,
    xp: nextXp,
    level: nextLevel,
    title: getTitle(nextLevel),
    unspentStatPoints: Math.max(profile.unspentStatPoints, nextLevel - 1),
    unlocks: getUnlocksForLevel(nextLevel),
  }
}
