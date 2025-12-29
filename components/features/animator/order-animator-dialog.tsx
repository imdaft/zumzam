'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, ShoppingCart, Check } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart-store'
import { toast } from 'sonner'
import Image from 'next/image'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

interface Character {
  id: string
  name: string
  photos: string[]
  description: string | null
}

interface Service {
  id: string
  title: string
  description: string | null
  price: number
  is_additional: boolean
  images?: string[]
}

interface OrderAnimatorDialogProps {
  character: Character | null
  profileId: string
  isOpen: boolean
  onClose: () => void
}

export function OrderAnimatorDialog({ character, profileId, isOpen, onClose }: OrderAnimatorDialogProps) {
  const [services, setServices] = useState<Service[]>([])
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null)
  const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const { addItem, clearCart, items } = useCartStore()

  // Загружаем услуги при открытии диалога
  useEffect(() => {
    if (!isOpen || !profileId) return

    const fetchServices = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/services?profile_id=${profileId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch services')
        }

        const { services: data } = await response.json()
        setServices(data || [])
      } catch (error) {
        console.error('[OrderAnimatorDialog] Error fetching services:', error)
        toast.error('Не удалось загрузить программы')
      } finally {
        setIsLoading(false)
      }
    }

    fetchServices()
  }, [isOpen, profileId])

  const programs = services.filter(s => !s.is_additional)
  const addons = services.filter(s => s.is_additional)

  const handleToggleAddon = (addonId: string) => {
    const newSet = new Set(selectedAddonIds)
    if (newSet.has(addonId)) {
      newSet.delete(addonId)
    } else {
      newSet.add(addonId)
    }
    setSelectedAddonIds(newSet)
  }

  const handleAddToCart = async () => {
    if (!selectedProgramId) {
      toast.error('Выберите программу')
      return
    }

    setIsAdding(true)
    try {
      // Проверяем, есть ли в корзине услуги другого профиля
      const currentProfileId = items[0]?.profile_id
      if (currentProfileId && currentProfileId !== profileId) {
        const confirmClear = window.confirm(
          'В корзине уже есть услуги другого исполнителя. Очистить корзину и добавить эти услуги?'
        )
        if (!confirmClear) {
          setIsAdding(false)
          return
        }
        await clearCart()
      }

      // Добавляем выбранную программу
      const programTitle = programs.find(p => p.id === selectedProgramId)?.title || 'Программа'
      await addItem(
        selectedProgramId,
        profileId,
        1,
        character ? `Персонаж: ${character.name}` : undefined
      )

      // Добавляем доп. услуги
      for (const addonId of Array.from(selectedAddonIds)) {
        await addItem(addonId, profileId, 1)
      }

      toast.success('Добавлено в корзину! 🎉', {
        description: `${programTitle}${selectedAddonIds.size > 0 ? ` + ${selectedAddonIds.size} доп. услуг` : ''}`,
      })

      // Закрываем диалог и сбрасываем выбор
      onClose()
      setSelectedProgramId(null)
      setSelectedAddonIds(new Set())
    } catch (error: any) {
      console.error('[OrderAnimatorDialog] Error adding to cart:', error)
      toast.error('Не удалось добавить в корзину')
    } finally {
      setIsAdding(false)
    }
  }

  const selectedProgram = programs.find(p => p.id === selectedProgramId)
  const selectedAddons = addons.filter(a => selectedAddonIds.has(a.id))
  const totalPrice = (selectedProgram?.price || 0) + selectedAddons.reduce((sum, a) => sum + a.price, 0)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            {character ? `Заказать ${character.name}` : 'Заказать аниматора'}
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            Выберите программу и дополнительные услуги
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
          </div>
        ) : (
          <div className="space-y-6 mt-6">
            {/* Персонаж */}
            {character && (
              <div className="flex items-start gap-4 p-4 rounded-[18px] bg-slate-50">
                {character.photos?.[0] && (
                  <div className="relative w-16 h-16 rounded-md overflow-hidden shrink-0 bg-slate-100">
                    <Image src={character.photos[0]} alt={character.name} fill className="object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900">{character.name}</h3>
                  {character.description && (
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">{character.description}</p>
                  )}
                </div>
              </div>
            )}

            {/* Программы */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-4">Выберите программу *</h3>
              {programs.length === 0 ? (
                <p className="text-sm text-slate-500">Программы не добавлены</p>
              ) : (
                <RadioGroup value={selectedProgramId || ''} onValueChange={setSelectedProgramId}>
                  <div className="space-y-3">
                    {programs.map((program) => (
                      <div
                        key={program.id}
                        className={`flex items-start gap-3 p-4 rounded-[18px] border transition-all cursor-pointer ${
                          selectedProgramId === program.id
                            ? 'border-slate-900 bg-slate-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                        onClick={() => setSelectedProgramId(program.id)}
                      >
                        <RadioGroupItem value={program.id} id={program.id} className="mt-1" />
                        <Label htmlFor={program.id} className="flex-1 cursor-pointer">
                          <div className="font-semibold text-slate-900">{program.title}</div>
                          {program.description && (
                            <div className="text-sm text-slate-600 mt-1 leading-relaxed">{program.description}</div>
                          )}
                          <div className="text-base font-semibold text-slate-900 mt-2">
                            {program.price.toLocaleString()} ₽
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              )}
            </div>

            {/* Доп. услуги */}
            {addons.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-4">Дополнительные услуги</h3>
                <div className="space-y-3">
                  {addons.map((addon) => {
                    const isSelected = selectedAddonIds.has(addon.id)
                    return (
                      <div
                        key={addon.id}
                        onClick={() => handleToggleAddon(addon.id)}
                        className={`flex items-start gap-3 p-4 rounded-[18px] border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-slate-900 bg-slate-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleAddon(addon.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900">{addon.title}</div>
                          {addon.description && (
                            <div className="text-sm text-slate-600 mt-1 leading-relaxed">{addon.description}</div>
                          )}
                          <div className="text-base font-semibold text-slate-900 mt-2">
                            +{addon.price.toLocaleString()} ₽
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Итого */}
            {selectedProgramId && (
              <div className="p-5 rounded-[18px] bg-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">Итого:</span>
                  <span className="text-2xl font-semibold text-slate-900">{totalPrice.toLocaleString()} ₽</span>
                </div>
                {selectedAddonIds.size > 0 && (
                  <div className="text-sm text-slate-600 mt-2">
                    Программа + {selectedAddonIds.size} доп. {selectedAddonIds.size === 1 ? 'услуга' : 'услуг'}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Кнопки */}
        <div className="flex gap-3 pt-6 border-t mt-6">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="flex-1 h-11 rounded-full font-medium"
          >
            Отмена
          </Button>
          <Button
            onClick={handleAddToCart}
            disabled={!selectedProgramId || isAdding || isLoading}
            className="flex-1 h-11 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-medium transition-colors"
          >
            {isAdding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Добавление...
              </>
            ) : (
              <>
                Заказать
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}






