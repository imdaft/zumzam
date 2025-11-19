import Link from 'next/link'
import { Star, MapPin, Clock, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card'

interface ServiceCardProps {
  service: {
    id: string
    title: string
    description: string
    price: number | null
    price_from: number | null
    price_to: number | null
    currency: string
    duration_minutes: number | null
    age_from: number | null
    age_to: number | null
    tags: string[]
    photos: string[]
    profiles?: {
      slug: string
      display_name: string
      city: string
      rating: number
      verified: boolean
    }
  }
}

/**
 * Карточка услуги для каталога
 */
export function ServiceCard({ service }: ServiceCardProps) {
  const formatPrice = () => {
    if (service.price) {
      return `${service.price.toLocaleString('ru-RU')} ₽`
    } else if (service.price_from && service.price_to) {
      return `${service.price_from.toLocaleString('ru-RU')} - ${service.price_to.toLocaleString('ru-RU')} ₽`
    }
    return 'По запросу'
  }

  const coverPhoto = service.photos?.[0] || '/placeholder-service.jpg'

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
      {/* Фото */}
      <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={coverPhoto}
          alt={service.title}
          className="h-full w-full object-cover transition-transform group-hover:scale-110"
        />
        {service.profiles?.verified && (
          <div className="absolute right-2 top-2 rounded-full bg-blue-600 px-2 py-1 text-xs font-medium text-white">
            ✓ Проверено
          </div>
        )}
      </div>

      <CardHeader className="pb-3">
        {/* Название */}
        <h3 className="line-clamp-2 text-lg font-bold group-hover:text-primary transition-colors">
          <Link href={`/services/${service.id}`}>
            {service.title}
          </Link>
        </h3>

        {/* Студия */}
        {service.profiles && (
          <Link
            href={`/profiles/${service.profiles.slug}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {service.profiles.display_name}
          </Link>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Описание */}
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {service.description}
        </p>

        {/* Детали */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {service.profiles?.city && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {service.profiles.city}
            </div>
          )}
          {service.duration_minutes && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {service.duration_minutes} мин
            </div>
          )}
          {service.age_from !== null && service.age_to !== null && (
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {service.age_from}-{service.age_to} лет
            </div>
          )}
        </div>

        {/* Рейтинг */}
        {service.profiles?.rating && service.profiles.rating > 0 && (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-semibold">
              {service.profiles.rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Теги */}
        {service.tags && service.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {service.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {service.tags.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{service.tags.length - 2}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t pt-4">
        {/* Цена */}
        <div>
          <p className="text-xl font-bold">{formatPrice()}</p>
        </div>

        {/* Кнопка */}
        <Button size="sm" asChild>
          <Link href={`/services/${service.id}`}>
            Подробнее
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}


