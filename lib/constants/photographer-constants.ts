/**
 * Константы для фотографов
 */

import { User, Users, Baby, PartyPopper, Heart, Camera, Package, Newspaper, Building2, Trees, Sparkles } from 'lucide-react'

export const PHOTOGRAPHY_STYLES = {
  portrait: 'Портретная съемка',
  family: 'Семейная съемка',
  children: 'Детская съемка',
  event: 'Событийная (праздники, корпоративы)',
  wedding: 'Свадебная',
  love_story: 'Love Story',
  product: 'Предметная/коммерческая',
  reportage: 'Репортажная',
  studio: 'Студийная съемка',
  outdoor: 'Уличная съемка',
  other: 'Другое',
} as const

export type PhotographyStyle = keyof typeof PHOTOGRAPHY_STYLES

export const PHOTOGRAPHY_STYLE_ICONS: Record<PhotographyStyle, any> = {
  portrait: User,
  family: Users,
  children: Baby,
  event: PartyPopper,
  wedding: Heart,
  love_story: Heart,
  product: Package,
  reportage: Newspaper,
  studio: Building2,
  outdoor: Trees,
  other: Camera,
}

export const PHOTO_PROCESSING_TIME = {
  express: '1-3 дня',
  standard: '5-7 дней',
  extended: '10-14 дней',
} as const

export type PhotoProcessingTime = keyof typeof PHOTO_PROCESSING_TIME

export const PHOTO_COUNT = {
  basic: '20-30 фото',
  standard: '50-70 фото',
  extended: '100+ фото',
  all: 'Все удачные кадры',
} as const

export type PhotoCount = keyof typeof PHOTO_COUNT





