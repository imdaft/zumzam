'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Cropper from 'react-easy-crop'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Sparkles, Loader2, Maximize2, AlertCircle, X, Monitor, Smartphone } from 'lucide-react'
import { getCroppedImg } from '@/lib/canvasUtils'
import { toast } from 'sonner'

type ExpandDirection = 'top' | 'bottom' | 'left' | 'right' | 'all'

interface CropParams {
  crop: { x: number; y: number }
  zoom: number
  croppedAreaPixels: any
  croppedAreaPercentages: any // Добавляем проценты!
}

interface ImageCropperProps {
  imageSrc: string | null
  isOpen: boolean
  onClose: () => void
  onCropComplete: (desktopCrop: CropParams, mobileCrop: CropParams, originalBlob: Blob, isNewUpload: boolean) => void
  title?: string
  aspect?: number
  isNewUpload?: boolean
  // Режим одиночного кропа (новое!)
  singleCropMode?: 'desktop' | 'mobile' // Если установлен, показываем только один кроппер
  // Существующие crop параметры (для редактирования)
  existingDesktopCrop?: any
  existingMobileCrop?: any
  // AI расширение (опционально)
  categoryId?: string
  desktopImageUrl?: string
  mobileImageUrl?: string
  onAIExpand?: (args: { direction: ExpandDirection; expandPercent: number; mode: 'desktop' | 'mobile' }) => Promise<void>
  aiExpandDirections?: ExpandDirection[]
  aiExpandDefaultPercent?: number
  aiExpandMinPercent?: number
  aiExpandMaxPercent?: number
  aiExpandStep?: number
  aiExpandCostCredits?: number
}

