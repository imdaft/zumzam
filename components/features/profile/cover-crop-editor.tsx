/**
 * Редактор кропа обложки профиля с поддержкой AI расширения
 * Использует react-easy-crop для интерактивного кропа
 */

'use client'

import { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Loader2, Sparkles, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import Cropper from 'react-easy-crop'
import { toast } from 'sonner'
import type { CropData } from '@/lib/types/crop'
import { Area } from 'react-easy-crop'

interface CoverCropEditorProps {
  isOpen: boolean
  imageUrl: string
  templateId: 'classic' | 'modern' | 'minimal'
  initialCrop?: CropData
  profileId: string
  onClose: () => void
  onSave: (crop: CropData) => void
}

// Соотношения сторон для разных шаблонов
const ASPECT_RATIOS = {
  classic: 16 / 9,    // Широкая горизонтальная
  modern: 3 / 4,      // Вертикальная для левого блока
  minimal: 16 / 9,    // Широкая горизонтальная
}

const TEMPLATE_NAMES = {
  classic: 'Классический',
  modern: 'Современный',
  minimal: 'Минималистичный',
}

export function CoverCropEditor({
  isOpen,
  imageUrl,
  templateId,
  initialCrop,
  profileId,
  onClose,
  onSave,
}: CoverCropEditorProps) {
  // Восстанавливаем crop из initialCrop, инвертируя обратно
  const [crop, setCrop] = useState({ 
    x: initialCrop?.x ? -initialCrop.x : 0, 
    y: initialCrop?.y ? -initialCrop.y : 0 
  })
  const [zoom, setZoom] = useState(initialCrop?.zoom || 1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isExpanding, setIsExpanding] = useState(false)
  
  // Текущее изображение (может быть расширенным)
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl)
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null)
  
  // Процент расширения для AI (от 20% до 100%)
  const [expandPercent, setExpandPercent] = useState(40)

  const aspect = ASPECT_RATIOS[templateId]

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleSave = async () => {
    if (!croppedAreaPixels) {
      toast.error('Необходимо выбрать область кропа')
      return
    }

    try {
      setIsSaving(true)

      // Сохраняем данные кропа с инвертированными координатами
      const cropData: CropData = {
        x: Number(-crop.x) || 0,  
        y: Number(-crop.y) || 0,  
        zoom: Number(zoom) || 1,
        aspect: Number(aspect),
      }

      console.log('Сохранение кропа:', {
        profileId,
        templateId,
        cropData,
        originalCrop: crop,
        zoom,
        aspect,
        expandedImageUrl, // URL расширенного изображения (если есть)
      })

      // Сохраняем в БД через API
      const response = await fetch(`/api/profiles/${profileId}/cover-crop`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          crop: cropData,
          // Если есть расширенное изображение - обновляем cover_photo
          ...(expandedImageUrl && { coverPhotoUrl: expandedImageUrl }),
        }),
      })

      const responseData = await response.json()
      console.log('Response:', response.status, responseData)

      if (!response.ok) {
        throw new Error(responseData.error || 'Ошибка при сохранении')
      }

      toast.success('Обложка обновлена!')
      onSave(cropData)
      onClose()
      
      // Если было расширение - перезагружаем страницу чтобы применить новую обложку
      if (expandedImageUrl) {
        setTimeout(() => {
          window.location.reload()
        }, 500)
      }

    } catch (error: any) {
      console.error('Error saving crop:', error)
      toast.error(error.message || 'Не удалось сохранить изменения')
    } finally {
      setIsSaving(false)
    }
  }

  const handleExpandImage = async (direction: 'top' | 'bottom' | 'left' | 'right' | 'all') => {
    try {
      setIsExpanding(true)
      toast.info('AI расширяет изображение... Это может занять 10-30 секунд')

      const response = await fetch(`/api/ai/expand-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          imageUrl: currentImageUrl, // Используем текущее изображение
          direction,
          templateId,
          expandPercent, // Передаем процент расширения
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ошибка при расширении')
      }

      const data = await response.json()
      
      console.log('AI expanded image:', data.expandedImageUrl)
      console.log('Credits used:', data.creditsUsed)
      console.log('Remaining credits:', data.remainingCredits)
      console.log('Expand percent:', expandPercent)
      
      // Обновляем изображение в редакторе
      setCurrentImageUrl(data.expandedImageUrl)
      setExpandedImageUrl(data.expandedImageUrl)
      
      toast.success(`Изображение расширено на ${expandPercent}%! ${data.creditsUsed > 0 ? `Списано ${data.creditsUsed} кредитов. Осталось: ${data.remainingCredits}` : 'Без списания кредитов (админ)'}`)
      toast.info('Теперь вы можете кропать расширенное изображение. Нажмите "Сохранить" чтобы применить изменения.')

    } catch (error: any) {
      console.error('Error expanding image:', error)
      toast.error(error.message || 'Не удалось расширить изображение')
    } finally {
      setIsExpanding(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Редактирование обложки - {TEMPLATE_NAMES[templateId]}
          </DialogTitle>
          <p className="text-sm text-slate-500">
            Выберите область изображения для отображения в шаблоне {TEMPLATE_NAMES[templateId]}
          </p>
        </DialogHeader>

        {/* Cropper */}
        <div className="flex-1 relative bg-slate-900 rounded-lg overflow-hidden">
          <Cropper
            image={currentImageUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            objectFit="contain"
          />
        </div>

        {/* Контролы */}
        <div className="space-y-4">
          {/* Зум */}
          <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-slate-400" />
            <Slider
              value={[zoom]}
              onValueChange={(value) => setZoom(value[0])}
              min={1}
              max={3}
              step={0.1}
              className="flex-1"
            />
            <ZoomIn className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600 w-12 text-right">
              {zoom.toFixed(1)}x
            </span>
          </div>

          {/* AI расширение (платная функция) */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-semibold text-slate-900">
                  AI расширение изображения
                </span>
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                  Платно
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Нейросеть расширит изображение в нужном направлении (стоимость: 10 кредитов)
            </p>
            
            {/* Slider для выбора процента расширения */}
            <div className="mb-4 px-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-700">Степень расширения</span>
                <span className="text-xs font-bold text-orange-600">{expandPercent}%</span>
              </div>
              <Slider
                value={[expandPercent]}
                onValueChange={(value) => setExpandPercent(value[0])}
                min={20}
                max={100}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between mt-1 text-[10px] text-slate-400">
                <span>Минимум (20%)</span>
                <span>Максимум (100%)</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExpandImage('top')}
                disabled={isExpanding}
              >
                Вверх ↑
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExpandImage('bottom')}
                disabled={isExpanding}
              >
                Вниз ↓
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExpandImage('left')}
                disabled={isExpanding}
              >
                Влево ←
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExpandImage('right')}
                disabled={isExpanding}
              >
                Вправо →
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExpandImage('all')}
                disabled={isExpanding}
                className="flex items-center gap-1"
              >
                <Maximize2 className="w-3 h-3" />
                Все стороны
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Сохранение...
              </>
            ) : (
              'Сохранить'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

