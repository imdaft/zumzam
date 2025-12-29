/**
 * Хук для работы с шаблонами секций профиля
 * Позволяет получать и обновлять выбранные шаблоны
 * v2.0: Поддержка раздельных вариантов для mobile/desktop
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import type { 
  SectionTemplates, 
  LegacySectionTemplates,
  TemplateId, 
  TemplateVariant,
  SectionTemplateVariantConfig,
} from '@/lib/types/templates'
import { isLegacyFormat, convertLegacyToVariant } from '@/lib/types/templates'

interface UseProfileTemplatesOptions {
  profileId: string
  initialTemplates?: SectionTemplates | LegacySectionTemplates
  variant?: TemplateVariant // Новый параметр для выбора версии
  onTemplateChange?: (sectionId: string, templateId: TemplateId, variant: TemplateVariant) => void
}

export function useProfileTemplates({ 
  profileId, 
  initialTemplates,
  variant: externalVariant, // Может быть передан извне или определяться автоматически
  onTemplateChange 
}: UseProfileTemplatesOptions) {
  // Определяем variant автоматически, если не передан
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    // Определяем устройство только на клиенте
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // Используем переданный variant или определенный автоматически
  const variant: TemplateVariant = externalVariant || (isMobile ? 'mobile' : 'desktop')

  const defaultTemplates: SectionTemplates = {
    about: { mobile: 'classic', desktop: 'classic' },
    packages: { mobile: 'grid', desktop: 'grid' },
    services: { mobile: 'list', desktop: 'list' },
    portfolio: { mobile: 'variant1', desktop: 'variant1' },
    contacts: { mobile: 'standard', desktop: 'standard' },
    faq: { mobile: 'accordion', desktop: 'accordion' },
    locations: { mobile: 'standard', desktop: 'standard' },
    turnkey: { mobile: 'standard', desktop: 'standard' },
    characters: { mobile: 'standard', desktop: 'standard' },
  }

  // Конвертируем legacy формат при инициализации
  const normalizedInitialTemplates = initialTemplates && isLegacyFormat(initialTemplates)
    ? convertLegacyToVariant(initialTemplates)
    : (initialTemplates as SectionTemplates)

  const [templates, setTemplates] = useState<SectionTemplates>({
    ...defaultTemplates,
    ...(normalizedInitialTemplates || {}),
  })
  const [isUpdating, setIsUpdating] = useState(false)

  /**
   * Получить текущий шаблон для секции с учетом variant
   */
  const getTemplate = useCallback((sectionId: string): TemplateId => {
    const config = templates[sectionId]
    
    if (!config) {
      console.log('[useProfileTemplates] No config for section:', sectionId)
      return 'classic'
    }
    
    // Если это legacy формат (строка) - используем её напрямую
    if (typeof config === 'string') {
      console.log('[useProfileTemplates] Legacy format detected for:', sectionId, config)
      return config as TemplateId
    }
    
    // Новый формат - берем нужный вариант
    const template = (config as SectionTemplateVariantConfig)[variant] || 'classic'
    console.log('[useProfileTemplates] getTemplate:', { 
      sectionId, 
      variant,
      template, 
      config 
    })
    return template as TemplateId
  }, [templates, variant])

  /**
   * Обновить шаблон для секции (только для текущего variant)
   */
  const updateTemplate = useCallback(async (
    sectionId: string, 
    templateId: TemplateId
  ): Promise<boolean> => {
    try {
      setIsUpdating(true)

      // Получаем текущую конфигурацию секции
      const currentConfig = templates[sectionId] || { mobile: 'classic', desktop: 'classic' }
      
      // Если legacy формат (строка), конвертируем в новый
      const normalizedConfig = typeof currentConfig === 'string'
        ? { mobile: currentConfig as TemplateId, desktop: currentConfig as TemplateId }
        : currentConfig as SectionTemplateVariantConfig

      // Обновляем только нужный вариант
      const updatedConfig: SectionTemplateVariantConfig = {
        ...normalizedConfig,
        [variant]: templateId,
      }

      // Оптимистичное обновление UI
      setTemplates(prev => ({
        ...prev,
        [sectionId]: updatedConfig,
      }))

      // Отправляем на сервер с указанием variant
      const response = await fetch(`/api/profiles/${profileId}/templates`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sectionId,
          templateId,
          variant, // НОВОЕ поле
        }),
      })

      if (!response.ok) {
        throw new Error('Ошибка при сохранении шаблона')
      }

      const data = await response.json()
      
      // Обновляем состояние с данными сервера
      setTemplates(data.section_templates)

      // Вызываем колбэк если есть
      onTemplateChange?.(sectionId, templateId, variant)

      toast.success(`Дизайн обновлен (${variant === 'mobile' ? '📱 Мобильная' : '💻 Десктоп'})`)
      return true

    } catch (error) {
      console.error('Ошибка при обновлении шаблона:', error)
      
      // Откатываем оптимистичное обновление
      setTemplates(prev => prev)
      
      toast.error('Не удалось сохранить дизайн')
      return false

    } finally {
      setIsUpdating(false)
    }
  }, [profileId, variant, templates, onTemplateChange])

  /**
   * Сбросить все шаблоны к дефолтным
   */
  const resetTemplates = useCallback(async (): Promise<boolean> => {
    try {
      setIsUpdating(true)
      setTemplates(defaultTemplates)

      // Обновляем каждую секцию (для обоих вариантов)
      const promises = Object.entries(defaultTemplates).flatMap(([sectionId, config]) => [
        fetch(`/api/profiles/${profileId}/templates`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sectionId, templateId: config.mobile, variant: 'mobile' }),
        }),
        fetch(`/api/profiles/${profileId}/templates`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sectionId, templateId: config.desktop, variant: 'desktop' }),
        }),
      ])

      await Promise.all(promises)
      toast.success('Все шаблоны сброшены')
      return true

    } catch (error) {
      console.error('Ошибка при сбросе шаблонов:', error)
      toast.error('Не удалось сбросить шаблоны')
      return false

    } finally {
      setIsUpdating(false)
    }
  }, [profileId, defaultTemplates])

  return {
    templates,
    getTemplate,
    updateTemplate,
    resetTemplates,
    isUpdating,
    variant, // Возвращаем текущий variant для UI
  }
}