export function ImageCropper({
  imageSrc,
  isOpen,
  onClose,
  onCropComplete,
  title = 'Редактирование изображения',
  aspect = 16 / 9,
  isNewUpload = false,
  singleCropMode, // NEW
  existingDesktopCrop,
  existingMobileCrop,
  categoryId,
  desktopImageUrl,
  mobileImageUrl,
  onAIExpand,
  aiExpandDirections = ['all'],
  aiExpandDefaultPercent = 40,
  aiExpandMinPercent = 20,
  aiExpandMaxPercent = 60,
  aiExpandStep = 10,
  aiExpandCostCredits = 10,
}: ImageCropperProps) {
  // Режим редактирования: какой кроп редактируем
  // Если singleCropMode установлен, используем его. Иначе дефолт 'desktop'
  const [editMode, setEditMode] = useState<'desktop' | 'mobile'>(singleCropMode || 'desktop')
  
  // Параметры для десктопа (16:9)
  const [desktopCrop, setDesktopCrop] = useState({ x: 0, y: 0 })
  const [desktopZoom, setDesktopZoom] = useState(1)
  const [desktopCroppedAreaPixels, setDesktopCroppedAreaPixels] = useState<any>(null)
  const [desktopCroppedAreaPercentages, setDesktopCroppedAreaPercentages] = useState<any>(null)
  
  // Параметры для мобильного (1:1)
  const [mobileCrop, setMobileCrop] = useState({ x: 0, y: 0 })
  const [mobileZoom, setMobileZoom] = useState(1)
  const [mobileCroppedAreaPixels, setMobileCroppedAreaPixels] = useState<any>(null)
  const [mobileCroppedAreaPercentages, setMobileCroppedAreaPercentages] = useState<any>(null)
  
  const [isExpanding, setIsExpanding] = useState(false)
  const [expandError, setExpandError] = useState<string | null>(null)
  const [expandPercent, setExpandPercent] = useState(aiExpandDefaultPercent)
  const [expandDirection, setExpandDirection] = useState<ExpandDirection>(aiExpandDirections[0] ?? 'all')
  
  // Отслеживаем предыдущий imageSrc чтобы сбрасывать параметры только при новом изображении
  const prevImageSrcRef = useRef<string | null>(null)

  // Сбрасываем параметры ТОЛЬКО при открытии НОВОГО изображения
  useEffect(() => {
    if (isOpen && imageSrc) {
      // Проверяем, действительно ли это новое изображение
      // Учитываем и сам URL, и timestamp для AI-расширенных изображений
      const isNewImage = prevImageSrcRef.current !== imageSrc
      
      if (isNewImage) {
        console.log('[ImageCropper] Image changed from', prevImageSrcRef.current, 'to', imageSrc)
        
        // Если редактируем существующее изображение и есть сохраненные crop параметры - загружаем их
        // НО НЕ загружаем при AI расширении (когда URL содержит "expanded")
        const isAIExpanded = imageSrc.includes('expanded')
        
        if (!isNewUpload && !isAIExpanded && existingDesktopCrop) {
          console.log('[ImageCropper] Loading existing desktop crop')
          setDesktopCrop(existingDesktopCrop.crop || { x: 0, y: 0 })
          setDesktopZoom(existingDesktopCrop.zoom || 1)
        } else {
          console.log('[ImageCropper] Resetting desktop crop (isAIExpanded:', isAIExpanded, ')')
          setDesktopCrop({ x: 0, y: 0 })
          setDesktopZoom(1)
        }
        
        if (!isNewUpload && !isAIExpanded && existingMobileCrop) {
          console.log('[ImageCropper] Loading existing mobile crop')
          setMobileCrop(existingMobileCrop.crop || { x: 0, y: 0 })
          setMobileZoom(existingMobileCrop.zoom || 1)
        } else {
          console.log('[ImageCropper] Resetting mobile crop (isAIExpanded:', isAIExpanded, ')')
          setMobileCrop({ x: 0, y: 0 })
          setMobileZoom(1)
        }
        
        // Устанавливаем editMode: если есть singleCropMode, используем его, иначе 'desktop'
        setEditMode(singleCropMode || 'desktop')
        prevImageSrcRef.current = imageSrc
      }
    }
    
    // Сбрасываем ref при закрытии диалога
    if (!isOpen) {
      prevImageSrcRef.current = null
    }
  }, [isOpen, imageSrc, isNewUpload, existingDesktopCrop, existingMobileCrop, singleCropMode])

  // Обработчики для десктопа
  const onDesktopCropChange = (crop: { x: number; y: number }) => {
    setDesktopCrop(crop)
  }

  const onDesktopZoomChange = (zoom: number) => {
    setDesktopZoom(zoom)
  }

  const onDesktopCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setDesktopCroppedAreaPixels(croppedAreaPixels)
    setDesktopCroppedAreaPercentages(croppedArea)
  }, [])

  // Обработчики для мобильного
  const onMobileCropChange = (crop: { x: number; y: number }) => {
    console.log('[ImageCropper] Mobile crop changed:', crop)
    setMobileCrop(crop)
  }

  const onMobileZoomChange = (zoom: number) => {
    console.log('[ImageCropper] Mobile zoom changed:', zoom)
    setMobileZoom(zoom)
  }

  const onMobileCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setMobileCroppedAreaPixels(croppedAreaPixels)
    setMobileCroppedAreaPercentages(croppedArea)
  }, [])

  const handleSave = async () => {
    // В режиме singleCropMode проверяем только текущий кроп
    if (singleCropMode) {
      const currentCroppedAreaPixels = singleCropMode === 'desktop' 
        ? desktopCroppedAreaPixels 
        : mobileCroppedAreaPixels
      
      if (!imageSrc || !currentCroppedAreaPixels) {
        toast.error('Пожалуйста, настройте кроп')
        return
      }
    } else {
      // Старый режим: проверяем оба кропа
      if (!imageSrc || !desktopCroppedAreaPixels || !mobileCroppedAreaPixels) {
        toast.error('Пожалуйста, настройте оба кропа')
        return
      }
    }

    try {
      // Создаем Blob ОРИГИНАЛЬНОГО изображения (не обрезанного!)
      const response = await fetch(imageSrc)
      const originalBlob = await response.blob()
      
      // В режиме singleCropMode передаём только один crop
      if (singleCropMode) {
        const currentParams: CropParams = singleCropMode === 'desktop'
          ? {
              crop: desktopCrop,
              zoom: desktopZoom,
              croppedAreaPixels: desktopCroppedAreaPixels,
              croppedAreaPercentages: desktopCroppedAreaPercentages,
            }
          : {
              crop: mobileCrop,
              zoom: mobileZoom,
              croppedAreaPixels: mobileCroppedAreaPixels,
              croppedAreaPercentages: mobileCroppedAreaPercentages,
            }
        
        // Передаём текущий параметр, пустой объект, оригинальное изображение
        onCropComplete(currentParams, {} as CropParams, originalBlob, isNewUpload)
      } else {
        // Старый режим: передаём оба параметра
        const desktopParams: CropParams = {
          crop: desktopCrop,
          zoom: desktopZoom,
          croppedAreaPixels: desktopCroppedAreaPixels,
          croppedAreaPercentages: desktopCroppedAreaPercentages,
        }
        
        const mobileParams: CropParams = {
          crop: mobileCrop,
          zoom: mobileZoom,
          croppedAreaPixels: mobileCroppedAreaPixels,
          croppedAreaPercentages: mobileCroppedAreaPercentages,
        }
        
        onCropComplete(desktopParams, mobileParams, originalBlob, isNewUpload)
      }
    } catch (e) {
      console.error(e)
      toast.error('Ошибка сохранения')
    }
  }

  const handleReset = () => {
    if (editMode === 'desktop') {
      setDesktopZoom(1)
      setDesktopCrop({ x: 0, y: 0 })
    } else {
      setMobileZoom(1)
      setMobileCrop({ x: 0, y: 0 })
    }
  }

  const handleAIExpand = async () => {
    if (!onAIExpand) return
    
    setIsExpanding(true)
    setExpandError(null)
    try {
      console.log('[ImageCropper] Starting AI expand:', { direction: expandDirection, expandPercent, mode: editMode })
      console.log('[ImageCropper] Current imageSrc before expand:', imageSrc)
      await onAIExpand({ direction: expandDirection, expandPercent, mode: editMode })
      console.log('[ImageCropper] AI expand completed, imageSrc should update now')
      toast.success(`Изображение расширено для ${editMode === 'desktop' ? 'Desktop' : 'Mobile'}! ✨`)
      setExpandError(null)
    } catch (error) {
      console.error('[ImageCropper] AI expand error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Не удалось расширить изображение'
      console.error('[ImageCropper] Error message:', errorMessage)
      
      if (errorMessage.includes('finishReason=IMAGE_OTHER') || errorMessage.includes('Unable to show')) {
        if (errorMessage.includes('блокировка:') || errorMessage.includes('блокировка категорий:')) {
          setExpandError('copyright')
          toast.error('Изображение заблокировано AI-фильтрами', {
            description: 'Возможная причина: авторские права, торговые марки или небезопасный контент.',
            duration: 10000,
          })
        } else {
          setExpandError('technical')
          toast.error('AI не смог расширить это изображение', {
            description: 'Попробуйте уменьшить процент или выбрать другое направление.',
            duration: 8000,
          })
        }
      } else {
        setExpandError('unknown')
        toast.error(errorMessage)
      }
    } finally {
      setIsExpanding(false)
    }
  }

  // Получаем текущие параметры в зависимости от режима
  const currentCrop = editMode === 'desktop' ? desktopCrop : mobileCrop
  const currentZoom = editMode === 'desktop' ? desktopZoom : mobileZoom
  const currentAspect = editMode === 'desktop' ? 16 / 9 : 1
  const currentObjectFit = editMode === 'desktop' ? 'horizontal-cover' : 'contain'

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[900px] max-h-[95vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto min-h-0 px-1">
          {/* Переключатель режима редактирования (только если не singleCropMode) */}
          {!singleCropMode && (
            <div className="flex gap-2 mb-4 justify-center">
              <Button
                type="button"
                size="sm"
                variant={editMode === 'desktop' ? 'default' : 'outline'}
                onClick={() => {
                  console.log('[ImageCropper] Switching to Desktop mode. Current state:', {
                    desktopCrop,
                    desktopZoom,
                    mobileCrop,
                    mobileZoom
                  })
                  setEditMode('desktop')
                }}
                className="flex items-center gap-2"
              >
                <Monitor className="w-4 h-4" />
                Desktop (16:9)
              </Button>
              <Button
                type="button"
                size="sm"
                variant={editMode === 'mobile' ? 'default' : 'outline'}
                onClick={() => {
                  console.log('[ImageCropper] Switching to Mobile mode. Current state:', {
                    desktopCrop,
                    desktopZoom,
                    mobileCrop,
                    mobileZoom
                  })
                  setEditMode('mobile')
                }}
                className="flex items-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                Mobile (1:1)
              </Button>
            </div>
          )}

          {/* Редактор кропа - два отдельных компонента с key для сохранения состояния */}
          <div className="mb-4">
            {/* Desktop Cropper */}
            {editMode === 'desktop' && (
              <div
                className="relative w-full bg-slate-900 rounded-xl overflow-hidden"
                style={{ aspectRatio: 16 / 9, maxHeight: '400px' }}
              >
                {imageSrc && (
                  <Cropper
                    key={`desktop-cropper-${imageSrc}`}
                    image={imageSrc}
                    crop={desktopCrop}
                    zoom={desktopZoom}
                    rotation={0}
                    aspect={16 / 9}
                    objectFit="horizontal-cover"
                    onCropChange={onDesktopCropChange}
                    onCropComplete={onDesktopCropComplete}
                    onZoomChange={onDesktopZoomChange}
                    minZoom={0.5}
                    maxZoom={3}
                  />
                )}
              </div>
            )}
            
            {/* Mobile Cropper */}
            {editMode === 'mobile' && (
              <div
                className="relative w-full bg-slate-900 rounded-xl overflow-hidden"
                style={{ aspectRatio: 1, maxHeight: '400px' }}
              >
                {imageSrc && (
                  <>
                    {console.log('[ImageCropper] Rendering Mobile Cropper with imageSrc:', imageSrc, 'crop:', mobileCrop, 'zoom:', mobileZoom)}
                    <Cropper
                      key={`mobile-cropper-${imageSrc}`}
                      image={imageSrc}
                      crop={mobileCrop}
                      zoom={mobileZoom}
                      rotation={0}
                      aspect={1}
                      objectFit="contain"
                      onCropChange={onMobileCropChange}
                      onCropComplete={onMobileCropComplete}
                      onZoomChange={onMobileZoomChange}
                      minZoom={0.5}
                      maxZoom={3}
                    />
                  </>
                )}
              </div>
            )}
          </div>

          {/* Предупреждение об ошибке AI расширения */}
          {expandError && (
          <div className={`p-4 mb-4 rounded-lg border ${
            expandError === 'copyright' 
              ? 'bg-red-50 border-red-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-start gap-3">
              <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                expandError === 'copyright' ? 'text-red-600' : 'text-yellow-600'
              }`} />
              <div className="flex-1">
                <h4 className={`text-sm font-semibold mb-1 ${
                  expandError === 'copyright' ? 'text-red-900' : 'text-yellow-900'
                }`}>
                  {expandError === 'copyright' 
                    ? 'Эта картинка заблокирована AI-фильтрами' 
                    : 'AI не может обработать именно эту картинку'}
                </h4>
                <p className={`text-xs ${
                  expandError === 'copyright' ? 'text-red-700' : 'text-yellow-700'
                }`}>
                  {expandError === 'copyright'
                    ? 'Возможная причина: авторские права, торговые марки или небезопасный контент. Загрузите другое изображение без защищенного контента.'
                    : 'Модель не может продолжить эту конкретную композицию. Попробуйте: 1) Загрузить другую картинку 2) Уменьшить процент расширения 3) Выбрать другое направление'}
                </p>
              </div>
              <button
                onClick={() => setExpandError(null)}
                className={`p-1 rounded hover:bg-opacity-20 ${
                  expandError === 'copyright' ? 'hover:bg-red-600' : 'hover:bg-yellow-600'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          )}

          <div className="space-y-4 py-2">
            {/* Увеличение */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium w-24 shrink-0">Увеличение</span>
              <Slider 
                value={[currentZoom]} 
                min={0.5} 
                max={3} 
                step={0.01} 
                onValueChange={(vals) => {
                  if (editMode === 'desktop') {
                    setDesktopZoom(vals[0])
                  } else {
                    setMobileZoom(vals[0])
                  }
                }} 
                className="flex-1"
              />
              <span className="text-xs text-slate-500 w-12 text-right">{currentZoom.toFixed(2)}x</span>
            </div>
            
            {/* AI расширение (если доступно) */}
            {onAIExpand && (
              <div className="pt-3 mt-2 border-t border-slate-200">
               <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-2">
                   <Sparkles className="w-4 h-4 text-orange-500" />
                   <span className="text-sm font-semibold text-slate-900">AI расширение изображения</span>
                   <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                     {aiExpandCostCredits} кредитов
                   </span>
                 </div>
               </div>
               <p className="text-xs text-slate-500 mb-3">
                 Нейросеть расширит изображение для <strong>{editMode === 'desktop' ? 'Desktop (16:9)' : 'Mobile (1:1)'}</strong> версии
               </p>

               <div className="mb-4 px-1">
                 <div className="flex items-center justify-between mb-2">
                   <span className="text-xs font-medium text-slate-700">Степень расширения</span>
                   <span className="text-xs font-bold text-orange-600">{expandPercent}%</span>
                 </div>
                 <Slider
                   value={[expandPercent]}
                   onValueChange={(value) => setExpandPercent(value[0])}
                   min={aiExpandMinPercent}
                   max={aiExpandMaxPercent}
                   step={aiExpandStep}
                   className="w-full"
                 />
                 <div className="flex justify-between mt-1 text-[10px] text-slate-400">
                   <span>Мин ({aiExpandMinPercent}%)</span>
                   <span>Макс ({aiExpandMaxPercent}%)</span>
                 </div>
               </div>

               <div className="flex flex-wrap gap-2 mb-3">
                 {aiExpandDirections.includes('top') && (
                   <Button
                     type="button"
                     size="sm"
                     variant={expandDirection === 'top' ? 'default' : 'outline'}
                     onClick={() => setExpandDirection('top')}
                     disabled={isExpanding}
                   >
                     Вверх ↑
                   </Button>
                 )}
                 {aiExpandDirections.includes('bottom') && (
                   <Button
                     type="button"
                     size="sm"
                     variant={expandDirection === 'bottom' ? 'default' : 'outline'}
                     onClick={() => setExpandDirection('bottom')}
                     disabled={isExpanding}
                   >
                     Вниз ↓
                   </Button>
                 )}
                 {aiExpandDirections.includes('left') && (
                   <Button
                     type="button"
                     size="sm"
                     variant={expandDirection === 'left' ? 'default' : 'outline'}
                     onClick={() => setExpandDirection('left')}
                     disabled={isExpanding}
                   >
                     Влево ←
                   </Button>
                 )}
                 {aiExpandDirections.includes('right') && (
                   <Button
                     type="button"
                     size="sm"
                     variant={expandDirection === 'right' ? 'default' : 'outline'}
                     onClick={() => setExpandDirection('right')}
                     disabled={isExpanding}
                   >
                     Вправо →
                   </Button>
                 )}
                 {aiExpandDirections.includes('all') && (
                   <Button
                     type="button"
                     size="sm"
                     variant={expandDirection === 'all' ? 'default' : 'outline'}
                     onClick={() => setExpandDirection('all')}
                     disabled={isExpanding}
                     className="flex items-center gap-1"
                   >
                     <Maximize2 className="w-3 h-3" />
                     Все стороны
                   </Button>
                 )}
               </div>

               <Button
                 type="button"
                 variant="outline"
                 onClick={handleAIExpand}
                 disabled={isExpanding}
                 className="w-full border-orange-200 hover:bg-orange-50 hover:border-orange-300"
               >
                 {isExpanding ? (
                   <>
                     <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                     Расширяем изображение...
                   </>
                 ) : (
                   <>
                     <Sparkles className="w-4 h-4 mr-2 text-orange-500" />
                     Расширить {editMode === 'desktop' ? 'Desktop' : 'Mobile'} ({expandDirection}, {expandPercent}%)
                   </>
                 )}
               </Button>
               <p className="text-[10px] text-slate-400 mt-2 text-center">
                 💡 Расширение применится только к {editMode === 'desktop' ? 'desktop' : 'mobile'} версии
               </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between shrink-0">
          <Button variant="ghost" onClick={handleReset} className="text-slate-500">
            Сбросить {editMode === 'desktop' ? 'Desktop' : 'Mobile'}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Отмена</Button>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
              {singleCropMode 
                ? `Сохранить ${singleCropMode === 'desktop' ? 'Desktop' : 'Mobile'}` 
                : 'Сохранить оба кропа'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
