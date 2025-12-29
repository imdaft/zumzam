'use client'

import { User, Image as ImageIcon, MapPin, Sparkles, Package, Gift, GripVertical, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export interface Section {
  id: string
  label: string
  iconName: string
}

interface ProfileSidebarLeftProps {
  sections: Section[]
  isOwner?: boolean
  profileSlug?: string
  onSectionsReorder?: (sections: Section[]) => void
}

// Маппинг имен иконок на компоненты
const ICON_MAP: Record<string, React.ElementType> = {
  User,
  ImageIcon,
  MapPin,
  Sparkles,
  Package,
  Gift,
}

// Sortable Menu Item
function SortableMenuItem({ section, isActive, isOwner, onClick }: {
  section: Section
  isActive: boolean
  isOwner: boolean
  onClick: () => void
}) {
  // Только "О нас" не перетаскивается
  const isFixed = section.id === 'about'

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: section.id,
    disabled: isFixed // Отключаем drag только для "О нас"
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const Icon = ICON_MAP[section.iconName] || User

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative flex items-center group',
        isDragging && 'opacity-50 scale-105'
      )}
    >
      {isOwner && !isFixed && (
        <div
          {...attributes}
          {...listeners}
          className="absolute -left-6 top-1/2 -translate-y-1/2 p-1 cursor-grab active:cursor-grabbing opacity-60 hover:opacity-100 transition-opacity z-10"
          suppressHydrationWarning
        >
          <GripVertical className="w-4 h-4 text-slate-400 hover:text-slate-600" />
        </div>
      )}
      <button
        onClick={onClick}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 rounded-[16px] transition-all duration-200 text-sm font-medium',
          isActive
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-500 hover:bg-white/50 hover:text-slate-900'
        )}
      >
        <Icon className={cn('w-5 h-5', isActive ? 'text-primary fill-primary' : 'text-slate-400')} />
        {section.label}
      </button>
    </div>
  )
}

export function ProfileSidebarLeft({ sections, isOwner = false, profileSlug, onSectionsReorder }: ProfileSidebarLeftProps) {
  const [activeSection, setActiveSection] = useState('about')
  const [localSections, setLocalSections] = useState(sections)
  const router = useRouter()

  // Синхронизация localSections с props — через effect.
  // Важно: нельзя вызывать setState прямо в рендере, это может ломать DnD.
  useEffect(() => {
    setLocalSections(sections)
  }, [sections])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const scrollToSection = (id: string) => {
    setActiveSection(id)
    const element = document.getElementById(id)
    if (element) {
      const offset = 80 // header height + padding
      const bodyRect = document.body.getBoundingClientRect().top
      const elementRect = element.getBoundingClientRect().top
      const elementPosition = elementRect - bodyRect
      const offsetPosition = elementPosition - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    // Запрещаем любое перемещение, которое затрагивает "about"
    if (active.id === 'about' || over.id === 'about') {
      return
    }

    const oldIndex = localSections.findIndex(s => s.id === active.id)
    const newIndex = localSections.findIndex(s => s.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    // Запрещаем перемещение на первую позицию (где "about")
    if (newIndex === 0) {
      return
    }

    const newSections = [...localSections]
    const [removed] = newSections.splice(oldIndex, 1)
    newSections.splice(newIndex, 0, removed)

    // Дополнительная проверка: убеждаемся что "about" всегда первый
    const aboutIndex = newSections.findIndex(s => s.id === 'about')
    if (aboutIndex !== 0 && aboutIndex !== -1) {
      const about = newSections[aboutIndex]
      newSections.splice(aboutIndex, 1)
      newSections.unshift(about)
    }

    setLocalSections(newSections)
    onSectionsReorder?.(newSections)
  }

  const dndEnabled = Boolean(isOwner && onSectionsReorder)

  return (
    <nav className="space-y-1">
      {dndEnabled ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localSections.map(s => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {localSections.map((section) => (
              <SortableMenuItem
                key={section.id}
                section={section}
                isActive={activeSection === section.id}
                isOwner={Boolean(isOwner)}
                onClick={() => scrollToSection(section.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      ) : (
        <>
          {localSections.map((section) => {
            const Icon = ICON_MAP[section.iconName] || User
            const isActive = activeSection === section.id

            return (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-[16px] transition-all duration-200 text-sm font-medium',
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:bg-white/50 hover:text-slate-900'
                )}
              >
                <Icon className={cn('w-5 h-5', isActive ? 'text-primary fill-primary' : 'text-slate-400')} />
                {section.label}
              </button>
            )
          })}
        </>
      )}

      {/* Разделитель и кнопка настроек для владельца */}
      {isOwner && profileSlug && (
        <>
          <div className="my-3 border-t border-slate-200" />
          <button
            onClick={() => router.push(`/profiles/${profileSlug}/edit`)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-[16px] transition-all duration-200 text-sm font-medium text-slate-500 hover:bg-white/50 hover:text-slate-900"
          >
            <Settings className="w-5 h-5 text-slate-400" />
            Настройки профиля
          </button>
        </>
      )}
    </nav>
  )
}
