/**
 * Конфигурация доступных шаблонов для каждой секции профиля
 * Здесь определяется какие варианты отображения доступны для каждой секции
 */

import { LayoutGrid, LayoutList, Sparkles, ImageIcon, Grid3x3, SlidersHorizontal, List, Table, MapPin, SplitSquareHorizontal } from 'lucide-react'
import type { SectionTemplateConfig, AboutTemplateId, PortfolioTemplateId, ServicesTemplateId, CharactersTemplateId, TurnkeyTemplateId, ContactsTemplateId } from '@/lib/types/templates'

// Конфигурация шаблонов для секции "О нас"
export const ABOUT_SECTION_TEMPLATES: SectionTemplateConfig = {
  sectionId: 'about',
  sectionName: 'О нас',
  defaultTemplate: 'classic',
  templates: [
    {
      id: 'classic' as AboutTemplateId,
      name: 'Классический',
      description: 'Обложка сверху, название и описание внизу. Традиционный формат.',
      icon: LayoutList,
    },
    {
      id: 'modern' as AboutTemplateId,
      name: 'Современный',
      description: 'Обложка слева, контент справа. Подходит для ярких фото.',
      icon: LayoutGrid,
    },
    {
      id: 'minimal' as AboutTemplateId,
      name: 'Минималистичный',
      description: 'Обложка на фоне с градиентом. Лаконичный и стильный.',
      icon: Sparkles,
    },
  ],
}

// Конфигурация шаблонов для секции "Фото и видео"
export const PORTFOLIO_SECTION_TEMPLATES: SectionTemplateConfig = {
  sectionId: 'portfolio',
  sectionName: 'Фото и видео',
  defaultTemplate: 'variant1',
  templates: [
    {
      id: 'variant1' as PortfolioTemplateId,
      name: 'Вариант 1',
      description: 'Классическая сетка с разными размерами (masonry)',
      icon: LayoutGrid,
    },
    {
      id: 'variant2' as PortfolioTemplateId,
      name: 'Вариант 2',
      description: 'Горизонтальная карусель с крупными превью',
      icon: SlidersHorizontal,
    },
    {
      id: 'variant3' as PortfolioTemplateId,
      name: 'Вариант 3',
      description: 'Компактная плитка одинакового размера',
      icon: Grid3x3,
    },
  ],
}

// Конфигурация шаблонов для секции "Услуги" (программы, доп.услуги)
export const SERVICES_SECTION_TEMPLATES: SectionTemplateConfig = {
  sectionId: 'services',
  sectionName: 'Услуги',
  defaultTemplate: 'list',
  templates: [
    {
      id: 'list' as ServicesTemplateId,
      name: 'Вариант 1',
      description: 'Две колонки с крупными карточками',
      icon: LayoutGrid,
    },
    {
      id: 'table' as ServicesTemplateId,
      name: 'Вариант 2',
      description: 'Компактный список (аккордеон)',
      icon: List,
    },
    {
      id: 'cards' as ServicesTemplateId,
      name: 'Вариант 3',
      description: 'Одна колонка с детальными карточками',
      icon: Table,
    },
  ],
}

// Конфигурация шаблонов для секции "Персонажи"
export const CHARACTERS_SECTION_TEMPLATES: SectionTemplateConfig = {
  sectionId: 'characters',
  sectionName: 'Персонажи и программы',
  defaultTemplate: 'standard',
  templates: [
    {
      id: 'standard' as CharactersTemplateId,
      name: 'Вариант 1',
      description: 'Галерея с фото слева и описанием справа',
      icon: LayoutGrid,
    },
    {
      id: 'compact' as CharactersTemplateId,
      name: 'Вариант 2',
      description: 'Компактный список (аккордеон)',
      icon: List,
    },
    {
      id: 'large' as CharactersTemplateId,
      name: 'Вариант 3',
      description: 'Крупные карточки в одну колонку',
      icon: Table,
    },
  ],
}

// Конфигурация шаблонов для секции "Праздник под ключ"
export const TURNKEY_SECTION_TEMPLATES: SectionTemplateConfig = {
  sectionId: 'turnkey',
  sectionName: 'Праздник под ключ',
  defaultTemplate: 'standard',
  templates: [
    {
      id: 'standard' as TurnkeyTemplateId,
      name: 'Вариант 1',
      description: 'Стандартное отображение с подробностями',
      icon: LayoutGrid,
    },
    {
      id: 'compact' as TurnkeyTemplateId,
      name: 'Вариант 2',
      description: 'Компактный список',
      icon: List,
    },
    {
      id: 'large' as TurnkeyTemplateId,
      name: 'Вариант 3',
      description: 'Крупные карточки',
      icon: Table,
    },
  ],
}

// Конфигурация шаблонов для секции "Контакты"
export const CONTACTS_SECTION_TEMPLATES: SectionTemplateConfig = {
  sectionId: 'contacts',
  sectionName: 'Контакты',
  defaultTemplate: 'standard',
  templates: [
    {
      id: 'standard' as ContactsTemplateId,
      name: 'Вариант 1',
      description: 'Контакты сверху, карта снизу',
      icon: LayoutList,
    },
    {
      id: 'map-first' as ContactsTemplateId,
      name: 'Вариант 2',
      description: 'Карта сверху, контакты снизу',
      icon: MapPin,
    },
    {
      id: 'split' as ContactsTemplateId,
      name: 'Вариант 3',
      description: 'Слева контакты, справа карта',
      icon: SplitSquareHorizontal,
    },
  ],
}

// Маппинг всех конфигураций по ID секции
export const SECTION_TEMPLATE_CONFIGS: Record<string, SectionTemplateConfig> = {
  about: ABOUT_SECTION_TEMPLATES,
  portfolio: PORTFOLIO_SECTION_TEMPLATES,
  services: SERVICES_SECTION_TEMPLATES,
  characters: CHARACTERS_SECTION_TEMPLATES,
  turnkey: TURNKEY_SECTION_TEMPLATES,
  contacts: CONTACTS_SECTION_TEMPLATES,
}

/**
 * Получить конфигурацию шаблонов для секции
 */
export function getTemplateConfig(sectionId: string): SectionTemplateConfig | undefined {
  return SECTION_TEMPLATE_CONFIGS[sectionId]
}

/**
 * Получить дефолтный шаблон для секции
 */
export function getDefaultTemplate(sectionId: string): string {
  const config = getTemplateConfig(sectionId)
  return config?.defaultTemplate || 'classic'
}

