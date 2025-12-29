import { HelpCircle } from 'lucide-react'
import { useState } from 'react'

interface HelpTooltipProps {
  content: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  className?: string
}

export function HelpTooltip({ content, side = 'top', className }: HelpTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        type="button"
        className={`inline-flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors ${className}`}
        onClick={(e) => e.preventDefault()}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
      >
        <HelpCircle className="h-4 w-4" />
      </button>
      
      {isVisible && (
        <div
          className={`
            absolute z-50 w-64 px-3 py-2 text-sm leading-relaxed text-white bg-gray-900 rounded-lg shadow-lg
            ${side === 'top' ? 'bottom-full left-1/2 -translate-x-1/2 mb-2' : ''}
            ${side === 'bottom' ? 'top-full left-1/2 -translate-x-1/2 mt-2' : ''}
            ${side === 'left' ? 'right-full top-1/2 -translate-y-1/2 mr-2' : ''}
            ${side === 'right' ? 'left-full top-1/2 -translate-y-1/2 ml-2' : ''}
            pointer-events-none animate-in fade-in-0 zoom-in-95
          `}
        >
          {content}
          <div
            className={`
              absolute w-2 h-2 bg-gray-900 rotate-45
              ${side === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' : ''}
              ${side === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' : ''}
              ${side === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' : ''}
              ${side === 'right' ? 'left-[-4px] top-1/2 -translate-y-1/2' : ''}
            `}
          />
        </div>
      )}
    </div>
  )
}
