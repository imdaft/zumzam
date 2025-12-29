/**
 * Переключатель режима просмотра: Клиент / Сервис
 * Доступен только для администраторов
 */

'use client'

import { useViewMode } from '@/lib/store/view-mode-store'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { User, Briefcase } from 'lucide-react'

interface ViewModeToggleProps {
  className?: string
}

export function ViewModeToggle({ className }: ViewModeToggleProps) {
  const { mode, isAdmin, toggleMode, isServiceMode } = useViewMode()

  // Показываем только для админов
  if (!isAdmin) {
    return null
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex items-center gap-2">
        <User className={`w-4 h-4 ${!isServiceMode ? 'text-blue-600' : 'text-gray-400'}`} />
        <Label 
          htmlFor="view-mode-switch" 
          className={`text-sm cursor-pointer ${!isServiceMode ? 'font-semibold text-blue-600' : 'text-gray-500'}`}
        >
          Клиент
        </Label>
      </div>
      
      <Switch
        id="view-mode-switch"
        checked={isServiceMode}
        onCheckedChange={toggleMode}
        className="data-[state=checked]:bg-orange-600"
      />
      
      <div className="flex items-center gap-2">
        <Label 
          htmlFor="view-mode-switch" 
          className={`text-sm cursor-pointer ${isServiceMode ? 'font-semibold text-orange-600' : 'text-gray-500'}`}
        >
          Сервис
        </Label>
        <Briefcase className={`w-4 h-4 ${isServiceMode ? 'text-orange-600' : 'text-gray-400'}`} />
      </div>
    </div>
  )
}

/**
 * Компактная версия переключателя для dropdown меню
 */
export function ViewModeToggleCompact() {
  const { mode, isAdmin, toggleMode, isServiceMode } = useViewMode()

  if (!isAdmin) {
    return null
  }

  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
      <div className="flex items-center gap-2">
        {isServiceMode ? (
          <Briefcase className="w-4 h-4 text-orange-600" />
        ) : (
          <User className="w-4 h-4 text-blue-600" />
        )}
        <span className="text-sm font-medium">
          {isServiceMode ? 'Режим сервиса' : 'Режим клиента'}
        </span>
      </div>
      <Switch
        checked={isServiceMode}
        onCheckedChange={toggleMode}
        className="data-[state=checked]:bg-orange-600"
      />
    </div>
  )
}


