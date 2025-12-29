/**
 * Константы для мастер-классов
 */

import { Palette, ChefHat, Beaker, Scissors, Brush, Box, Droplet, Flame, Sparkles, Gem, Origami as OrigamiIcon, Home, Smile } from 'lucide-react'

export const MASTER_CLASS_CATEGORIES = {
  creative: 'Творчество',
  cooking: 'Кулинария',
  science: 'Наука и эксперименты',
  handmade: 'Рукоделие',
  art: 'Рисование и живопись',
  modeling: 'Лепка и моделирование',
  slime: 'Слаймы',
  soap: 'Мыловарение',
  candles: 'Свечи',
  jewelry: 'Украшения',
  origami: 'Оригами',
  decor: 'Декор',
  cosmetics: 'Косметика',
  other: 'Другое',
} as const

export type MasterClassCategory = keyof typeof MASTER_CLASS_CATEGORIES

export const MASTER_CLASS_CATEGORY_ICONS: Record<MasterClassCategory, any> = {
  creative: Palette,
  cooking: ChefHat,
  science: Beaker,
  handmade: Scissors,
  art: Brush,
  modeling: Box,
  slime: Droplet,
  soap: Droplet,
  candles: Flame,
  jewelry: Gem,
  origami: OrigamiIcon,
  decor: Home,
  cosmetics: Smile,
  other: Sparkles,
}

export const MASTER_CLASS_DURATIONS = [
  { value: 30, label: '30 минут' },
  { value: 45, label: '45 минут' },
  { value: 60, label: '1 час' },
  { value: 90, label: '1.5 часа' },
  { value: 120, label: '2 часа' },
] as const

export const MASTER_CLASS_AGE_RANGES = {
  '3-5': '3-5 лет',
  '5-8': '5-8 лет',
  '8-12': '8-12 лет',
  '12-16': '12-16 лет',
  'adults': 'Взрослые',
} as const

export type MasterClassAgeRange = keyof typeof MASTER_CLASS_AGE_RANGES





