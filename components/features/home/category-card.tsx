'use client'

import { motion } from 'framer-motion'
import { Settings, Upload, Trash2, Loader2, Edit3 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from '@/lib/contexts/auth-context'
import { toast } from 'sonner'
import { ImageCropper } from '@/components/shared/image-cropper'
import { getCroppedImg } from '@/lib/canvasUtils'

interface CategoryCardProps {
  name: string
  count: number
  categoryId: string
  imageUrl?: string | null
  originalImageUrl?: string | null
  desktopImageUrl?: string | null
  mobileImageUrl?: string | null
  desktopCrop?: any
  mobileCrop?: any
  onClick: () => void
  onImageUpdate?: () => void
  /** Переопределение скругления карточки (например, rounded-[24px]) */
  roundedClassName?: string
}

export function CategoryCard({ 
  name, 
  count, 
  categoryId, 
  imageUrl, 
  originalImageUrl,
  desktopImageUrl,
  mobileImageUrl,
  desktopCrop,
  mobileCrop,
  onClick, 
  onImageUpdate, 
  roundedClassName 
}: CategoryCardProps) {
  const { isAdmin } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [imageSrcForCrop, setImageSrcForCrop] = useState<string | null>(null)
  const [isCropperOpen, setIsCropperOpen] = useState(false)
  const [editingMode, setEditingMode] = useState<'desktop' | 'mobile' | null>(null) // NEW
  const [currentAspect, setCurrentAspect] = useState<number>(16 / 9) // NEW
  const rounded = roundedClassName ?? "rounded-xl md:rounded-2xl"

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      toast.error('Файл должен быть изображением')
      return
    }

    // Проверка размера (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Размер файла не должен превышать 5MB')
      return
    }

    setIsUploading(true)
    const toastId = toast.loading('Загрузка изображения...')

    try {
      // Загружаем ОРИГИНАЛ сразу
      const formData = new FormData()
      formData.append('file', file, `category-${categoryId}-original.jpg`)
      formData.append('categoryId', categoryId)

      const uploadResponse = await fetch('/api/category-images/upload', {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) throw new Error('Ошибка загрузки')
      const { imageUrl: uploadedUrl } = await uploadResponse.json()

      // Создаем дефолтные кропы (центр, zoom=1) и сохраняем оригинал
      // Пока загружаем оригинал как desktop/mobile (или генерируем дефолтные кропы)
      // Упростим: сохраняем оригинал во все поля, пользователь потом настроит
      const saveResponse = await fetch('/api/category-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          originalImageUrl: uploadedUrl,
          desktopImageUrl: uploadedUrl, // Временно оригинал
          mobileImageUrl: uploadedUrl,  // Временно оригинал
        })
      })

      if (!saveResponse.ok) throw new Error('Ошибка сохранения')

      toast.dismiss(toastId)
      toast.success('Изображение загружено! Теперь настройте кроп для Desktop и Mobile.')
      
      onImageUpdate?.()
    } catch (error) {
      console.error('Error uploading:', error)
      toast.dismiss(toastId)
      toast.error('Не удалось загрузить изображение')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleCropComplete = async (
    cropData: any, // Один crop (desktop или mobile)
    _mobileCrop: any, // Игнорируем, это старый интерфейс
    originalBlob: Blob,
    _isNewUpload: boolean // Игнорируем
  ) => {
    if (!editingMode) {
      console.error('handleCropComplete: editingMode is null')
      return
    }
    
    if (!cropData || !cropData.croppedAreaPixels) {
      console.error('handleCropComplete: invalid cropData', cropData)
      toast.error('Настройте кроп перед сохранением')
      return
    }
    
    setIsCropperOpen(false)
    setIsUploading(true)
    const toastId = toast.loading(`Сохранение ${editingMode === 'desktop' ? 'Desktop' : 'Mobile'} версии...`)

    try {
      const currentOriginalUrl = originalImageUrl || imageUrl
      if (!currentOriginalUrl) throw new Error('Нет оригинала')

      // Генерируем обрезанную версию
      const croppedBlob = await getCroppedImg(currentOriginalUrl, cropData.croppedAreaPixels)
      if (!croppedBlob) throw new Error('Ошибка нарезки')

      // Загружаем обрезанную версию
      const formData = new FormData()
      formData.append('file', croppedBlob, `category-${categoryId}-${editingMode}-${Date.now()}.jpg`)
      formData.append('categoryId', categoryId)
      const res = await fetch('/api/category-images/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Ошибка загрузки')
      const newUrl = (await res.json()).imageUrl

      // Обновляем только эту версию в БД
      const updateData: any = { categoryId }
      if (editingMode === 'desktop') {
        updateData.desktopImageUrl = newUrl
        updateData.desktopCrop = {
          crop: cropData.crop || { x: 0, y: 0 },
          zoom: cropData.zoom || 1,
          croppedAreaPixels: cropData.croppedAreaPixels,
          croppedAreaPercentages: cropData.croppedAreaPercentages || {},
        }
      } else {
        updateData.mobileImageUrl = newUrl
        updateData.mobileCrop = {
          crop: cropData.crop || { x: 0, y: 0 },
          zoom: cropData.zoom || 1,
          croppedAreaPixels: cropData.croppedAreaPixels,
          croppedAreaPercentages: cropData.croppedAreaPercentages || {},
        }
      }

      const saveResponse = await fetch('/api/category-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (!saveResponse.ok) throw new Error('Ошибка сохранения')

      toast.dismiss(toastId)
      toast.success(`${editingMode === 'desktop' ? 'Desktop' : 'Mobile'} версия сохранена! ✨`)
      
      onImageUpdate?.()
    } catch (error) {
      console.error('Error saving crop:', error)
      toast.dismiss(toastId)
      toast.error('Не удалось сохранить')
    } finally {
      setIsUploading(false)
      setImageSrcForCrop(null)
      setEditingMode(null)
    }
  }

  const handleCropCancel = () => {
    setIsCropperOpen(false)
    setImageSrcForCrop(null)
    setEditingMode(null)
  }

  const handleEditDesktop = () => {
    if (!originalImageUrl) {
      toast.error('Сначала загрузите изображение')
      return
    }
    setImageSrcForCrop(originalImageUrl)
    setEditingMode('desktop')
    setCurrentAspect(16 / 9)
    setIsCropperOpen(true)
  }

  const handleEditMobile = () => {
    if (!originalImageUrl) {
      toast.error('Сначала загрузите изображение')
      return
    }
    setImageSrcForCrop(originalImageUrl)
    setEditingMode('mobile')
    setCurrentAspect(1)
    setIsCropperOpen(true)
  }

  const handleExpandImage = async (args: { 
    direction: 'top' | 'bottom' | 'left' | 'right' | 'all'
    expandPercent: number
    mode: 'desktop' | 'mobile'
  }) => {
    if (!originalImageUrl) {
      throw new Error('Нет оригинала для расширения')
    }

    console.log('[CategoryCard] handleExpandImage called:', args)
    console.log('[CategoryCard] originalImageUrl:', originalImageUrl)

    const response = await fetch('/api/ai/expand-category-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categoryId,
        imageUrl: originalImageUrl, // Работаем с оригиналом!
        direction: args.direction,
        expandPercent: args.expandPercent,
        mode: args.mode
      })
    })

    console.log('[CategoryCard] API response status:', response.status)

    if (!response.ok) {
      const errorData = await response.json()
      console.error('[CategoryCard] API error:', errorData)
      throw new Error(errorData.error || 'Ошибка расширения изображения')
    }

    const result = await response.json()
    console.log('[CategoryCard] API result:', result)

    // Обновляем оригинал в редакторе
    if (result?.imageUrl) {
      const newImageUrl = `${result.imageUrl}?t=${Date.now()}`
      console.log('[CategoryCard] Setting new imageSrcForCrop:', newImageUrl)
      console.log('[CategoryCard] OLD image URL:', originalImageUrl)
      console.log('[CategoryCard] NEW image URL:', result.imageUrl)
      console.log('🔍 COMPARE IMAGES:')
      console.log('OLD:', originalImageUrl)
      console.log('NEW:', result.imageUrl)
      console.log('Open both URLs in browser to visually compare!')
      
      setImageSrcForCrop(newImageUrl)
      
      // Также обновляем страницу, чтобы получить новый original_image_url из БД
      onImageUpdate?.()
    } else {
      console.warn('[CategoryCard] No imageUrl in result')
    }
  }

  const handleDeleteImage = async () => {
    if (!confirm('Удалить изображение?')) return

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/category-images?categoryId=${categoryId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Ошибка удаления изображения')
      }

      toast.success('Изображение удалено')
      onImageUpdate?.()
    } catch (error) {
      console.error('Error deleting image:', error)
      toast.error('Не удалось удалить изображение')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCardClick = () => {
    // Не открываем список категории, если открыт crop editor
    if (!isCropperOpen && !isUploading) {
      onClick()
    }
  }

  return (
    <>
      <motion.div
        className={`group relative overflow-hidden ${rounded} md:border md:border-gray-200 md:hover:border-orange-300 transition-all duration-300 w-full cursor-pointer aspect-square md:aspect-video`}
        whileTap={{ scale: 0.98 }}
        onClick={handleCardClick}
      >
      {/* Фоновое изображение или градиент */}
      {imageUrl ? (
        <>
          {/* Mobile version (1:1) - показываем на мобильных */}
          <div className="absolute inset-0 md:hidden">
            <Image 
              src={mobileImageUrl || imageUrl || ''} 
              alt={name}
              fill
              className="object-cover"
              sizes="50vw"
            />
          </div>
          {/* Desktop version (16:9) - показываем на десктопе */}
          <div className="absolute inset-0 hidden md:block">
            <Image 
              src={desktopImageUrl || imageUrl || ''} 
              alt={name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 33vw, 25vw"
            />
          </div>
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-orange-50 group-hover:to-orange-100 transition-all duration-300" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/5 to-transparent rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500" />
        </>
      )}

      {/* Контент карточки */}
      <div className="relative z-10 w-full h-full p-2 md:p-4 flex flex-col">
        {/* Верхняя строка: Заголовок слева, Шестеренка справа */}
        <div className="flex items-start justify-between">
          {/* Заголовок */}
          <div className="pl-2 md:pl-0">
            <h3 className="text-[16px] md:text-xl font-bold text-gray-900">
              {name}
            </h3>
          </div>

          {/* Шестеренка админа в правом верхнем углу */}
          {isAdmin && (
            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="p-1.5 md:p-2 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full shadow-sm hover:shadow-md transition-all"
                    disabled={isUploading || isDeleting}
                  >
                    {isUploading || isDeleting ? (
                      <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600 animate-spin" />
                    ) : (
                      <Settings className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    {imageUrl ? 'Загрузить новое' : 'Загрузить изображение'}
                  </DropdownMenuItem>
                  {originalImageUrl && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleEditDesktop}>
                        <Edit3 className="w-4 h-4 mr-2" />
                        Настроить Desktop (16:9)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleEditMobile}>
                        <Edit3 className="w-4 h-4 mr-2" />
                        Настроить Mobile (1:1)
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleDeleteImage} className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Удалить изображение
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>

    {/* Crop Editor - вне motion.div для изоляции событий */}
    <ImageCropper
      key={editingMode || 'default'} // 🔑 КРИТИЧНО: пересоздаём компонент при смене режима
      imageSrc={imageSrcForCrop}
      isOpen={isCropperOpen}
      onClose={handleCropCancel}
      onCropComplete={handleCropComplete}
      aspect={currentAspect}
      isNewUpload={false}
      singleCropMode={editingMode || undefined}
      categoryId={categoryId}
      desktopImageUrl={originalImageUrl || undefined}
      mobileImageUrl={originalImageUrl || undefined}
      existingDesktopCrop={editingMode === 'desktop' ? desktopCrop : undefined}
      existingMobileCrop={editingMode === 'mobile' ? mobileCrop : undefined}
      onAIExpand={originalImageUrl ? handleExpandImage : undefined}
      aiExpandDirections={['top', 'bottom', 'left', 'right', 'all']}
      aiExpandDefaultPercent={40}
      aiExpandMinPercent={20}
      aiExpandMaxPercent={60}
      aiExpandStep={10}
      aiExpandCostCredits={10}
    />
  </>
  )
}

