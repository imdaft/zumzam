'use client'

import { useState } from 'react'
import { HelpCircle, Settings, Check } from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useProfileTemplates } from '@/hooks/use-profile-templates'
import { cn } from '@/lib/utils'

interface FAQItem {
  question: string
  answer: string
}

interface ProfileFAQProps {
  faq: FAQItem[]
  profileId?: string
  isOwner?: boolean
  variant?: 'mobile' | 'desktop'
}

type FAQTemplateId = 'variant1' | 'variant2'

export function ProfileFAQ({ faq, profileId, isOwner = false, variant }: ProfileFAQProps) {
  const { isClient } = useAuth()
  const showOwnerControls = Boolean(isOwner) && !isClient
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const { getTemplate, updateTemplate, variant: currentVariant } = useProfileTemplates({
    profileId: profileId || '',
    initialTemplates: undefined,
    variant,
  })

  const currentTemplate = (getTemplate('faq') || 'variant1') as FAQTemplateId

  const handleTemplateChange = async (templateId: FAQTemplateId) => {
    if (profileId) {
      await updateTemplate('faq', templateId)
    }
    setIsDropdownOpen(false)
  }

  if (!faq || faq.length === 0) {
    return null
  }

  return (
    <section className="bg-white rounded-[32px] p-1 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between px-6 py-6 pb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
          Часто задаваемые вопросы
        </h2>
        
        {showOwnerControls && (
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-full text-xs text-slate-600 font-medium">
              {currentVariant === 'mobile' ? '📱 Мобильная' : '💻 Десктоп'}
            </div>
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <button 
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all"
                  type="button"
                  aria-label="Настройки дизайна"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 border-b">
                  {currentVariant === 'mobile' ? '📱 Мобильная версия' : '💻 Десктопная версия'}
                </div>
                <DropdownMenuItem 
                onClick={() => handleTemplateChange('variant1')}
                className={`cursor-pointer ${currentTemplate === 'variant1' ? 'bg-orange-50 text-orange-700 font-medium' : 'text-slate-700'}`}
              >
                <div>
                  <div className="font-medium">Вариант 1</div>
                  <div className="text-xs text-slate-500">Стандартный аккордеон</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleTemplateChange('variant2')}
                className={`cursor-pointer ${currentTemplate === 'variant2' ? 'bg-orange-50 text-orange-700 font-medium' : 'text-slate-700'}`}
              >
                <div>
                  <div className="font-medium">Вариант 2</div>
                  <div className="text-xs text-slate-500">Две колонки</div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      </div>
      
      <div className="p-4 sm:p-6 pt-0">
        {currentTemplate === 'variant2' ? (
          <div className="grid md:grid-cols-2 gap-4">
            {/* Левая колонка */}
            <div className="space-y-3">
              {faq.filter((_, i) => i % 2 === 0).map((item, index) => (
                <FAQItemComponent key={index * 2} item={item} index={index * 2} />
              ))}
            </div>
            {/* Правая колонка */}
            <div className="space-y-3">
              {faq.filter((_, i) => i % 2 !== 0).map((item, index) => (
                <FAQItemComponent key={index * 2 + 1} item={item} index={index * 2 + 1} />
              ))}
            </div>
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full space-y-2 sm:space-y-3">
            {faq.map((item, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border border-slate-200 rounded-[20px] px-5 bg-slate-50/50 hover:bg-slate-50 transition-colors overflow-hidden"
              >
                <AccordionTrigger className="text-left hover:no-underline py-4 text-sm sm:text-base font-bold text-slate-900">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 pb-4 text-sm leading-relaxed whitespace-pre-wrap">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </section>
  )
}

function FAQItemComponent({ item, index }: { item: FAQItem, index: number }) {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem 
        value={`item-${index}`}
        className="border border-slate-200 rounded-[20px] px-5 bg-slate-50/50 hover:bg-slate-50 transition-colors overflow-hidden"
      >
        <AccordionTrigger className="text-left hover:no-underline py-4 text-sm sm:text-base font-bold text-slate-900">
          {item.question}
        </AccordionTrigger>
        <AccordionContent className="text-slate-600 pb-4 text-sm leading-relaxed whitespace-pre-wrap">
          {item.answer}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
