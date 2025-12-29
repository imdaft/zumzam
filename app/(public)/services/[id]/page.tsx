import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, Clock, Users, MapPin, Star, BadgeCheck } from 'lucide-react'
import { BookingForm } from '@/components/features/booking/booking-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface ServicePageProps {
  params: Promise<{
    id: string
  }>
}

/**
 * Получить данные услуги
 */
async function getService(id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/services/${id}`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error('Failed to fetch service')
    }

    const data = await response.json()
    return data.service
  } catch (error) {
    console.error('Error fetching service:', error)
    return null
  }
}

/**
 * Страница отдельной услуги с формой бронирования
 */
export default async function ServicePage({ params }: ServicePageProps) {
  const { id } = await params
  const service = await getService(id)

  if (!service) {
    notFound()
  }

  const profile = service.profiles
  const priceLabel =
    service.price
      ? `${Number(service.price).toLocaleString('ru-RU')}₽`
      : service.price_from && service.price_to
        ? `${Number(service.price_from).toLocaleString('ru-RU')} – ${Number(service.price_to).toLocaleString('ru-RU')}₽`
        : 'По запросу'

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <div className="w-full px-2 py-4 pb-24 sm:container sm:mx-auto sm:px-6 sm:py-8">
        <div className="grid gap-4 lg:gap-6 lg:grid-cols-[1fr_420px]">
          {/* Main Content */}
          <div className="space-y-4">
            {/* Breadcrumbs */}
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <Link href="/" className="hover:text-gray-900">Главная</Link>
              <span className="text-gray-300">/</span>
              <Link href="/services" className="hover:text-gray-900">Услуги</Link>
              <span className="text-gray-300">/</span>
              <span className="text-gray-900 font-semibold">{service.title}</span>
            </div>

            {/* Header */}
            <div className="bg-white border border-gray-100 shadow-sm rounded-[24px] p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                    {service.title}
                  </h1>
                  {profile && (
                    <Link
                      href={`/profiles/${profile.slug}`}
                      className="mt-2 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <span className="font-semibold">{profile.display_name}</span>
                      {profile.verified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                          <BadgeCheck className="h-3.5 w-3.5" />
                          Проверено
                        </span>
                      )}
                    </Link>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <div className={priceLabel === 'По запросу' ? 'text-lg sm:text-xl font-bold text-gray-900' : 'text-2xl sm:text-3xl font-bold text-orange-600'}>
                    {priceLabel}
                  </div>
                  {service.price_type && (
                    <div className="text-sm text-gray-500">
                      {service.price_type}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Info (Lavka) */}
              <div className="mt-4 rounded-[24px] border border-gray-100 divide-y divide-gray-100 overflow-hidden">
                {service.duration_minutes && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-orange-600" />
                      </span>
                      Длительность
                    </div>
                    <div className="text-sm font-semibold text-gray-900">{service.duration_minutes} минут</div>
                  </div>
                )}
                {service.age_from && service.age_to && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
                        <Users className="h-4 w-4 text-orange-600" />
                      </span>
                      Возраст
                    </div>
                    <div className="text-sm font-semibold text-gray-900">{service.age_from}-{service.age_to} лет</div>
                  </div>
                )}
                {service.capacity_min && service.capacity_max && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
                        <Users className="h-4 w-4 text-orange-600" />
                      </span>
                      Кол-во гостей
                    </div>
                    <div className="text-sm font-semibold text-gray-900">{service.capacity_min}-{service.capacity_max} человек</div>
                  </div>
                )}
                {profile?.city && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-orange-600" />
                      </span>
                      Город
                    </div>
                    <div className="text-sm font-semibold text-gray-900">{profile.city}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Photos */}
            {service.photos && service.photos.length > 0 && (
              <div className="grid gap-2 sm:gap-3 sm:grid-cols-2">
                {service.photos.slice(0, 4).map((photo: string, i: number) => (
                  <div 
                    key={i} 
                    className="relative aspect-video rounded-[24px] overflow-hidden bg-gray-100 border border-gray-100"
                  >
                    <Image
                      src={photo}
                      alt={`${service.title} - фото ${i + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Description */}
            <Card className="rounded-[24px] border border-gray-100 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-gray-900">Описание</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {service.description}
                </p>
              </CardContent>
            </Card>

            {/* Tags */}
            {service.tags && service.tags.length > 0 && (
              <Card className="rounded-[24px] border border-gray-100 bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold text-gray-900">Теги</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {service.tags.map((tag: string, i: number) => (
                      <Badge key={i} className="rounded-full bg-gray-100 text-gray-700 px-2">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Profile Info */}
            {profile && (
              <Card className="rounded-[24px] border border-gray-100 bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold text-gray-900">О студии</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4">
                    {profile.avatar_url && (
                      <Image
                        src={profile.avatar_url}
                        alt={profile.display_name}
                        width={64}
                        height={64}
                        className="rounded-full"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        {profile.display_name}
                        {profile.verified && (
                          <BadgeCheck className="h-4 w-4 text-green-600" />
                        )}
                      </h3>
                      {profile.bio && (
                        <p className="text-sm text-gray-600 mt-1">
                          {profile.bio}
                        </p>
                      )}
                      {profile.rating && (
                        <div className="flex items-center gap-2 mt-2">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">{profile.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Link href={`/profiles/${profile.slug}`}>
                    <Button variant="outline" className="w-full rounded-full">
                      Посмотреть все услуги студии
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Booking Sidebar */}
          <div className="lg:sticky lg:top-24 h-fit">
            <Card className="rounded-[24px] border border-gray-100 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
                  <span className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-orange-600" />
                  </span>
                  Забронировать
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BookingForm
                  serviceId={service.id}
                  profileId={service.profile_id}
                  serviceName={service.title}
                  profileName={profile?.display_name}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Генерация метаданных для SEO
 */
export async function generateMetadata({ params }: ServicePageProps) {
  const { id } = await params
  const service = await getService(id)

  if (!service) {
    return {
      title: 'Услуга не найдена',
    }
  }

  return {
    title: `${service.title} | ZumZam`,
    description: service.description?.substring(0, 160),
    openGraph: {
      title: service.title,
      description: service.description,
      images: service.photos?.length > 0 ? [service.photos[0]] : [],
    },
  }
}


