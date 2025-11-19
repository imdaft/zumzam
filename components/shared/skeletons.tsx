import { Skeleton } from '@/components/ui/skeleton'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card'

/**
 * Skeleton для карточки услуги
 */
export function ServiceCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      {/* Фото */}
      <Skeleton className="aspect-video w-full" />

      <CardHeader className="pb-3">
        {/* Название */}
        <Skeleton className="h-6 w-3/4" />
        {/* Студия */}
        <Skeleton className="h-4 w-1/2 mt-2" />
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Описание */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>

        {/* Детали */}
        <div className="flex gap-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>

        {/* Теги */}
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t pt-4">
        {/* Цена */}
        <Skeleton className="h-7 w-24" />
        {/* Кнопка */}
        <Skeleton className="h-9 w-24" />
      </CardFooter>
    </Card>
  )
}

/**
 * Skeleton для карточки профиля
 */
export function ProfileCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      {/* Фото */}
      <Skeleton className="aspect-video w-full" />

      <CardHeader>
        {/* Название */}
        <Skeleton className="h-6 w-3/4" />
        {/* Город */}
        <Skeleton className="h-4 w-1/2 mt-2" />
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Рейтинг */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>

        {/* Описание */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>

        {/* Теги */}
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </CardContent>

      <CardFooter>
        <Skeleton className="h-9 w-full" />
      </CardFooter>
    </Card>
  )
}

