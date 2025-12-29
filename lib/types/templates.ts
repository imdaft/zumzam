/**
 * Типы для системы шаблонов секций профиля
 * Каждая секция может иметь несколько вариантов отображения
 * С версии 2.0: поддержка раздельных вариантов для mobile/desktop
 */

// Варианты устройств
export type TemplateVariant = 'mobile' | 'desktop'

// Все доступные ID шаблонов для секции "О нас"
export type AboutTemplateId = 'classic' | 'modern' | 'minimal'

// Все доступные ID шаблонов для других секций (расширяемо)
export type PortfolioTemplateId = 'variant1' | 'variant2' | 'variant3'
export type PackagesTemplateId = 'grid' | 'carousel' | 'list'
export type ServicesTemplateId = 'list' | 'cards' | 'table'
export type ContactsTemplateId = 'standard' | 'map-first' | 'split'
export type FAQTemplateId = 'accordion' | 'cards' | 'list'
export type LocationsTemplateId = 'standard' | 'compact'
export type TurnkeyTemplateId = 'standard' | 'compact' | 'large'
export type CharactersTemplateId = 'standard' | 'compact' | 'large'

// Объединенный тип всех возможных шаблонов
export type TemplateId = 
  | AboutTemplateId
  | PackagesTemplateId
  | ServicesTemplateId
  | PortfolioTemplateId
  | ContactsTemplateId
  | FAQTemplateId
  | LocationsTemplateId
  | TurnkeyTemplateId
  | CharactersTemplateId

// Конфигурация шаблона для конкретной секции с раздельными вариантами
export type SectionTemplateVariantConfig = {
  mobile: TemplateId
  desktop: TemplateId
}

// НОВАЯ структура для хранения выбранных шаблонов секций (v2.0)
export interface SectionTemplates {
  about?: SectionTemplateVariantConfig
  packages?: SectionTemplateVariantConfig
  services?: SectionTemplateVariantConfig
  portfolio?: SectionTemplateVariantConfig
  contacts?: SectionTemplateVariantConfig
  faq?: SectionTemplateVariantConfig
  locations?: SectionTemplateVariantConfig
  turnkey?: SectionTemplateVariantConfig
  characters?: SectionTemplateVariantConfig
  [key: string]: SectionTemplateVariantConfig | undefined
}

// УСТАРЕВШИЙ формат (v1.0) - для обратной совместимости
export interface LegacySectionTemplates {
  about?: AboutTemplateId
  packages?: PackagesTemplateId
  services?: ServicesTemplateId
  portfolio?: PortfolioTemplateId
  contacts?: ContactsTemplateId
  faq?: FAQTemplateId
  locations?: LocationsTemplateId
  turnkey?: TurnkeyTemplateId
  characters?: CharactersTemplateId
  [key: string]: string | undefined
}

// Type guard для проверки формата
export function isLegacyFormat(templates: any): templates is LegacySectionTemplates {
  if (!templates || typeof templates !== 'object') return false
  
  // Проверяем первый ключ - если значение строка, то это legacy формат
  const firstKey = Object.keys(templates)[0]
  if (!firstKey) return false
  
  return typeof templates[firstKey] === 'string'
}

// Утилита для конвертации legacy формата в новый
export function convertLegacyToVariant(legacy: LegacySectionTemplates): SectionTemplates {
  const result: SectionTemplates = {}
  
  for (const [key, value] of Object.entries(legacy)) {
    if (typeof value === 'string') {
      result[key] = {
        mobile: value as TemplateId,
        desktop: value as TemplateId
      }
    }
  }
  
  return result
}

// Метаданные шаблона для UI
export interface TemplateMetadata {
  id: TemplateId
  name: string
  description: string
  preview?: string // URL картинки превью
  icon?: React.ComponentType<{ className?: string }>
}

// Конфигурация секции с доступными шаблонами
export interface SectionConfig {
  sectionId: string
  sectionName: string
  templates: TemplateMetadata[]
  defaultTemplate: TemplateId
}


