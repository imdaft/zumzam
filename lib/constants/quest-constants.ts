/**
 * Константы для квестов
 */

import { Users, Search, Sparkles, Ghost, Rocket, Clock, Sword, Wand2, Skull, Ship, Zap } from 'lucide-react'

export const QUEST_THEMES = {
  adventure: 'Приключения',
  detective: 'Детектив',
  fantasy: 'Фантастика',
  horror: 'Ужасы (легкие)',
  sci_fi: 'Научная фантастика',
  historical: 'Исторический',
  minecraft: 'Майнкрафт',
  fairy_tale: 'Сказка',
  spy: 'Шпионский',
  pirates: 'Пираты',
  superhero: 'Супергерои',
  other: 'Другое',
} as const

export type QuestTheme = keyof typeof QUEST_THEMES

export const QUEST_THEME_ICONS: Record<QuestTheme, any> = {
  adventure: Sword,
  detective: Search,
  fantasy: Wand2,
  horror: Ghost,
  sci_fi: Rocket,
  historical: Clock,
  minecraft: Users,
  fairy_tale: Sparkles,
  spy: Users,
  pirates: Ship,
  superhero: Zap,
  other: Users,
}

export const QUEST_DIFFICULTY = {
  easy: 'Легкая (для детей 5-8 лет)',
  medium: 'Средняя (для детей 8-12 лет)',
  hard: 'Сложная (для подростков и взрослых)',
} as const

export type QuestDifficulty = keyof typeof QUEST_DIFFICULTY

export const QUEST_DURATIONS = [
  { value: 60, label: '1 час' },
  { value: 90, label: '1.5 часа' },
  { value: 120, label: '2 часа' },
  { value: 150, label: '2.5 часа' },
] as const

export const QUEST_AGE_RANGES = {
  '5-8': '5-8 лет',
  '8-12': '8-12 лет',
  '12-16': '12-16 лет',
  'adults': 'Взрослые',
} as const

export type QuestAgeRange = keyof typeof QUEST_AGE_RANGES

export const QUEST_ACTIVITY_TYPES = {
  active: 'Активный (с физическими заданиями)',
  logic: 'Логический (головоломки)',
  mixed: 'Смешанный',
} as const

export type QuestActivityType = keyof typeof QUEST_ACTIVITY_TYPES





