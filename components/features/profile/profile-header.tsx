'use client'

import { Star, MapPin, Clock, Users, Award } from 'lucide-react'
import Image from 'next/image'
import { Profile } from '@/lib/types/profile'
import { Badge } from '@/components/ui/badge'

/**
 * Герой-секция профиля (О нас)
 * Показывает основную информацию, рейтинг, быстрые данные
 */
export function ProfileHeader({
  profile,
  isOwner = false,
}: {
  profile: Profile
  isOwner?: boolean
}) {
  return (
    <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-100">
      {/* Cover / Main photo */}
      {profile.cover_photo && (
        <div className="relative h-48 md:h-64 bg-gradient-to-br from-orange-100 to-orange-50">
          <Image
            src={profile.cover_photo}
            alt={profile.display_name}
            fill
            className="object-cover"
          />
        </div>
      )}
      
      <div className="p-6 md:p-8">
        {/* Title */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              {profile.display_name}
            </h1>
            {profile.bio && (
              <p className="text-lg text-slate-600">{profile.bio}</p>
            )}
          </div>
          
          {/* Rating */}
          {profile.rating && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-full shrink-0">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span className="font-bold text-lg text-amber-700">{profile.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        
        {/* Quick info badges */}
        <div className="flex flex-wrap gap-2 mb-6">
          {/* Адрес */}
          {profile.address && (
            <Badge variant="secondary" className="gap-1.5">
              <MapPin className="w-4 h-4" />
              {profile.address}
            </Badge>
          )}
          
          {/* Метро */}
          {profile.metro_stations && profile.metro_stations.length > 0 && (
            <Badge variant="secondary" className="gap-1.5">
              🚇 {profile.metro_stations[0].name} ({profile.metro_stations[0].walk_time_minutes} мин)
            </Badge>
          )}
          
          {/* Время работы */}
          {profile.working_hours?.format === '24/7' && (
            <Badge variant="secondary" className="gap-1.5">
              <Clock className="w-4 h-4" />
              Круглосуточно
            </Badge>
          )}
          
          {/* Возраст */}
          {profile.age_restrictions?.min_age && (
            <Badge variant="secondary" className="gap-1.5">
              <Users className="w-4 h-4" />
              От {profile.age_restrictions.min_age} лет
            </Badge>
          )}
          
          {/* Вместимость */}
          {profile.capacity_info?.max_children && (
            <Badge variant="secondary" className="gap-1.5">
              👥 До {profile.capacity_info.max_children} детей
            </Badge>
          )}
          
          {/* Verified */}
          {profile.verified && (
            <Badge className="gap-1.5 bg-blue-600">
              <Award className="w-4 h-4" />
              Проверено
            </Badge>
          )}
        </div>
        
        {/* Description */}
        {profile.description && (
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-700 leading-relaxed">{profile.description}</p>
          </div>
        )}
        
        {/* Stats */}
        {(profile.reviews_count || profile.bookings_completed) && (
          <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-slate-100">
            {profile.reviews_count > 0 && (
              <div>
                <div className="text-2xl font-bold text-slate-900">{profile.reviews_count}</div>
                <div className="text-sm text-slate-500">отзывов</div>
              </div>
            )}
            {profile.bookings_completed > 0 && (
              <div>
                <div className="text-2xl font-bold text-slate-900">{profile.bookings_completed}</div>
                <div className="text-sm text-slate-500">праздников</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
