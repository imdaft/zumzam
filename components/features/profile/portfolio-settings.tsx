'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Camera, Video, X, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

interface PortfolioSettingsProps {
  profileId: string
  initialPhotos?: string[]
  initialVideos?: string[]
  initialVideoCover?: string | null
  hideHeader?: boolean
}

export function PortfolioSettings({ profileId, initialPhotos = [], initialVideos = [], initialVideoCover = null, hideHeader }: PortfolioSettingsProps) {
  const router = useRouter()
  const [photos, setPhotos] = useState<string[]>(initialPhotos)
  const [videos, setVideos] = useState<string[]>(initialVideos)
  const [videoCover, setVideoCover] = useState<string | null>(initialVideoCover)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [videoUrlInput, setVideoUrlInput] = useState('')

  // Загрузка обложки видео
  const handleVideoCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setError(null)

    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('Файл слишком большой (макс 5МБ)')
      if (!file.type.startsWith('image/')) throw new Error('Файл должен быть изображением')

      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'portfolio')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Ошибка загрузки файла')

      const { url } = await response.json()
      setVideoCover(url)
    } catch (err: any) {
      console.error('Video cover upload error:', err)
      setError(err.message || 'Ошибка загрузки обложки')
      toast.error(err.message || 'Ошибка загрузки обложки')
    } finally {
      setIsLoading(false)
      event.target.value = ''
    }
  }

  // Удаление обложки видео
  const handleVideoCoverRemove = () => {
    setVideoCover(null)
  }

  // Загрузка фото
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    setIsLoading(true)
    setError(null)

    try {
      const uploadedUrls: string[] = []

      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) throw new Error(`Файл ${file.name} слишком большой (макс 10МБ)`)
        if (!file.type.startsWith('image/')) throw new Error(`${file.name} - не изображение`)

        const formData = new FormData()
        formData.append('file', file)
        formData.append('bucket', 'portfolio')

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Ошибка загрузки файла')
        }

        const { url } = await response.json()
        uploadedUrls.push(url)
      }

      const newPhotos = [...photos, ...uploadedUrls]
      setPhotos(newPhotos)
      await autoSave(newPhotos, videos)
    } catch (err: any) {
      console.error('Photo upload error:', err)
      setError(err.message || 'Ошибка загрузки фото')
      toast.error(err.message || 'Ошибка загрузки фото')
    } finally {
      setIsLoading(false)
      event.target.value = ''
    }
  }

  // Автосохранение
  const autoSave = async (newPhotos: string[], newVideos: string[]) => {
    try {
      const response = await fetch(`/api/profiles/${profileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photos: newPhotos,
          videos: newVideos,
          video_cover: videoCover,
        }),
      })
      
      if (!response.ok) throw new Error('Не удалось сохранить')
      toast.success('Сохранено')
    } catch (err) {
      console.error('Auto-save error:', err)
      toast.error('Ошибка сохранения')
    }
  }

  // Удаление фото
  const handlePhotoRemove = async (url: string) => {
    const newPhotos = photos.filter(p => p !== url)
    setPhotos(newPhotos)
    await autoSave(newPhotos, videos)
  }

  // Добавление видео
  const handleAddVideoUrl = async () => {
    if (!videoUrlInput) return
    const allowedDomains = [
      'youtube.com', 
      'youtu.be', 
      'rutube.ru', 
      'vk.com', 
      'vkvideo.ru',
      'yandex.ru/video',
      'ya.ru',
      'kinescope.io'
    ]
    const isValid = allowedDomains.some(domain => videoUrlInput.toLowerCase().includes(domain))
    if (!isValid) {
      setError('Поддерживаются ссылки: YouTube, RuTube, VK, Яндекс.Видео, Kinescope')
      return
    }
    const newVideos = [...videos, videoUrlInput]
    setVideos(newVideos)
    setVideoUrlInput('')
    setError(null)
    await autoSave(photos, newVideos)
  }

  // Удаление видео
  const handleVideoRemove = async (url: string) => {
    const newVideos = videos.filter(v => v !== url)
    setVideos(newVideos)
    await autoSave(photos, newVideos)
  }

  const content = (
    <>
      {!hideHeader && (
        <CardHeader className="border-b border-slate-200 p-4">
          <CardTitle className="text-base sm:text-lg font-bold text-slate-900 leading-tight text-left">
            Фото и видео
          </CardTitle>
        </CardHeader>
      )}

      <CardContent className={hideHeader ? "p-0 space-y-0" : "p-4 space-y-4"}>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Фотографии */}
        <div className={hideHeader ? "px-3 pt-3 pb-2" : ""}>
          <Card className={hideHeader ? "rounded-[24px]" : "border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.06)] rounded-[24px]"}>
          <CardHeader className="p-4 border-b border-slate-200">
            <CardTitle className="text-base font-bold text-slate-900 text-left leading-tight">Фотографии</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-4">
            <input type="file" id="portfolio-photo-upload" accept="image/*" multiple onChange={handlePhotoUpload} disabled={isLoading} className="hidden" />
            <Button type="button" variant="outline" className="rounded-full" onClick={() => document.getElementById('portfolio-photo-upload')?.click()} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
              Загрузить фото
            </Button>
            <span className="text-[13px] text-slate-500">
              {photos.length} фото загружено
            </span>
          </div>

          {photos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {photos.map((url, index) => (
                <div key={url} className="relative group aspect-square rounded-[24px] overflow-hidden bg-gray-100 border border-slate-200">
                  <img src={url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <button 
                    type="button" 
                    onClick={() => handlePhotoRemove(url)} 
                    className="absolute top-2 right-2 bg-white/90 hover:bg-red-500 hover:text-white text-slate-700 p-1.5 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.12)] opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-[24px] border border-dashed border-slate-200">
              <Camera className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">Нет загруженных фотографий</p>
              <p className="text-[13px] text-slate-500">Нажмите кнопку выше, чтобы добавить фото</p>
            </div>
          )}
        </CardContent>
        </Card>
      </div>

      {/* Видео */}
      <div className={hideHeader ? "px-3 pb-3" : ""}>
        <Card className={hideHeader ? "rounded-[24px]" : "border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.06)] rounded-[24px]"}>
          <CardHeader className="p-4 border-b border-slate-200">
            <CardTitle className="text-base font-bold text-slate-900 text-left leading-tight">Видео</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1 w-full">
              <Input 
                placeholder="Вставьте ссылку на видео..." 
                value={videoUrlInput} 
                onChange={(e) => setVideoUrlInput(e.target.value)}
                className="h-12 rounded-[18px]"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddVideoUrl() } }}
              />
            </div>
            <Button type="button" variant="outline" className="rounded-full" onClick={handleAddVideoUrl} disabled={!videoUrlInput}>
              <Video className="mr-2 h-4 w-4" /> 
              Добавить
            </Button>
          </div>

          {/* Обложка видео */}
          {videos.length > 0 && (
            <div className="p-4 bg-slate-50 rounded-[18px] border border-slate-200">
              <label className="text-sm font-medium text-slate-700 mb-3 block">Обложка для видео (опционально)</label>
              <div className="flex items-start gap-4">
                <div className="relative w-32 h-20 rounded-[24px] overflow-hidden bg-white border border-slate-200 shrink-0">
                  {videoCover ? (
                    <>
                      <img src={videoCover} alt="Обложка" className="w-full h-full object-cover" />
                      <button 
                        onClick={handleVideoCoverRemove}
                        className="absolute top-1 right-1 p-1 bg-white/90 rounded-full text-red-500 hover:bg-red-50 transition-colors shadow-[0_2px_10px_rgba(0,0,0,0.12)]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Video className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input 
                      type="file" 
                      id="video-cover-upload" 
                      accept="image/*" 
                      onChange={handleVideoCoverUpload} 
                      className="hidden" 
                      disabled={isLoading}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      className="rounded-full h-9 text-xs"
                      onClick={() => document.getElementById('video-cover-upload')?.click()}
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Camera className="w-3 h-3 mr-2" />}
                      {videoCover ? 'Заменить обложку' : 'Загрузить обложку'}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 max-w-[200px] leading-snug">
                    Обложка будет отображаться вместо плеера до начала воспроизведения
                  </p>
                </div>
              </div>
            </div>
          )}

          {videos.length > 0 && (
            <div className="space-y-3">
              {videos.map((url, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-[18px] border border-slate-200 bg-white group hover:border-orange-200 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                    <Video className="h-5 w-5" />
                  </div>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="flex-1 text-[13px] text-blue-600 hover:underline truncate font-medium">
                    {url}
                  </a>
                  <button 
                    type="button" 
                    onClick={() => handleVideoRemove(url)} 
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {videos.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-[13px]">
              Видео пока не добавлены
            </div>
          )}
        </CardContent>
        </Card>
      </div>
      </CardContent>
    </>
  )

  // Для мобильной версии (hideHeader=true) - без Card обертки
  if (hideHeader) {
    return <div className="space-y-0">{content}</div>
  }

  // Для десктопной версии - с Card оберткой
  return (
    <Card className="shadow-[0_2px_8px_rgba(0,0,0,0.06)] rounded-[24px] border border-slate-200">
      {content}
    </Card>
  )
}

