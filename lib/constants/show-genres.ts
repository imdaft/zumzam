/**
 * Константы для жанров шоу-программ
 */

import { Sparkles, Wand2, Flame, Lightbulb, Newspaper, Beaker, Palette, PersonStanding, Theater, Music as MusicIcon } from 'lucide-react'

export const SHOW_GENRES = {
  bubble_show: 'Шоу мыльных пузырей',
  magic_show: 'Фокусы и иллюзии',
  fire_show: 'Огненное шоу',
  light_show: 'Световое шоу',
  paper_disco: 'Бумажная дискотека',
  chemical_show: 'Химическое шоу',
  sand_animation: 'Песочная анимация',
  acrobatics: 'Акробатика',
  mime: 'Пантомима',
  dance: 'Танцевальное шоу',
  music: 'Музыкальное выступление',
  other: 'Другое',
} as const

export type ShowGenre = keyof typeof SHOW_GENRES

export const SHOW_GENRE_ICONS: Record<ShowGenre, any> = {
  bubble_show: Sparkles,
  magic_show: Wand2,
  fire_show: Flame,
  light_show: Lightbulb,
  paper_disco: Newspaper,
  chemical_show: Beaker,
  sand_animation: Palette,
  acrobatics: PersonStanding,
  mime: Theater,
  dance: PersonStanding,
  music: MusicIcon,
  other: Sparkles,
}

export const SHOW_DURATIONS = [
  { value: 15, label: '15 минут' },
  { value: 30, label: '30 минут' },
  { value: 45, label: '45 минут' },
  { value: 60, label: '1 час' },
  { value: 90, label: '1.5 часа' },
  { value: 120, label: '2 часа' },
] as const

export const SHOW_AGE_RANGES = {
  '3-5': '3-5 лет',
  '5-10': '5-10 лет',
  '10-14': '10-14 лет',
  'adult': 'Взрослые',
  'universal': 'Любой возраст',
} as const

export type ShowAgeRange = keyof typeof SHOW_AGE_RANGES





