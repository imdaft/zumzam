'use client'

import { useState } from 'react'
import { UtensilsCrossed, Eye, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface CateringMenuItem {
  id: string
  name: string
  category: string // 'appetizers', 'main', 'desserts', 'drinks'
  price: number
  description?: string
  allergens?: string[]
  vegetarian?: boolean
  image?: string
}

/**
 * Блок "Меню кейтеринга"
 * Показывает анонс в профиле + полное меню в модалке
 */
export function CateringMenuBlock({
  profileId,
  menu,
  title = 'Меню кейтеринга',
}: {
  profileId: string
  menu: CateringMenuItem[]
  title?: string
}) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  if (!menu || menu.length === 0) return null
  
  // Группируем по категориям
  const grouped = groupByCategory(menu)
  const previewItems = menu.slice(0, 3)
  
  return (
    <>
      {/* Анонс в профиле */}
      <div className="bg-white rounded-[32px] p-1 shadow-sm border border-slate-100">
        <div className="px-6 py-6">
          <div className="flex items-center gap-3 mb-2">
            <UtensilsCrossed className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{title}</h2>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Большой выбор блюд для детей и взрослых
          </p>
          
          {/* Preview */}
          <div className="space-y-2 mb-4">
            {previewItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <span className="text-slate-700">{item.name}</span>
                <span className="text-slate-500">{item.price} ₽</span>
              </div>
            ))}
          </div>
          
          <Button 
            onClick={() => setIsModalOpen(true)} 
            className="w-full bg-orange-600 hover:bg-orange-700"
            size="lg"
          >
            <Eye className="w-4 h-4 mr-2" />
            Смотреть полное меню ({menu.length} позиций)
          </Button>
        </div>
      </div>
      
      {/* Полное меню в модалке */}
      <CateringMenuModal
        menu={menu}
        grouped={grouped}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}

/**
 * Модальное окно с полным меню
 */
function CateringMenuModal({
  menu,
  grouped,
  isOpen,
  onClose,
}: {
  menu: CateringMenuItem[]
  grouped: Map<string, CateringMenuItem[]>
  isOpen: boolean
  onClose: () => void
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <UtensilsCrossed className="w-6 h-6 text-orange-600" />
            Меню кейтеринга
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {Array.from(grouped.entries()).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-lg font-bold text-slate-900 mb-3 pb-2 border-b">
                {getCategoryLabel(category)}
              </h3>
              <div className="space-y-3">
                {items.map((item) => (
                  <MenuItemCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function MenuItemCard({ item }: { item: CateringMenuItem }) {
  return (
    <div className="flex justify-between items-start gap-4 p-3 hover:bg-slate-50 rounded-lg transition">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-slate-900">{item.name}</h4>
          {item.vegetarian && <Badge variant="outline" className="text-xs">🌱 Вегетарианское</Badge>}
        </div>
        {item.description && (
          <p className="text-sm text-slate-600 mb-2">{item.description}</p>
        )}
        {item.allergens && item.allergens.length > 0 && (
          <p className="text-xs text-slate-500">
            Аллергены: {item.allergens.join(', ')}
          </p>
        )}
      </div>
      <div className="text-lg font-semibold text-orange-600 whitespace-nowrap">
        {item.price} ₽
      </div>
    </div>
  )
}

function groupByCategory(menu: CateringMenuItem[]): Map<string, CateringMenuItem[]> {
  const grouped = new Map<string, CateringMenuItem[]>()
  
  for (const item of menu) {
    const category = item.category || 'other'
    if (!grouped.has(category)) {
      grouped.set(category, [])
    }
    grouped.get(category)!.push(item)
  }
  
  return grouped
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    appetizers: 'Закуски',
    main: 'Основные блюда',
    desserts: 'Десерты',
    drinks: 'Напитки',
    other: 'Другое',
  }
  return labels[category] || category
}





