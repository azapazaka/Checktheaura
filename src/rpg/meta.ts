import type { Difficulty, PieceColor, PieceKind } from '../game/types'
import { heroAssets, type VisibleHeroClass } from '../assets/heroes'
import type {
  DailyQuestCompletion,
  RpgClass,
  ThemeId,
  XpBreakdown,
} from './types'

export const STARTER_CLASS_IDS = ['warrior', 'strategist'] as const satisfies VisibleHeroClass[]

type ClassVisualMeta = {
  title: string
  accent: string
  perk: string
  activeBonus: string
  colorFamily: 'crimson' | 'azure' | 'shadow'
  buttonLabel: string
  assetSet: VisibleHeroClass
}

export const CLASS_META: Record<RpgClass, ClassVisualMeta> = {
  warrior: {
    title: 'Воин',
    accent: 'батыр с мечом и яростной красной аурой',
    perk: '+2x XP за взятые фигуры',
    activeBonus: 'Каждое взятие приносит удвоенный XP.',
    colorFamily: 'crimson',
    buttonLabel: 'Выбрать Воина',
    assetSet: 'warrior',
  },
  strategist: {
    title: 'Стратег',
    accent: 'батыр-лучник с холодной синей аурой контроля',
    perk: 'дополнительный бонус за идеальную партию',
    activeBonus: 'Perfect Game даёт дополнительный бонус стратегии.',
    colorFamily: 'azure',
    buttonLabel: 'Выбрать Стратега',
    assetSet: 'strategist',
  },
  shadow: {
    title: 'Теневой',
    accent: 'скрытый будущий класс',
    perk: 'одна подсказка на матч',
    activeBonus: 'Один раз за матч можно запросить лучший ход.',
    colorFamily: 'shadow',
    buttonLabel: 'Выбрать Теневого',
    assetSet: 'warrior',
  },
}

export function getVisibleStarterClasses() {
  return STARTER_CLASS_IDS.map((classId) => classId as RpgClass)
}

export function getHeroArt(classId: RpgClass) {
  const assetSet = heroAssets[CLASS_META[classId].assetSet]

  return {
    baseThin: assetSet.baseThin,
    baseThinAvatar: assetSet.baseThinAvatar,
    baseThinMini: assetSet.baseThinMini,
    full: assetSet.full,
    fullAvatar: assetSet.fullAvatar,
    fullMini: assetSet.fullMini,
  }
}

export function getCurrentHeroArt(classId: RpgClass, level: number) {
  const heroArt = getHeroArt(classId)
  return level >= 5
    ? {
        stage: 'full' as const,
        portrait: heroArt.full,
        avatar: heroArt.fullAvatar,
        mini: heroArt.fullMini,
      }
    : {
        stage: 'baseThin' as const,
        portrait: heroArt.baseThin,
        avatar: heroArt.baseThinAvatar,
        mini: heroArt.baseThinMini,
      }
}

export function getOpposingVisibleClass(classId: RpgClass): VisibleHeroClass {
  const playerVisibleClass = CLASS_META[classId].assetSet

  if (playerVisibleClass === 'warrior') {
    return 'strategist'
  }

  return 'warrior'
}

export function getBattlePiecePresentation(
  playerClass: RpgClass,
  pieceColor: PieceColor,
  pieceKind: PieceKind,
) {
  const heroClass =
    pieceColor === 'white'
      ? CLASS_META[playerClass].assetSet
      : getOpposingVisibleClass(playerClass)
  const heroArt = heroAssets[heroClass]
  const mini = pieceKind === 'king' ? heroArt.fullMini : heroArt.baseThinMini

  return {
    heroClass,
    mini,
  }
}

export const DAILY_QUEST_LABELS: Record<keyof DailyQuestCompletion, string> = {
  playMatch: 'Сыграй 1 матч',
  winMedium: 'Победи на Medium или выше',
  crownKing: 'Сделай дамку',
}

export const DAILY_QUEST_DESCRIPTIONS: Record<keyof DailyQuestCompletion, string> = {
  playMatch: '+100 XP за завершение тренировочного цикла.',
  winMedium: '+150 XP за победу на повышенной сложности.',
  crownKing: '+80 XP за переход в дамки.',
}

export function getThemeLabel(theme: ThemeId) {
  return theme === 'dark' ? 'Dark Theme' : 'Default Theme'
}

export function getDifficultyLabel(difficulty: Difficulty) {
  return `${difficulty[0].toUpperCase()}${difficulty.slice(1)} AI`
}

export const XP_BREAKDOWN_LABELS: Record<keyof XpBreakdown, string> = {
  victory: 'Победа',
  defeat: 'Опыт за попытку',
  captures: 'Взятые фигуры',
  king: 'Дамка',
  perfectGame: 'Perfect Game',
  hardDifficulty: 'Hard bonus',
  quickWin: 'Быстрая победа',
  strategistBonus: 'Бонус стратега',
  shadowHintValue: 'Подсказка Shadow',
  playMatchQuest: 'Квест: сыграй матч',
  winMediumQuest: 'Квест: Medium или выше',
  crownKingQuest: 'Квест: сделай дамку',
}
