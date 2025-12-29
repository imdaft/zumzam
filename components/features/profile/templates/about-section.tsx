/**
 * Базовый компонент для секции "О нас" профиля
 * Поддерживает 3 шаблона: classic, modern, minimal
 */

'use client'

import Image from 'next/image'
import { Star, Globe, Instagram, Send } from 'lucide-react'
import type { AboutTemplateId } from '@/lib/types/templates'
import type { CropData } from '@/lib/types/crop'
import { ProfileSettingsButton } from '@/components/features/profile/profile-settings-button'

export interface AboutSectionData {
  profileSlug: string
  profileUserId: string
  coverPhoto: string
  logo?: string
  displayName: string
  verified: boolean
  category?: string
  venueType?: string
  rating: number
  reviewsCount: number
  description?: string
  website?: string
  socialLinks?: {
    instagram?: string
    telegram?: string
    vk?: string
    whatsapp?: string
  }
  isOwner?: boolean
}

interface AboutSectionProps {
  data: AboutSectionData
  template?: AboutTemplateId
  crop?: CropData
  onTemplateChange?: (template: AboutTemplateId) => void
}

export function AboutSection({ data, template = 'classic', crop, onTemplateChange }: AboutSectionProps) {
  // Рендерим разные шаблоны
  switch (template) {
    case 'modern':
      return <AboutSectionModern data={data} crop={crop} onTemplateChange={onTemplateChange} />
    case 'minimal':
      return <AboutSectionMinimal data={data} crop={crop} onTemplateChange={onTemplateChange} />
    case 'classic':
    default:
      return <AboutSectionClassic data={data} crop={crop} onTemplateChange={onTemplateChange} />
  }
}

// Общие компоненты для всех шаблонов
function RatingBadge({ rating, reviewsCount }: { rating: number; reviewsCount: number }) {
  const displayRating = rating || 5.0
  const displayReviewsCount = reviewsCount || 0

  return (
    <a 
      href="#reviews" 
      className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full hover:bg-slate-200 transition-colors cursor-pointer group"
    >
      {/* Одна звезда вместо 5 */}
      <Star className="w-4 h-4 fill-[#FCE000] text-[#FCE000] transition-transform group-hover:scale-110" />
      
      {/* Цифровой рейтинг */}
      <span className="font-semibold text-slate-900">{displayRating.toFixed(1)}</span>
      
      {/* Количество отзывов - только цифра в скобках */}
      <span className="text-slate-500 text-xs">
        ({displayReviewsCount})
      </span>
    </a>
  )
}

