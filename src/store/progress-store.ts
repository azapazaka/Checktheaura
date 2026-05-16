import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameOutcome, MatchMove } from '../game/types'
import {
  applyMatchRewards,
  applyQuestRewards,
  clampDifficultyForUnlocks,
  clampThemeForUnlocks,
  createEmptyQuestRewards,
  createInitialProfile,
  getCurrentDailyQuests,
  getLevelFromXp,
  getNewUnlocks,
  getUnlocksForLevel,
  resolveDailyQuestRewards,
} from '../rpg/progression'
import type {
  DailyQuestRewards,
  MatchSummary,
  MatchXpReward,
  NewUnlocks,
  PlayerProfile,
  RpgClass,
  StoredSettings,
} from '../rpg/types'

export type LatestResult = MatchSummary & {
  moves: MatchMove[]
  xpSummary: MatchXpReward
  result: GameOutcome
}

type ProgressState = {
  profile: PlayerProfile | null
  settings: StoredSettings
  lastResult: LatestResult | null
  selectClass: (classId: RpgClass) => void
  setTheme: (theme: StoredSettings['preferredTheme']) => void
  setDifficulty: (difficulty: StoredSettings['preferredDifficulty']) => void
  finishMatch: (result: LatestResult) => void
  allocateStatPoint: (stat: keyof PlayerProfile['stats']) => void
  resetProgress: () => void
}

const defaultSettings: StoredSettings = {
  preferredTheme: 'default',
  preferredDifficulty: 'easy',
}

const initialState = {
  profile: null as PlayerProfile | null,
  settings: defaultSettings,
  lastResult: null as LatestResult | null,
}

function normalizeNewUnlocks(value?: Partial<NewUnlocks>): NewUnlocks {
  return {
    themes: value?.themes ?? [],
    difficulties: value?.difficulties ?? [],
  }
}

function normalizeDailyQuestRewards(
  value?: Partial<DailyQuestRewards>,
): DailyQuestRewards {
  return {
    ...createEmptyQuestRewards(),
    ...value,
  }
}

function normalizeXpSummary(value: MatchXpReward): MatchXpReward {
  return {
    total: value.total,
    breakdown: {
      ...value.breakdown,
      playMatchQuest: value.breakdown.playMatchQuest ?? 0,
      winMediumQuest: value.breakdown.winMediumQuest ?? 0,
      crownKingQuest: value.breakdown.crownKingQuest ?? 0,
    },
  }
}

function normalizeMatchSummary(match: MatchSummary): MatchSummary {
  return {
    ...match,
    usedShadowHint: match.usedShadowHint ?? false,
    newUnlocks: normalizeNewUnlocks(match.newUnlocks),
    dailyQuestRewards: normalizeDailyQuestRewards(match.dailyQuestRewards),
  }
}

function normalizeProfile(profile: PlayerProfile | null): PlayerProfile | null {
  if (!profile) {
    return null
  }

  const safeLevel = profile.level ?? getLevelFromXp(profile.xp ?? 0)
  const base = createInitialProfile(profile.classId)

  return {
    ...base,
    ...profile,
    level: safeLevel,
    title: profile.title ?? base.title,
    stats: {
      ...base.stats,
      ...profile.stats,
    },
    unlocks: getUnlocksForLevel(safeLevel),
    history: (profile.history ?? []).map(normalizeMatchSummary),
    dailyQuests: getCurrentDailyQuests(profile.dailyQuests),
  }
}

function normalizeLastResult(lastResult: LatestResult | null): LatestResult | null {
  if (!lastResult) {
    return null
  }

  return {
    ...normalizeMatchSummary(lastResult),
    moves: lastResult.moves ?? [],
    xpSummary: normalizeXpSummary(lastResult.xpSummary),
    result: lastResult.result,
  }
}

