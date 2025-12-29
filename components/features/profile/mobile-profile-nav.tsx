'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { 
  User, MapPin, Package, Gift, Sparkles, ImageIcon, Star, 
  HelpCircle, Home, ChevronLeft, ChevronRight 
} from 'lucide-react'

interface Section {
  id: string
  label: string
  iconName: string
}

interface MobileProfileNavProps {
  sections: Section[]
}

// Маппинг названий иконок на компоненты
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'User': User,
  'MapPin': MapPin,
  'Package': Package,
  'Gift': Gift,
  'Sparkles': Sparkles,
  'ImageIcon': ImageIcon,
  'Star': Star,
  'HelpCircle': HelpCircle,
  'HomeIcon': Home,
}

export function MobileProfileNav({ sections }: MobileProfileNavProps) {
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.id || '')
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Обновляем позицию индикатора при смене активной секции
  useEffect(() => {
    const activeButton = buttonRefs.current[activeSection]
    if (activeButton && scrollRef.current) {
      const scrollContainer = scrollRef.current
      const buttonRect = activeButton.getBoundingClientRect()
      const containerRect = scrollContainer.getBoundingClientRect()
      
      setIndicatorStyle({
        left: buttonRect.left - containerRect.left + scrollContainer.scrollLeft,
        width: buttonRect.width,
      })
    }
  }, [activeSection])

  // Отслеживаем скролл страницы для определения активной секции
  useEffect(() => {
    const handleScroll = () => {
      // Если пользователь скроллит вручную, делаем задержку перед обновлением маркера
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      scrollTimeoutRef.current = setTimeout(() => {
        // Активируем секцию, когда заголовок в верхней трети экрана (вместо упирания в хедер)
        const viewportHeight = window.innerHeight
        const scrollPosition = window.scrollY + (viewportHeight / 3)

        for (let i = sections.length - 1; i >= 0; i--) {
          const element = document.getElementById(sections[i].id)
          if (element) {
            const elementTop = element.offsetTop
            
            if (scrollPosition >= elementTop) {
              setActiveSection(sections[i].id)
              setIsUserScrolling(false)
              break
            }
          }
        }
      }, 150) // Увеличена задержка до 150ms для более плавного обновления
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [sections])

  // Проверяем необходимость стрелок прокрутки
  useEffect(() => {
    const checkScrollArrows = () => {
      const el = scrollRef.current
      if (!el) return
      
      setShowLeftArrow(el.scrollLeft > 0)
      setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 1)
    }

    const el = scrollRef.current
    if (el) {
      el.addEventListener('scroll', checkScrollArrows, { passive: true })
      checkScrollArrows()
      
      // Проверяем после рендера
      setTimeout(checkScrollArrows, 100)
    }

    return () => {
      if (el) {
        el.removeEventListener('scroll', checkScrollArrows)
      }
    }
  }, [sections])

  // Прокрутка к активному элементу в навигации
  useEffect(() => {
    const activeEl = scrollRef.current?.querySelector(`[data-section-id="${activeSection}"]`)
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [activeSection])

  const scrollNav = (direction: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    
    const scrollAmount = el.clientWidth * 0.5
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    })
  }

  const scrollToSection = (sectionId: string) => {
    setIsUserScrolling(true)
    setActiveSection(sectionId) // Сразу меняем активную секцию
    
    const element = document.getElementById(sectionId)
    if (element) {
      const headerOffset = 112
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div className="md:hidden">
      {/* Пустой spacer чтобы контент не прятался под fixed меню */}
      <div className="h-14" />
      
      {/* Fixed меню - сразу под header (без строки поиска) */}
      <div className="fixed top-[56px] left-0 right-0 z-30 bg-white border-b border-slate-100 shadow-sm">
        <div className="relative">
          {/* Стрелка влево */}
          {showLeftArrow && (
            <button
              onClick={() => scrollNav('left')}
              className="absolute left-0 top-0 bottom-0 z-10 w-10 bg-gradient-to-r from-white via-white to-transparent flex items-center justify-start pl-2"
              aria-label="Прокрутить влево"
            >
              <ChevronLeft className="w-5 h-5 text-slate-400" />
            </button>
          )}
          
          {/* Навигация */}
          <div 
            ref={scrollRef}
            className="relative flex items-center gap-1.5 overflow-x-auto scrollbar-hide px-3 py-3"
          >
            {/* Плавно перемещающаяся капсула-фон */}
            <div
              className="absolute top-1/2 -translate-y-1/2 h-[40px] bg-orange-500 rounded-full shadow-sm"
              style={{
                left: `${indicatorStyle.left}px`,
                width: `${indicatorStyle.width}px`,
                transition: 'left 400ms cubic-bezier(0.4, 0, 0.2, 1), width 400ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
            
            {sections.map((section) => {
              const IconComponent = iconMap[section.iconName] || User
              const isActive = activeSection === section.id
              
              return (
                <button
                  key={section.id}
                  ref={(el) => { buttonRefs.current[section.id] = el }}
                  data-section-id={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={cn(
                    'relative z-10 flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors duration-200 flex-shrink-0',
                    isActive
                      ? 'text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  <IconComponent className="w-4 h-4" />
                  {section.label}
                </button>
              )
            })}
          </div>
          
          {/* Стрелка вправо */}
          {showRightArrow && (
            <button
              onClick={() => scrollNav('right')}
              className="absolute right-0 top-0 bottom-0 z-10 w-10 bg-gradient-to-l from-white via-white to-transparent flex items-center justify-end pr-2"
              aria-label="Прокрутить вправо"
            >
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}






