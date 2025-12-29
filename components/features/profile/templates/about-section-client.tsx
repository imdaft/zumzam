/**
 * Клиентский компонент-обертка для секции "О нас" с поддержкой шаблонов
 * Отображает выбранный шаблон и позволяет владельцу переключать между ними
 */

'use client'

import { useState, useEffect } from 'react'
import { AboutSection, type AboutSectionData } from '@/components/features/profile/templates/about-section'
import { TemplateSwitcher, TemplateSwitcherCompact } from '@/components/features/profile/templates/template-switcher'
import { CoverCropEditor } from '@/components/features/profile/cover-crop-editor'
import { ABOUT_SECTION_TEMPLATES } from '@/lib/constants/template-configs'
import { useProfileTemplates } from '@/hooks/use-profile-templates'
import type { AboutTemplateId } from '@/lib/types/templates'
import type { CropData, AllTemplatesCoverCropData } from '@/lib/types/crop'
import { Crop, Settings, Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/lib/contexts/auth-context'

interface AboutSectionClientProps {
  data: AboutSectionData
  profileId: string
  initialTemplate?: AboutTemplateId
  allCrops?: AllTemplatesCoverCropData // Все кропы для всех шаблонов
  isOwner?: boolean
  variant?: 'mobile' | 'desktop'
}

export function AboutSectionClient({ 
  data, 
  profileId, 
  initialTemplate = 'classic',
  allCrops,
  isOwner = false,
  variant
}: AboutSectionClientProps) {
  const { isClient } = useAuth()
  const showOwnerControls = isOwner && !isClient
  const [showSwitcher, setShowSwitcher] = useState(false)
  const [showCropEditor, setShowCropEditor] = useState(false)
  const [allTemplateCrops, setAllTemplateCrops] = useState<AllTemplatesCoverCropData>(allCrops || {})
  
  const { getTemplate, updateTemplate } = useProfileTemplates({
    profileId,
    initialTemplates: {
      about: initialTemplate,
    },
    variant,
  })

  const currentTemplate = getTemplate('about') as AboutTemplateId
  const currentCrop = allTemplateCrops[currentTemplate]

  // Debug
  console.log('[AboutSectionClient] currentTemplate:', currentTemplate, 'type:', typeof currentTemplate)
  console.log('[AboutSectionClient] allTemplateCrops:', allTemplateCrops)
  console.log('[AboutSectionClient] currentCrop:', currentCrop)

  // При смене шаблона - обновляем кроп из allTemplateCrops
  useEffect(() => {
    // Можно добавить логику загрузки кропа из БД если нужно
  }, [currentTemplate])

  const handleTemplateChange = async (templateId: AboutTemplateId) => {
    try {
      await updateTemplate('about', templateId)
      setShowSwitcher(false) // Закрываем меню после выбора
      // Шаблон обновится автоматически через React
    } catch (error) {
      console.error('Error updating template:', error)
    }
  }

  const handleCropSave = (crop: CropData) => {
    // Обновляем кроп для текущего шаблона
    setAllTemplateCrops(prev => ({
      ...prev,
      [currentTemplate]: crop
    }))
  }

  return (
    <div className="relative">
      {/* Кнопка управления (только для владельца) */}
      {showOwnerControls && (
        <>
          {/* Dropdown меню в стиле Яндекса */}
          <div className="absolute top-4 right-4 z-30">
            <DropdownMenu open={showSwitcher} onOpenChange={setShowSwitcher}>
              <DropdownMenuTrigger asChild>
                <button
                  className="w-10 h-10 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full shadow-md flex items-center justify-center hover:bg-slate-50 hover:shadow-lg transition-all"
                  title="Настройки обложки"
                >
                  <Settings className="w-5 h-5 text-slate-600" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-64">
                {/* Редактировать обложку */}
                <DropdownMenuItem
                  onClick={() => {
                    setShowCropEditor(true)
                    setShowSwitcher(false)
                  }}
                >
                  <Crop className="w-4 h-4 mr-3 text-slate-500" />
                  <span>Редактировать обложку</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Заголовок секции дизайна */}
                <div className="px-5 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Дизайн секции
                </div>

                {/* Варианты дизайна */}
                {ABOUT_SECTION_TEMPLATES.templates.map((template) => (
                  <DropdownMenuItem
                    key={template.id}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleTemplateChange(template.id)
                    }}
                    className={`cursor-pointer ${
                      currentTemplate === template.id
                        ? 'bg-orange-50 text-orange-700 font-medium' 
                        : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-xs text-slate-500">{template.description}</div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      )}

      {/* Редактор кропа обложки */}
      {showOwnerControls && showCropEditor && (
        <CoverCropEditor
          isOpen={showCropEditor}
          imageUrl={data.coverPhoto}
          templateId={currentTemplate}
          initialCrop={currentCrop}
          profileId={profileId}
          onClose={() => setShowCropEditor(false)}
          onSave={handleCropSave}
        />
      )}

      {/* Сама секция */}
      <AboutSection 
        data={data} 
        template={currentTemplate}
        crop={currentCrop}
        onTemplateChange={handleTemplateChange}
      />
    </div>
  )
}