function clampSettings(settings: StoredSettings, profile: PlayerProfile | null) {
  const unlocks = profile?.unlocks ?? getUnlocksForLevel(1)

  return {
    preferredTheme: clampThemeForUnlocks(settings.preferredTheme, unlocks),
    preferredDifficulty: clampDifficultyForUnlocks(
      settings.preferredDifficulty,
      unlocks,
    ),
  }
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      ...initialState,
      selectClass: (classId) =>
        set((state) => {
          const profile = createInitialProfile(classId)
          return {
            profile,
            settings: clampSettings(state.settings, profile),
            lastResult: null,
          }
        }),
      setTheme: (theme) =>
        set((state) => ({
          settings: {
            ...state.settings,
            preferredTheme: clampThemeForUnlocks(
              theme,
              state.profile?.unlocks ?? getUnlocksForLevel(1),
            ),
          },
        })),
      setDifficulty: (difficulty) =>
        set((state) => ({
          settings: {
            ...state.settings,
            preferredDifficulty: clampDifficultyForUnlocks(
              difficulty,
              state.profile?.unlocks ?? getUnlocksForLevel(1),
            ),
          },
        })),
      finishMatch: (result) =>
        set((state) => {
          if (!state.profile) {
            return state
          }

          const { dailyQuests, rewards } = resolveDailyQuestRewards({
            dailyQuests: state.profile.dailyQuests,
            outcome: result.outcome,
            difficulty: result.difficulty,
            crownedKing: result.xpSummary.breakdown.king > 0,
          })
          const xpSummary = applyQuestRewards(result.xpSummary, rewards)
          const enrichedResult: LatestResult = {
            ...result,
            xpEarned: xpSummary.total,
            xpSummary,
            dailyQuestRewards: rewards,
          }
          const rewardedProfile = applyMatchRewards(state.profile, xpSummary)
          const updatedProfile = {
            ...rewardedProfile,
            dailyQuests,
          }
          const newUnlocks = getNewUnlocks(
            state.profile.unlocks,
            updatedProfile.unlocks,
          )
          const entry: MatchSummary = {
            id: enrichedResult.id,
            outcome: enrichedResult.outcome,
            xpEarned: enrichedResult.xpEarned,
            playedAt: enrichedResult.playedAt,
            difficulty: enrichedResult.difficulty,
            usedShadowHint: enrichedResult.usedShadowHint,
            newUnlocks,
            dailyQuestRewards: enrichedResult.dailyQuestRewards,
          }
          const finalizedResult = {
            ...enrichedResult,
            newUnlocks,
          }
          const nextProfile = {
            ...updatedProfile,
            gamesPlayed: updatedProfile.gamesPlayed + 1,
            wins:
              updatedProfile.wins + (enrichedResult.outcome === 'win' ? 1 : 0),
            history: [entry, ...updatedProfile.history].slice(0, 10),
          }

          return {
            profile: nextProfile,
            settings: clampSettings(state.settings, nextProfile),
            lastResult: finalizedResult,
          }
        }),
      allocateStatPoint: (stat) =>
        set((state) => {
          if (!state.profile || state.profile.unspentStatPoints <= 0) {
            return state
          }

          return {
            profile: {
              ...state.profile,
              unspentStatPoints: state.profile.unspentStatPoints - 1,
              stats: {
                ...state.profile.stats,
                [stat]: state.profile.stats[stat] + 1,
              },
            },
          }
        }),
      resetProgress: () =>
        set({
          ...initialState,
        }),
    }),
    {
      name: 'checktheaura-progress',
      partialize: (state) => ({
        profile: state.profile,
        settings: state.settings,
        lastResult: state.lastResult,
      }),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState as Partial<ProgressState>) ?? {}
        const profile = normalizeProfile(persisted.profile ?? currentState.profile)
        const settings = clampSettings(
          {
            ...currentState.settings,
            ...persisted.settings,
          },
          profile,
        )

        return {
          ...currentState,
          ...persisted,
          profile,
          settings,
          lastResult: normalizeLastResult(persisted.lastResult ?? null),
        }
      },
    },
  ),
)
