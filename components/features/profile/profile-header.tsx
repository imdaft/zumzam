'use client'

import { 
  MapPin, 
  Star, 
  Phone, 
  Mail, 
  Globe, 
  CheckCircle2,
  DollarSign,
  Clock,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Profile } from '@/types'

interface ProfileHeaderProps {
  profile: Profile
}

/**
 * Шапка профиля студии/аниматора
 */
export function ProfileHeader({ profile }: ProfileHeaderProps) {
  // Генерируем массив звёзд для рейтинга
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-5 w-5 ${
          i < Math.floor(rating)
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ))
  }

  // Ценовой диапазон в рублях
  const getPriceRangeText = (range: string | null) => {
    switch (range) {
      case '$':
        return 'до 5 000₽'
      case '$$':
        return '5 000 - 15 000₽'
      case '$$$':
        return 'от 15 000₽'
      default:
        return 'По запросу'
    }
  }

  return (
    <div className="relative">
      {/* Обложка */}
      <div className="h-64 w-full overflow-hidden rounded-t-xl bg-gradient-to-r from-orange-400 to-pink-500">
        {profile.cover_photo ? (
          <img
            src={profile.cover_photo}
            alt={profile.display_name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-white">
              <div className="text-6xl mb-2">🚀</div>
              <p className="text-xl font-semibold">{profile.display_name}</p>
            </div>
          </div>
        )}
      </div>

      {/* Основная информация */}
      <div className="rounded-b-xl border border-t-0 bg-white dark:bg-slate-800 p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          {/* Левая колонка */}
          <div className="flex-1">
            {/* Название и бейджи */}
            <div className="mb-4">
              <div className="flex items-start gap-3">
                <h1 className="text-3xl font-bold">{profile.display_name}</h1>
                {profile.verified && (
                  <div className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                    <CheckCircle2 className="h-4 w-4" />
                    Проверено
                  </div>
                )}
              </div>
              {profile.bio && (
                <p className="mt-2 text-lg text-muted-foreground">
                  {profile.bio}
                </p>
              )}
            </div>

            {/* Метрики */}
            <div className="mb-4 flex flex-wrap items-center gap-4">
              {/* Рейтинг */}
              <div className="flex items-center gap-2">
                <div className="flex">{renderStars(profile.rating || 0)}</div>
                <span className="text-lg font-semibold">
                  {profile.rating?.toFixed(1) || '0.0'}
                </span>
                <span className="text-sm text-muted-foreground">
                  ({profile.reviews_count || 0} отзывов)
                </span>
              </div>

              {/* Мероприятий проведено */}
              {profile.bookings_completed && profile.bookings_completed > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-5 w-5" />
                  <span>{profile.bookings_completed} мероприятий</span>
                </div>
              )}

              {/* Время ответа */}
              {profile.response_time_minutes && profile.response_time_minutes < 60 && (
                <div className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-900 dark:text-green-200">
                  <Clock className="h-4 w-4" />
                  Быстрый ответ
                </div>
              )}
            </div>

            {/* Локация */}
            <div className="mb-4 flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-5 w-5" />
              <span>{profile.city}</span>
              {profile.address && <span>• {profile.address}</span>}
            </div>

            {/* Ценовой диапазон */}
            {profile.price_range && (
              <div className="mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <span className="text-lg font-medium">
                  {getPriceRangeText(profile.price_range)}
                </span>
              </div>
            )}

            {/* Теги */}
            {profile.tags && profile.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Правая колонка - Контакты и действия */}
          <div className="w-full lg:w-80">
            <div className="rounded-lg border bg-slate-50 p-6 dark:bg-slate-900">
              <h3 className="mb-4 text-lg font-semibold">Свяжитесь с нами</h3>
              
              {/* Кнопка бронирования */}
              <Button className="mb-4 w-full" size="lg">
                Забронировать
              </Button>

              {/* Контакты */}
              <div className="space-y-3">
                {profile.phone && (
                  <a
                    href={`tel:${profile.phone}`}
                    className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    {profile.phone}
                  </a>
                )}
                {profile.email && (
                  <a
                    href={`mailto:${profile.email}`}
                    className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    {profile.email}
                  </a>
                )}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Globe className="h-4 w-4" />
                    Сайт
                  </a>
                )}
              </div>

              {/* Социальные сети */}
              {profile.social_links && Object.keys(profile.social_links).length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="mb-2 text-sm font-medium">Мы в соцсетях:</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.social_links.vk && (
                      <Link
                        href={profile.social_links.vk as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                      >
                        VK
                      </Link>
                    )}
                    {profile.social_links.instagram && (
                      <Link
                        href={profile.social_links.instagram as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1 text-xs font-medium text-white"
                      >
                        Instagram
                      </Link>
                    )}
                    {profile.social_links.telegram && (
                      <Link
                        href={
                          (profile.social_links.telegram as string).startsWith('http')
                            ? (profile.social_links.telegram as string)
                            : `https://t.me/${(profile.social_links.telegram as string).replace('@', '')}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-blue-500 px-3 py-1 text-xs font-medium text-white hover:bg-blue-600"
                      >
                        Telegram
                      </Link>
                    )}
                    {profile.social_links.youtube && (
                      <Link
                        href={profile.social_links.youtube as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
                      >
                        YouTube
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

