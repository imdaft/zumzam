'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, ChevronRight, X, CheckCircle2 } from 'lucide-react'
import { ImageCropper } from '@/components/shared/image-cropper'

interface WizardVisualsProps {
  data: any
  onNext: (data: any) => void
  onSkip: () => void
}

export function WizardVisuals({ data, onNext, onSkip }: WizardVisualsProps) {
  const [logo, setLogo] = useState<string | null>(data.logo || null)
  const [coverPhoto, setCoverPhoto] = useState<string | null>(data.cover_photo || null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCropperOpen, setIsCropperOpen] = useState(false)
  const [tempCoverSrc, setTempCoverSrc] = useState<string | null>(null)

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert('Файл слишком большой (максимум 5MB)')
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'portfolio')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Ошибка загрузки')

      const { url } = await response.json()
      setLogo(url)
    } catch (err: any) {
      alert(err.message || 'Ошибка загрузки логотипа')
    } finally {
      setIsLoading(false)
      e.target.value = ''
    }
  }

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      alert('Файл слишком большой (максимум 10MB)')
      return
    }

    const reader = new FileReader()
    reader.addEventListener('load', () => {
      setTempCoverSrc(reader.result as string)
      setIsCropperOpen(true)
      e.target.value = ''
    })
    reader.readAsDataURL(file)
  }

  const handleCropComplete = async (blob: Blob) => {
    setIsCropperOpen(false)
    setIsLoading(true)

    try {
      const fileName = `cover-${Date.now()}.jpg`
      const file = new File([blob], fileName, { type: 'image/jpeg' })
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'portfolio')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Ошибка загрузки')

      const { url } = await response.json()
      setCoverPhoto(url)
    } catch (err: any) {
      alert(err.message || 'Ошибка загрузки обложки')
    } finally {
      setIsLoading(false)
      setTempCoverSrc(null)
    }
  }

  const handleNext = () => {
    onNext({ logo, cover_photo: coverPhoto })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Визуальное оформление</h1>
      <p className="text-gray-500 mb-6">Добавьте логотип и обложку (можно пропустить)</p>

      <div className="space-y-6">
        {/* Логотип */}
        <div>
          <label className="text-sm font-semibold text-gray-900 mb-2 block">Логотип</label>
          <p className="text-xs text-gray-500 mb-3">Квадратный формат, рекомендуется 500×500px</p>

          <input
            type="file"
            id="logo-upload"
            accept="image/*"
            onChange={handleLogoUpload}
            disabled={isLoading}
            className="hidden"
          />

          {!logo ? (
            <button
              type="button"
              onClick={() => document.getElementById('logo-upload')?.click()}
              disabled={isLoading}
              className="w-full border-2 border-dashed border-gray-200 rounded-[16px] p-8 hover:border-orange-500 hover:bg-orange-50/50 transition-all"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-gray-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-900 mb-1">Загрузите логотип</p>
                  <p className="text-xs text-gray-500">PNG, JPG до 5MB</p>
                </div>
              </div>
            </button>
          ) : (
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-[16px] overflow-hidden border-2 border-gray-200">
                <img src={logo} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <button
                type="button"
                onClick={() => setLogo(null)}
                className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 text-white hover:bg-red-600 flex items-center justify-center shadow-lg"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>Логотип загружен</span>
              </div>
            </div>
          )}
        </div>

        {/* Обложка */}
        <div>
          <label className="text-sm font-semibold text-gray-900 mb-2 block">Обложка</label>
          <p className="text-xs text-gray-500 mb-3">Формат 16:9, минимум 1920×1080px</p>

          <input
            type="file"
            id="cover-upload"
            accept="image/*"
            onChange={handleCoverUpload}
            disabled={isLoading}
            className="hidden"
          />

          {!coverPhoto ? (
            <button
              type="button"
              onClick={() => document.getElementById('cover-upload')?.click()}
              disabled={isLoading}
              className="w-full border-2 border-dashed border-gray-200 rounded-[16px] aspect-video hover:border-orange-500 hover:bg-orange-50/50 transition-all overflow-hidden bg-gray-50"
            >
              <div className="flex flex-col items-center justify-center h-full gap-3 p-8">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-gray-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-900 mb-1">Загрузите обложку</p>
                  <p className="text-xs text-gray-500">PNG, JPG до 10MB</p>
                </div>
              </div>
            </button>
          ) : (
            <div>
              <div className="relative w-full aspect-video rounded-[16px] overflow-hidden border-2 border-gray-200 mb-2">
                <img src={coverPhoto} alt="Cover" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setCoverPhoto(null)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white hover:bg-red-600 flex items-center justify-center shadow-lg"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>Обложка загружена</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Кнопки */}
      <div className="mt-8 flex gap-3 pb-20 lg:pb-0">
        <Button
          onClick={onSkip}
          variant="outline"
          className="flex-1 h-12 rounded-full font-semibold"
        >
          Пропустить
        </Button>
        <Button
          onClick={handleNext}
          className="flex-1 h-12 bg-orange-500 hover:bg-orange-600 rounded-full font-semibold"
        >
          Далее
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>

      <ImageCropper
        imageSrc={tempCoverSrc}
        isOpen={isCropperOpen}
        onClose={() => {
          setIsCropperOpen(false)
          setTempCoverSrc(null)
        }}
        onCropComplete={handleCropComplete}
        aspect={16 / 9}
      />
    </div>
  )
}

