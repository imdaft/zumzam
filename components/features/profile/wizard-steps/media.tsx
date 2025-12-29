'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ImageIcon, X, CheckCircle2, Loader2, Video, Plus, Trash2 } from 'lucide-react'

interface WizardMediaProps {
  data: any
  onNext: (data: any) => void
  onSkip: () => void
}

export function WizardMedia({ data, onNext, onSkip }: WizardMediaProps) {
  const [photos, setPhotos] = useState<string[]>(data.photos || [])
  const [videos, setVideos] = useState<string[]>(data.videos || [])
  const [newVideoUrl, setNewVideoUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const availableSlots = 6 - photos.length
    if (files.length > availableSlots) {
      alert(`Можно добавить максимум ${availableSlots} ${availableSlots === 1 ? 'фото' : 'фото'}`)
      return
    }

    setIsLoading(true)
    const uploadedUrls: string[] = []
    
    try {
      // Загружаем все фото параллельно
      const uploadPromises = files.map(async (file) => {
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`Файл ${file.name} слишком большой (максимум 10MB)`)
        }

        const formData = new FormData()
        formData.append('file', file)
        formData.append('bucket', 'portfolio')

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) throw new Error(`Ошибка загрузки ${file.name}`)

        const { url } = await response.json()
        return url
      })

      const urls = await Promise.all(uploadPromises)
      uploadedUrls.push(...urls)
      setPhotos([...photos, ...uploadedUrls])
    } catch (err: any) {
      alert(err.message || 'Ошибка загрузки фото')
      // Если загрузились хотя бы некоторые - добавляем их
      if (uploadedUrls.length > 0) {
        setPhotos([...photos, ...uploadedUrls])
      }
    } finally {
      setIsLoading(false)
      e.target.value = ''
    }
  }

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index))
  }

  const handleAddVideo = () => {
    if (!newVideoUrl.trim()) {
      alert('Введите ссылку на видео')
      return
    }

    // Проверка на YouTube, Vimeo, Rutube
    const isValidUrl = 
      newVideoUrl.includes('youtube.com') ||
      newVideoUrl.includes('youtu.be') ||
      newVideoUrl.includes('vimeo.com') ||
      newVideoUrl.includes('rutube.ru')

    if (!isValidUrl) {
      alert('Поддерживаются только ссылки на YouTube, Vimeo и Rutube')
      return
    }

    if (videos.length >= 3) {
      alert('Можно добавить максимум 3 видео')
      return
    }

    setVideos([...videos, newVideoUrl])
    setNewVideoUrl('')
  }

  const handleRemoveVideo = (index: number) => {
    setVideos(videos.filter((_, i) => i !== index))
  }

  const handleNext = async () => {
    setIsSubmitting(true)
    await onNext({ photos, videos })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Фото и видео</h1>
      <p className="text-gray-500 mb-6">Добавьте фотографии и видео (можно пропустить)</p>

      {/* Фотографии */}
      <div className="mb-8">
        <label className="text-sm font-semibold text-gray-900 mb-3 block">
          Галерея (до 6 фото)
        </label>

        <input
          type="file"
          id="photo-upload"
          accept="image/*"
          multiple
          onChange={handlePhotoUpload}
          disabled={isLoading || photos.length >= 6}
          className="hidden"
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Загруженные фото */}
          {photos.map((photo, idx) => (
            <div key={idx} className="relative aspect-square rounded-[12px] overflow-hidden border-2 border-gray-200">
              <img src={photo} alt={`Фото ${idx + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemovePhoto(idx)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white hover:bg-red-600 flex items-center justify-center shadow-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}

          {/* Кнопка добавить */}
          {photos.length < 6 && (
            <button
              type="button"
              onClick={() => document.getElementById('photo-upload')?.click()}
              disabled={isLoading}
              className="aspect-square rounded-[12px] border-2 border-dashed border-gray-200 hover:border-orange-500 hover:bg-orange-50/50 transition-all flex flex-col items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  </div>
                  <span className="text-xs font-medium text-gray-500">Добавить</span>
                </>
              )}
            </button>
          )}
        </div>

        {photos.length > 0 && (
          <div className="mt-3 flex items-center gap-2 text-xs text-green-600">
            <CheckCircle2 className="w-4 h-4" />
            <span>Загружено {photos.length} {photos.length === 1 ? 'фото' : 'фото'}</span>
          </div>
        )}
      </div>

      {/* Видео */}
      <div>
        <label className="text-sm font-semibold text-gray-900 mb-3 block">
          Видео (до 3 ссылок)
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Поддерживаются YouTube, Vimeo, Rutube
        </p>

        {/* Список добавленных видео */}
        {videos.length > 0 && (
          <div className="space-y-2 mb-3">
            {videos.map((video, idx) => (
              <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded-[12px] border border-gray-200">
                <Video className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="flex-1 text-sm text-gray-700 truncate">{video}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveVideo(idx)}
                  className="shrink-0 w-7 h-7 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Поле добавления видео */}
        {videos.length < 3 && (
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={newVideoUrl}
              onChange={(e) => setNewVideoUrl(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddVideo()
                }
              }}
              className="h-12 rounded-[12px]"
            />
            <Button
              type="button"
              onClick={handleAddVideo}
              variant="outline"
              className="h-12 px-4 rounded-[12px] shrink-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        )}

        {videos.length > 0 && (
          <div className="mt-3 flex items-center gap-2 text-xs text-green-600">
            <CheckCircle2 className="w-4 h-4" />
            <span>Добавлено {videos.length} {videos.length === 1 ? 'видео' : 'видео'}</span>
          </div>
        )}
      </div>

      {/* Кнопки */}
      <div className="mt-8 flex gap-3 pb-20 lg:pb-0">
        <Button
          onClick={onSkip}
          variant="outline"
          className="flex-1 h-12 rounded-full font-semibold"
          disabled={isSubmitting}
        >
          Пропустить
        </Button>
        <Button
          onClick={handleNext}
          className="flex-1 h-12 bg-orange-500 hover:bg-orange-600 rounded-full font-semibold"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Сохранение...
            </>
          ) : (
            'Далее'
          )}
        </Button>
      </div>
    </div>
  )
}

