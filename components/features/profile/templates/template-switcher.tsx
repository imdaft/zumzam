/**
 * UI для переключения между шаблонами секций профиля
 * Показывает текущий шаблон и позволяет листать варианты стрелками
 */

'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { TemplateId } from '@/lib/types/templates'
import type { SectionTemplateConfig } from '@/lib/constants/template-configs'

interface TemplateSwitcherProps {
  config: SectionTemplateConfig
  currentTemplate: TemplateId
  onTemplateChange: (templateId: TemplateId) => void
  className?: string
}

export function TemplateSwitcher({ 
  config, 
  currentTemplate, 
  onTemplateChange,
  className = ''
}: TemplateSwitcherProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const currentIndex = config.templates.findIndex(t => t.id === currentTemplate)
  const currentTemplateData = config.templates[currentIndex]

  const handlePrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : config.templates.length - 1
    onTemplateChange(config.templates[newIndex].id)
  }

  const handleNext = () => {
    const newIndex = currentIndex < config.templates.length - 1 ? currentIndex + 1 : 0
    onTemplateChange(config.templates[newIndex].id)
  }

  return (
    <div className={`relative ${className}`}>
      {/* Компактная версия (показывается всегда) */}
      <div className="flex items-center gap-2 bg-white border-2 border-orange-200 rounded-2xl px-3 py-2 shadow-sm">
        {/* Кнопка назад */}
        <button
          onClick={handlePrevious}
          className="w-8 h-8 flex items-center justify-center rounded-[18px] hover:bg-slate-100 transition-colors"
          title="Предыдущий шаблон"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>

        {/* Текущий шаблон */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 flex items-center gap-2 px-3 py-1 hover:bg-slate-50 rounded-lg transition-colors"
        >
          {currentTemplateData.icon && (
            <currentTemplateData.icon className="w-5 h-5 text-orange-500" />
          )}
          <div className="flex-1 text-left">
            <div className="text-sm font-semibold text-slate-900">
              {currentTemplateData.name}
            </div>
            <div className="text-xs text-slate-500">
              {currentIndex + 1} из {config.templates.length}
            </div>
          </div>
        </button>

        {/* Кнопка вперед */}
        <button
          onClick={handleNext}
          className="w-8 h-8 flex items-center justify-center rounded-[18px] hover:bg-slate-100 transition-colors"
          title="Следующий шаблон"
        >
          <ChevronRight className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      {/* Развернутая версия (список всех шаблонов) */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Overlay для закрытия */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setIsExpanded(false)}
            />

            {/* Попап с шаблонами */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-orange-200 rounded-[28px] shadow-xl overflow-hidden z-50"
            >
              <div className="p-2">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
                  Выберите дизайн
                </div>
                
                {config.templates.map((template) => {
                  const isSelected = template.id === currentTemplate
                  const Icon = template.icon
                  
                  return (
                    <button
                      key={template.id}
                      onClick={() => {
                        onTemplateChange(template.id)
                        setIsExpanded(false)
                      }}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all ${
                        isSelected
                          ? 'bg-orange-50 border-2 border-orange-400'
                          : 'hover:bg-slate-50 border-2 border-transparent'
                      }`}
                    >
                      {/* Иконка */}
                      {Icon && (
                        <div className={`w-10 h-10 rounded-[18px] flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-orange-500' : 'bg-slate-100'
                        }`}>
                          <Icon className={`w-5 h-5 ${
                            isSelected ? 'text-white' : 'text-slate-600'
                          }`} />
                        </div>
                      )}

                      {/* Описание */}
                      <div className="flex-1 text-left">
                        <div className={`text-sm font-semibold mb-0.5 ${
                          isSelected ? 'text-orange-900' : 'text-slate-900'
                        }`}>
                          {template.name}
                        </div>
                        <div className="text-xs text-slate-600 leading-relaxed">
                          {template.description}
                        </div>
                      </div>

                      {/* Чекмарк */}
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
                          <Check className="w-4 h-4 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Упрощенная версия переключателя - только стрелки
 * Для использования в мобильной версии или в тесных местах
 */
export function TemplateSwitcherCompact({ 
  config, 
  currentTemplate, 
  onTemplateChange,
  className = ''
}: TemplateSwitcherProps) {
  const currentIndex = config.templates.findIndex(t => t.id === currentTemplate)
  const currentTemplateData = config.templates[currentIndex]

  const handlePrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : config.templates.length - 1
    onTemplateChange(config.templates[newIndex].id)
  }

  const handleNext = () => {
    const newIndex = currentIndex < config.templates.length - 1 ? currentIndex + 1 : 0
    onTemplateChange(config.templates[newIndex].id)
  }

  return (
    <div className={`flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-orange-200 rounded-full px-2 py-1 shadow-sm ${className}`}>
      <button
        onClick={handlePrevious}
        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-orange-100 transition-colors"
        title="Предыдущий шаблон"
      >
        <ChevronLeft className="w-4 h-4 text-orange-600" />
      </button>

      <div className="text-xs font-medium text-slate-700 px-2 min-w-[80px] text-center">
        {currentTemplateData.name}
      </div>

      <button
        onClick={handleNext}
        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-orange-100 transition-colors"
        title="Следующий шаблон"
      >
        <ChevronRight className="w-4 h-4 text-orange-600" />
      </button>
    </div>
  )
}















