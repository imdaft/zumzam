'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface SimpleCheckboxProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
  id?: string
}

const SimpleCheckbox = React.forwardRef<HTMLDivElement, SimpleCheckboxProps>(
  ({ checked = false, onCheckedChange, disabled = false, className, id, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!disabled) {
        onCheckedChange?.(!checked)
      }
    }

    return (
      <div
        ref={ref}
        id={id}
        role="checkbox"
        aria-checked={checked}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault()
            handleClick(e as any)
          }
        }}
        className={cn(
          'h-5 w-5 shrink-0 rounded-lg border-2 transition-all cursor-pointer',
          'flex items-center justify-center',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
          disabled && 'cursor-not-allowed opacity-50',
          checked
            ? 'bg-orange-500 border-orange-500'
            : 'bg-white border-gray-300 hover:border-orange-400',
          className
        )}
        {...props}
      >
        {checked && (
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    )
  }
)

SimpleCheckbox.displayName = 'SimpleCheckbox'

export { SimpleCheckbox }

