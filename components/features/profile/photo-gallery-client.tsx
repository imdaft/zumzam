'use client'

import { useState } from 'react'
import { PhotoGallery } from './photo-gallery'
import { Play, Settings } from 'lucide-react'
import type { PortfolioTemplateId, SectionTemplates } from '@/lib/types/templates'
import { PORTFOLIO_SECTION_TEMPLATES } from '@/lib/constants/template-configs'
import { useProfileTemplates } from '@/hooks/use-profile-templates'
import { useAuth } from '@/lib/contexts/auth-context'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getVideoEmbedUrl, getVideoThumbnail } from '@/lib/utils/video-embed'

import { cn } from '@/lib/utils'

interface PhotoGalleryClientProps {
  photos?: string[]
  videos?: string[]
  videoCover?: string | null
  profileId: string
  profileSlug: string
  isOwner: boolean
  initialTemplates?: SectionTemplates
  variant?: TemplateVariant // НОВЫЙ проп
}

export function PhotoGalleryClient({
  photos,
  videos,
  videoCover,
  profileId,
  profileSlug,
  isOwner,
  initialTemplates,
  variant, // НОВЫЙ проп
}: PhotoGalleryClientProps) {
  const { isClient } = useAuth()
  const showOwnerControls = isOwner && !isClient
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const { getTemplate, updateTemplate, variant: currentVariant } = useProfileTemplates({
    profileId,
    initialTemplates,
    variant, // Передаем variant
  })
  
  const rawTemplate = getTemplate('portfolio')
  const currentTemplate: PortfolioTemplateId =
    rawTemplate === 'variant1' || rawTemplate === 'variant2' || rawTemplate === 'variant3'
      ? (rawTemplate as PortfolioTemplateId)
      : 'variant1'

  const handleTemplateChange = async (templateId: PortfolioTemplateId) => {
    await updateTemplate('portfolio', templateId)
    setIsDropdownOpen(false) // Закрываем dropdown после выбора
  }

  return (
    <section
      id="portfolio"
      className="bg-white rounded-[32px] p-4 sm:p-6 md:p-8 shadow-sm scroll-mt-24"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Фото и видео</h2>

        {showOwnerControls && (
          <div className="flex items-center gap-2">
            {/* Индикатор текущего варианта */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-full text-xs text-slate-600 font-medium">
              {currentVariant === 'mobile' ? '📱 Мобильная' : '💻 Десктоп'}
            </div>
            
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all"
                  type="button"
                  aria-label="Настройки дизайна"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {/* Заголовок с вариантом */}
                <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 border-b">
                  {currentVariant === 'mobile' ? '📱 Мобильная версия' : '💻 Десктопная версия'}
                </div>
                
                {PORTFOLIO_SECTION_TEMPLATES.templates.map((template) => (
                  <DropdownMenuItem
                    key={template.id}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleTemplateChange(template.id as PortfolioTemplateId)
                    }}
                    className={`cursor-pointer ${
                      currentTemplate === template.id
                        ? 'bg-orange-50 text-orange-700 font-medium'
                        : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-xs text-slate-500">{template.description}</div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      
      {/* Рендерим в зависимости от выбранного шаблона */}
      {currentTemplate === 'variant1' && <GalleryVariant1 photos={photos || []} videos={videos || []} videoCover={videoCover} />}
      {currentTemplate === 'variant2' && <GalleryVariant2 photos={photos || []} videos={videos || []} videoCover={videoCover} />}
      {currentTemplate === 'variant3' && <GalleryVariant3 photos={photos || []} videos={videos || []} videoCover={videoCover} />}
    </section>
  )
}

// Вариант 1: Классическая masonry сетка
function GalleryVariant1({ photos, videos, videoCover }: { photos: string[], videos: string[], videoCover?: string | null }) {
  return (
    <div className="space-y-3">
      {/* Videos - выводим первыми как iframe */}
      {videos.length > 0 && (
        <div className={photos.length > 0 ? "mb-4" : ""}>
          <div className="space-y-3">
            {videos.map((url: string, i: number) => {
              const embedUrl = getVideoEmbedUrl(url)
              if (!embedUrl) return null
              
              return (
                <div key={`video-${i}`} className="w-full">
                  <div className="aspect-video rounded-[28px] overflow-hidden bg-slate-900 relative">
                     {/* Если есть обложка и это первое видео, можно было бы использовать её, но для Iframe это сложнее.
                         В masonry варианте видео обычно сразу iframe. Оставим как есть или используем как постер?
                         Обычно iframe грузится сразу. */}
                    <iframe
                      src={embedUrl}
                      title={`Video ${i + 1}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
      
      {/* Photos - masonry сетка */}
      {photos.length > 0 && <PhotoGallery photos={photos} />}
    </div>
  )
}

// Вариант 2: Горизонтальный слайдер (карусель)
function GalleryVariant2({ photos, videos, videoCover }: { photos: string[], videos: string[], videoCover?: string | null }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  
  // Объединяем видео и фото в один массив медиа
  const allMedia = [
    ...videos.map(url => ({ type: 'video' as const, url })),
    ...photos.map(url => ({ type: 'photo' as const, url }))
  ]
  
  if (allMedia.length === 0) return null
  
  const currentMedia = allMedia[currentIndex]

  return (
    <div className="space-y-3">
      {/* Главное изображение/видео */}
      <div className="relative aspect-video rounded-[28px] overflow-hidden bg-slate-100">
        {currentMedia.type === 'photo' ? (
          <img
            src={currentMedia.url}
            alt={`Медиа ${currentIndex + 1}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-slate-900 relative">
            {/* Если есть обложка и это видео - показываем её (или iframe) */}
             {/* Для простоты в карусели сразу iframe */}
            <iframe
              src={getVideoEmbedUrl(currentMedia.url) || ''}
              title={`Video ${currentIndex + 1}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        )}
        
        {/* Навигация */}
        {allMedia.length > 1 && (
          <>
            <button
              onClick={() => setCurrentIndex(prev => prev === 0 ? allMedia.length - 1 : prev - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all z-10"
            >
              ←
            </button>
            <button
              onClick={() => setCurrentIndex(prev => prev === allMedia.length - 1 ? 0 : prev + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all z-10"
            >
              →
            </button>
          </>
        )}
        
        {/* Счётчик */}
        <div className="absolute bottom-3 right-3 px-3 py-1 bg-black/60 text-white text-sm rounded-full backdrop-blur-sm z-10">
          {currentIndex + 1} / {allMedia.length}
        </div>
      </div>
      
      {/* Превью */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
        {allMedia.map((media, index) => {
          return (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-[18px] overflow-hidden border-2 transition-all relative ${
                index === currentIndex 
                  ? 'border-orange-500 scale-105' 
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              {media.type === 'photo' ? (
                <img
                  src={media.url}
                  alt={`Превью ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                // Видео
                <div className="w-full h-full relative bg-slate-900">
                  {/* Если есть videoCover и это первое видео - можно показать его. Но тут превью. */}
                  {index === 0 && videoCover ? (
                     <img src={videoCover} className="w-full h-full object-cover" alt="Video cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center text-white/50">
                        <Play className="w-6 h-6" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="w-6 h-6 text-white drop-shadow-md" fill="currentColor" />
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Вариант 3: Компактная сетка с lightbox для всех медиа
function GalleryVariant3({ photos, videos, videoCover }: { photos: string[], videos: string[], videoCover?: string | null }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  
  // Объединяем видео и фото в один массив медиа
  const allMedia = [
    ...videos.map(url => ({ type: 'video' as const, url })),
    ...photos.map(url => ({ type: 'photo' as const, url }))
  ]
  
  if (allMedia.length === 0) return null
  
  const goToNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % allMedia.length)
    }
  }
  
  const goToPrev = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + allMedia.length) % allMedia.length)
    }
  }
  
  const selectedMedia = selectedIndex !== null ? allMedia[selectedIndex] : null
  
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {allMedia.map((media, index) => {
          const isFeatured = index === 0 && media.type === 'video'
          
          return (
            <div
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "rounded-[24px] overflow-hidden hover:scale-[1.02] transition-transform cursor-pointer relative group bg-slate-100",
                isFeatured 
                  ? "col-span-2 md:col-span-3 md:row-span-2 aspect-video md:aspect-auto" 
                  : "aspect-square"
              )}
            >
              {media.type === 'photo' ? (
                // Фото - квадрат
                <img
                  src={media.url}
                  alt={`Фото ${index + 1}`}
                  className="w-full h-full object-cover bg-slate-100"
                />
              ) : (
                // Видео - квадратная карточка с размытым фоном
                <div className="w-full h-full relative bg-slate-900 group/video">
                  {/* Фон/Обложка */}
                  <div className="absolute inset-0">
                    {index === 0 && videoCover ? (
                        // Если это главное видео и есть обложка
                        <img 
                            src={videoCover} 
                            alt="Video cover" 
                            className="w-full h-full object-cover opacity-80 group-hover/video:scale-105 transition-all duration-500" 
                        />
                    ) : (
                        // Иначе fallback на iframe blur
                        <iframe
                        src={getVideoEmbedUrl(media.url) || ''}
                        title={`Background ${index + 1}`}
                        className="w-full h-full border-0 pointer-events-none blur-lg scale-x-125 scale-y-[2] opacity-95"
                        />
                    )}
                     <div className="absolute inset-0 bg-black/20" />
                  </div>
                  
                  {/* Кнопка Play по центру (если есть обложка) или iframe (если нет) */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {index === 0 && videoCover ? (
                         <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg group-hover/video:scale-110 transition-transform">
                            <Play className="w-7 h-7 text-white ml-1" fill="currentColor" />
                         </div>
                    ) : (
                        <div className={cn(
                        "w-full",
                        isFeatured ? "h-full" : "aspect-video" 
                        )}>
                        <iframe
                            src={getVideoEmbedUrl(media.url) || ''}
                            title={`Video ${index + 1}`}
                            className="w-full h-full border-0 pointer-events-none rounded-lg shadow-2xl"
                        />
                        </div>
                    )}
                  </div>
                  
                  {/* Бейдж Video */}
                  <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-[18px]">
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">Video</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {/* Lightbox модалка для всех медиа */}
      {selectedMedia && selectedIndex !== null && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedIndex(null)}
        >
          <div 
            className="relative w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Кнопка закрытия */}
            <button
              onClick={() => setSelectedIndex(null)}
              className="absolute -top-12 right-0 text-white hover:text-orange-500 transition-colors z-10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Стрелки навигации */}
            {allMedia.length > 1 && (
              <>
                <button
                  onClick={goToPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all z-10"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all z-10"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
            
            {/* Контент */}
            <div className="w-full aspect-video rounded-[28px] overflow-hidden bg-slate-900">
              {selectedMedia.type === 'photo' ? (
                <img
                  src={selectedMedia.url}
                  alt={`Фото ${selectedIndex + 1}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <iframe
                  src={getVideoEmbedUrl(selectedMedia.url) || ''}
                  title={`Video ${selectedIndex + 1}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              )}
            </div>
            
            {/* Счётчик */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 text-white text-sm rounded-full backdrop-blur-sm">
              {selectedIndex + 1} / {allMedia.length}
            </div>
          </div>
        </div>
      )}
    </>
  )
}


