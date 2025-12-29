/**
 * Модульная карточка-секция для формы
 * Современный дизайн с единым стилем
 */

import { ReactNode } from 'react'
import { cn, getCardClasses } from '@/lib/design-system'

interface FormSectionProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
  icon?: ReactNode
  action?: ReactNode
}

export function FormSection({
  title,
  description,
  children,
  className,
  icon,
  action,
}: FormSectionProps) {
  return (
    <div className={cn(getCardClasses(), className)}>
      {/* Заголовок секции */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex-shrink-0 w-11 h-11 rounded-[16px] bg-primary/10 flex items-center justify-center text-primary">
                {icon}
              </div>
            )}
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">
              {title}
            </h2>
          </div>
          {action && (
            <div className="flex-shrink-0 ml-4">
              {action}
            </div>
          )}
        </div>
        
        {description && (
          <p className="text-sm text-neutral-600 mt-2">
            {description}
          </p>
        )}
      </div>

      {/* Контент секции */}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  )
}




