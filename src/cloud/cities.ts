export const KAZAKHSTAN_CITIES = [
  'Алматы',
  'Астана',
  'Шымкент',
  'Актау',
  'Актобе',
  'Атырау',
  'Караганда',
  'Костанай',
  'Кызылорда',
  'Павлодар',
  'Петропавловск',
  'Семей',
  'Талдыкорган',
  'Тараз',
  'Туркестан',
  'Уральск',
  'Усть-Каменогорск',
  'Экибастуз',
] as const

export type KazakhstanCity = (typeof KAZAKHSTAN_CITIES)[number]

export const DEFAULT_CITY: KazakhstanCity = 'Алматы'
