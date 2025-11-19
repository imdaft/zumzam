import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, Clock, Users, MapPin, Star, BadgeCheck } from 'lucide-react'
import { BookingForm } from '@/components/features/booking/booking-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface ServicePageProps {
  params: {
    id: string
  }
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
  const service = await getService(params.id)

  if (!service) {
    notFound()
  }

  const profile = service.profiles

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground">Главная</Link>
              <span>/</span>
              <Link href="/services" className="hover:text-foreground">Услуги</Link>
              <span>/</span>
              <span className="text-foreground">{service.title}</span>
            </div>

            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{service.title}</h1>
                  {profile && (
                    <Link 
                      href={`/profiles/${profile.slug}`}
                      className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span>{profile.display_name}</span>
                      {profile.verified && (
                        <BadgeCheck className="h-4 w-4 text-primary" />
                      )}
                    </Link>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">
                    {service.price?.toLocaleString()}₽
                  </div>
                  {service.price_type && (
                    <div className="text-sm text-muted-foreground">
                      {service.price_type}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Info */}
              <div className="flex flex-wrap gap-4 text-sm">
                {service.duration_minutes && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{service.duration_minutes} минут</span>
                  </div>
                )}
                {service.age_from && service.age_to && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{service.age_from}-{service.age_to} лет</span>
                  </div>
                )}
                {service.capacity_min && service.capacity_max && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{service.capacity_min}-{service.capacity_max} человек</span>
                  </div>
                )}
                {profile?.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.city}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Photos */}
            {service.photos && service.photos.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                {service.photos.slice(0, 4).map((photo: string, i: number) => (
                  <div 
                    key={i} 
                    className="relative aspect-video rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800"
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
            <Card>
              <CardHeader>
                <CardTitle>Описание</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {service.description}
                </p>
              </CardContent>
            </Card>

            {/* Tags */}
            {service.tags && service.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Теги</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {service.tags.map((tag: string, i: number) => (
                      <Badge key={i} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Profile Info */}
            {profile && (
              <Card>
                <CardHeader>
                  <CardTitle>О студии</CardTitle>
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
                          <BadgeCheck className="h-4 w-4 text-primary" />
                        )}
                      </h3>
                      {profile.bio && (
                        <p className="text-sm text-muted-foreground mt-1">
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
                    <Button variant="outline" className="w-full">
                      Посмотреть все услуги студии
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Booking Sidebar */}
          <div className="lg:sticky lg:top-24 h-fit">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
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
  const service = await getService(params.id)

  if (!service) {
    return {
      title: 'Услуга не найдена',
    }
  }

  return {
    title: `${service.title} | DetiNaRakete`,
    description: service.description?.substring(0, 160),
    openGraph: {
      title: service.title,
      description: service.description,
      images: service.photos?.length > 0 ? [service.photos[0]] : [],
    },
  }
}