function SocialLinks({ website, socialLinks }: Pick<AboutSectionData, 'website' | 'socialLinks'>) {
  return (
    <>
      {website && (
        <a 
          href={website.startsWith('http') ? website : `https://${website}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          title="Сайт"
        >
          <Globe className="w-4 h-4 text-slate-600" />
        </a>
      )}
      
      {socialLinks?.instagram && (
        <a 
          href={socialLinks.instagram.startsWith('http') ? socialLinks.instagram : `https://instagram.com/${socialLinks.instagram.replace('@', '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 flex items-center justify-center transition-colors"
          title="Instagram"
        >
          <Instagram className="w-4 h-4 text-white" />
        </a>
      )}
      
      {socialLinks?.telegram && (
        <a 
          href={socialLinks.telegram.startsWith('http') ? socialLinks.telegram : `https://t.me/${socialLinks.telegram.replace('@', '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-full bg-[#0088cc] hover:bg-[#0077b3] flex items-center justify-center transition-colors"
          title="Telegram"
        >
          <Send className="w-4 h-4 text-white" />
        </a>
      )}
      
      {socialLinks?.vk && (
        <a 
          href={socialLinks.vk.startsWith('http') ? socialLinks.vk : `https://vk.com/${socialLinks.vk}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          title="ВКонтакте"
        >
          <svg className="w-4 h-4 text-slate-600" viewBox="0 0 256 256" fill="currentColor">
            <path d="M245.7,70.4c1.8,5-3.9,16.8-18.4,36.1c-23.8,31.7-26.4,28.7-6.8,47.1c18.9,17.6,22.9,26.1,23.5,27.2 c0,0,7.9,13.8-8.7,13.9l-31.5,0.5c-6.8,1.4-15.7-4.8-15.7-4.8c-11.8-8.1-22.9-29.1-31.5-26.4c0,0-8.8,2.8-8.6,21.8 c0.1,4.1-1.8,6.3-1.8,6.3s-2.2,2.3-6.5,2.7h-14.1C94.4,196.6,67,168,67,168s-30-31-56.3-92.8c-1.7-4.1,0.1-6,0.1-6s1.8-2.3,7-2.3 l33.7-0.2c3.2,0.5,5.4,2.2,5.4,2.2s2,1.4,2.9,3.9C65.4,86.5,72.5,99,72.5,99c12.3,25.3,20.6,29.6,25.4,27c0,0,6.3-3.8,4.9-34.4 c-0.5-11.1-3.6-16.1-3.6-16.1c-2.8-3.8-8.1-4.9-10.4-5.3c-1.8-0.2,1.2-4.7,5.3-6.6c6-2.9,16.7-3.1,29.4-2.9 c10,0.1,12.8,0.7,16.6,1.6c11.7,2.8,7.7,13.6,7.7,39.7c0,8.4-1.6,20,4.4,23.8c2.6,1.7,9,0.2,24.7-26.5c0,0,7.4-12.8,13.1-27.6 c1-2.7,3.1-3.8,3.1-3.8s2-1.1,4.7-0.7l35.4-0.2C243.9,65.5,245.7,70.4,245.7,70.4z"/>
          </svg>
        </a>
      )}
      
      {socialLinks?.whatsapp && (
        <a 
          href={`https://wa.me/${socialLinks.whatsapp.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-full bg-[#25D366] hover:bg-[#20bd5a] flex items-center justify-center transition-colors"
          title="WhatsApp"
        >
          <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413"/></svg>
        </a>
      )}
    </>
  )
}

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-500 flex-shrink-0 mt-0.5" title="Профиль верифицирован">
      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </span>
  )
}

// ============= ШАБЛОН 1: КЛАССИЧЕСКИЙ =============
function AboutSectionClassic({ data, crop }: { data: AboutSectionData; crop?: CropData; onTemplateChange?: (template: AboutTemplateId) => void }) {
  // Debug: проверяем данные кропа
  console.log('[AboutSectionClassic] Received crop:', crop)
  
  // Применяем кроп
  // Classic - горизонтальная обложка (16:9), координаты применяются напрямую
  const coverStyle = crop ? {
    objectFit: 'cover' as const,
    objectPosition: `${50 + crop.x}% ${50 + crop.y}%`,
    transform: `scale(${crop.zoom})`,
    transformOrigin: 'center center',
  } : {
    objectFit: 'cover' as const,
  }
  
  console.log('[AboutSectionClassic] Applied coverStyle:', coverStyle)

  return (
    <section 
      id="about" 
      className="bg-white rounded-[32px] overflow-hidden shadow-sm"
    >
      {/* Обложка сверху */}
      <div className="relative h-[180px] sm:h-[220px] md:h-[280px] w-full overflow-hidden bg-slate-100">
        <Image 
          src={data.coverPhoto}
          alt={data.displayName}
          fill
          className="transition-transform duration-300"
          style={coverStyle}
          priority
        />
        
        {/* Кнопка настроек (видна только владельцу) */}
        <ProfileSettingsButton 
          profileSlug={data.profileSlug}
          profileUserId={data.profileUserId}
        />
      </div>
      
      {/* Контент внизу */}
      <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8">
        {/* Верхняя часть: Логотип + Название слева, Рейтинг + Соцсети справа */}
        <div className="flex items-center justify-between gap-6 mb-4">
          {/* Левая часть: Логотип и название */}
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            {data.logo && (
              <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-white border-2 border-slate-100 shadow-sm flex-shrink-0">
                <Image 
                  src={data.logo}
                  alt={`${data.displayName} logo`}
                  width={80}
                  height={80}
                  className="w-full h-full object-contain p-1"
                />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 inline-flex items-start gap-1 mb-1">
                <span className="break-words">{data.displayName}</span>
                {data.verified && <VerifiedBadge />}
              </h1>
              {data.category === 'venue' && data.venueType && (
                <div className="text-sm text-slate-500">
                  {data.venueType === 'kids_center' && 'Детский центр'}
                  {data.venueType === 'loft' && 'Лофт / Студия'}
                  {data.venueType === 'cafe' && 'Кафе / Ресторан'}
                  {data.venueType === 'entertainment_center' && 'Парк развлечений'}
                  {data.venueType === 'outdoor' && 'Открытая площадка'}
                  {data.venueType === 'other' && 'Другое'}
                </div>
              )}
            </div>
          </div>

          {/* Правая часть: Соцсети и рейтинг в одну строчку (только на desktop) */}
          <div className="hidden md:flex items-center gap-4 flex-shrink-0">
            <div className="flex gap-2.5">
              <SocialLinks website={data.website} socialLinks={data.socialLinks} />
            </div>
            <div className="scale-110">
              <RatingBadge rating={data.rating} reviewsCount={data.reviewsCount} />
            </div>
          </div>
        </div>
        
        {/* Рейтинг и соцсети на мобильных */}
        <div className="flex md:hidden flex-wrap items-center gap-2 sm:gap-3 mb-4">
          <RatingBadge rating={data.rating} reviewsCount={data.reviewsCount} />
          <SocialLinks website={data.website} socialLinks={data.socialLinks} />
        </div>
        
        {/* Описание */}
        {data.description && (
          <div className="text-sm md:text-base text-slate-600 leading-snug whitespace-pre-wrap">
            {data.description}
          </div>
        )}
      </div>
    </section>
  )
}

// ============= ШАБЛОН 2: СОВРЕМЕННЫЙ =============
function AboutSectionModern({ data, crop }: { data: AboutSectionData; crop?: CropData; onTemplateChange?: (template: AboutTemplateId) => void }) {
  // Применяем кроп
  // Modern - вертикальная обложка (3:4), координаты применяются напрямую
  const coverStyle = crop ? {
    objectFit: 'cover' as const,
    objectPosition: `${50 + crop.x}% ${50 + crop.y}%`,
    transform: `scale(${crop.zoom})`,
    transformOrigin: 'center center',
  } : {
    objectFit: 'cover' as const,
  }

  return (
    <section 
      id="about" 
      className="bg-white rounded-[32px] overflow-hidden shadow-sm"
    >
      <div className="grid md:grid-cols-2 gap-0 md:min-h-[500px]">
        {/* Обложка слева - на всю высоту */}
        <div className="relative h-[280px] md:h-full md:min-h-[500px] overflow-hidden bg-slate-100">
          <Image 
            src={data.coverPhoto}
            alt={data.displayName}
            fill
            className="transition-transform duration-300"
            style={coverStyle}
            priority
          />
          
          {/* Кнопка настроек (видна только владельцу) */}
          <ProfileSettingsButton 
            profileSlug={data.profileSlug}
            profileUserId={data.profileUserId}
          />
        </div>
        
        {/* Контент справа */}
        <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 flex flex-col justify-center">
          {/* Логотип и название - на мобильных в одну строку */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-3 md:mb-0">
              {data.logo && (
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:mb-4 rounded-full overflow-hidden bg-white border-2 border-slate-100 shadow-sm flex-shrink-0">
                  <Image 
                    src={data.logo}
                    alt={`${data.displayName} logo`}
                    width={80}
                    height={80}
                    className="w-full h-full object-contain p-1"
                  />
                </div>
              )}
              <div className="md:mt-0 flex-1">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 inline-flex items-start gap-1 mb-1 md:mb-2">
                  <span>{data.displayName}</span>
                  {data.verified && <VerifiedBadge />}
                </h1>
                {data.category === 'venue' && data.venueType && (
                  <div className="text-sm text-slate-500">
                    {data.venueType === 'kids_center' && 'Детский центр'}
                    {data.venueType === 'loft' && 'Лофт / Студия'}
                    {data.venueType === 'cafe' && 'Кафе / Ресторан'}
                    {data.venueType === 'entertainment_center' && 'Парк развлечений'}
                    {data.venueType === 'outdoor' && 'Открытая площадка'}
                    {data.venueType === 'other' && 'Другое'}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Описание */}
          {data.description && (
            <div className="text-sm md:text-base text-slate-600 leading-snug whitespace-pre-wrap mb-6">
              {data.description}
            </div>
          )}
          
          {/* Рейтинг и соцсети на одной строке */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Рейтинг */}
            <RatingBadge rating={data.rating} reviewsCount={data.reviewsCount} />
            
            {/* Соцсети - если не влезают, переносятся на новую строку */}
            <div className="flex items-center gap-2">
              <SocialLinks website={data.website} socialLinks={data.socialLinks} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============= ШАБЛОН 3: МИНИМАЛИСТИЧНЫЙ =============
function AboutSectionMinimal({ data, crop }: { data: AboutSectionData; crop?: CropData; onTemplateChange?: (template: AboutTemplateId) => void }) {
  // Применяем кроп
  // Minimal - горизонтальная обложка (16:9), координаты применяются напрямую
  const coverStyle = crop ? {
    objectFit: 'cover' as const,
    objectPosition: `${50 + crop.x}% ${50 + crop.y}%`,
    transform: `scale(${crop.zoom})`,
    transformOrigin: 'center center',
  } : {
    objectFit: 'cover' as const,
  }

  return (
    <section 
      id="about" 
      className="bg-white rounded-[32px] overflow-hidden shadow-sm"
    >
      {/* Обложка на фоне с градиентом */}
      <div className="relative h-[350px] sm:h-[400px] md:h-[450px] overflow-hidden bg-slate-100">
        <Image 
          src={data.coverPhoto}
          alt={data.displayName}
          fill
          className="transition-transform duration-300 object-center"
          style={coverStyle}
          priority
        />
        
        {/* Кнопка настроек (видна только владельцу) */}
        <ProfileSettingsButton 
          profileSlug={data.profileSlug}
          profileUserId={data.profileUserId}
        />
        
        {/* Темный градиент для читаемости текста (легкий) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
        
        {/* Контент поверх обложки */}
        <div className="absolute inset-0 px-4 sm:px-6 md:px-8 pb-6 md:pb-8 flex flex-col justify-end">
          {/* Desktop: Логотип сверху, название и рейтинг выровнены по нижней линии */}
          <div className="hidden md:block">
            {/* Логотип */}
            {data.logo && (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-white border-2 border-white/20 shadow-lg mb-4">
                <Image 
                  src={data.logo}
                  alt={`${data.displayName} logo`}
                  width={80}
                  height={80}
                  className="w-full h-full object-contain p-1"
                />
              </div>
            )}
            
            {/* Название и рейтинг выровнены по нижнему краю */}
            <div className="flex items-end justify-between gap-6">
              {/* Левая часть: Название */}
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white inline-flex items-center gap-2 leading-tight">
                  <span>{data.displayName}</span>
                  {data.verified && (
                    <span className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-500 flex-shrink-0">
                      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </span>
                  )}
                </h1>
                
                {data.category === 'venue' && data.venueType && (
                  <div className="text-sm text-white/80 mt-2">
                    {data.venueType === 'kids_center' && 'Детский центр'}
                    {data.venueType === 'loft' && 'Лофт / Студия'}
                    {data.venueType === 'cafe' && 'Кафе / Ресторан'}
                    {data.venueType === 'entertainment_center' && 'Парк развлечений'}
                    {data.venueType === 'outdoor' && 'Открытая площадка'}
                    {data.venueType === 'other' && 'Другое'}
                  </div>
                )}
              </div>
              
              {/* Правая часть: Соцсети и рейтинг */}
              <div className="flex items-center gap-4 flex-shrink-0 mb-1.5">
                <div className="flex gap-2.5">
                  <SocialLinks website={data.website} socialLinks={data.socialLinks} />
                </div>
                <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm px-4 py-2.5 rounded-full shadow-lg">
                  <Star className="w-5 h-5 fill-[#FCE000] text-[#FCE000]" />
                  <span className="font-semibold text-slate-900 text-lg">{(data.rating || 5.0).toFixed(1)}</span>
                  <span className="text-slate-500 text-sm">({data.reviewsCount || 0})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile: Логотип и название внизу */}
          <div className="md:hidden">
            {/* Логотип */}
            {data.logo && (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-white border-2 border-white/20 shadow-lg mb-4">
                <Image 
                  src={data.logo}
                  alt={`${data.displayName} logo`}
                  width={80}
                  height={80}
                  className="w-full h-full object-contain p-1"
                />
              </div>
            )}
            
            {/* Название */}
            <h1 className="text-3xl sm:text-4xl font-bold text-white inline-flex items-start gap-2 mb-2">
              <span>{data.displayName}</span>
              {data.verified && (
                <span className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-500 flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </span>
              )}
            </h1>
            
            {data.category === 'venue' && data.venueType && (
              <div className="text-sm text-white/80 mb-4">
                {data.venueType === 'kids_center' && 'Детский центр'}
                {data.venueType === 'loft' && 'Лофт / Студия'}
                {data.venueType === 'cafe' && 'Кафе / Ресторан'}
                {data.venueType === 'entertainment_center' && 'Парк развлечений'}
                {data.venueType === 'outdoor' && 'Открытая площадка'}
                {data.venueType === 'other' && 'Другое'}
              </div>
            )}
            
            {/* Рейтинг и соцсети на мобильных */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <Star className="w-4 h-4 fill-[#FCE000] text-[#FCE000]" />
                <span className="font-semibold text-slate-900">{(data.rating || 5.0).toFixed(1)}</span>
                <span className="text-slate-500 text-xs">({data.reviewsCount || 0})</span>
              </div>
              
              <div className="flex gap-2">
                <SocialLinks website={data.website} socialLinks={data.socialLinks} />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Описание внизу */}
      {data.description && (
        <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6">
          <div className="text-sm md:text-base text-slate-600 leading-snug whitespace-pre-wrap">
            {data.description}
          </div>
        </div>
      )}
    </section>
  )
}

