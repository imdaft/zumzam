import { getCurrentUser } from '@/lib/auth/get-current-user'
import { notFound, redirect } from 'next/navigation'
import { ProfileManageClient } from './client'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function ProfileEditPage({ params }: PageProps) {
  
  
  // Получаем текущего пользователя
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Awaiting params (Next.js 15 requirement)
  const { slug } = await params

  // Получаем профиль со связями через Prisma
  const prisma = (await import('@/lib/prisma')).default
  
  const profile = await prisma.profiles.findFirst({
    where: {
      slug: slug,
    },
    include: {
      profile_locations: true,
      profile_activities: {
        select: {
          activity_id: true,
        },
      },
      profile_services: {
        select: {
          service_id: true,
        },
      },
    },
  })
  
  const error = !profile
  
  if (error || !profile) {
    notFound()
  }

  // Преобразуем связи в массивы ID для формы
  profile.activities = profile.profile_activities?.map((pa: any) => pa.activity_id) || []
  profile.services = profile.profile_services?.map((ps: any) => ps.service_id) || []
  
  // Преобразуем Decimal в number для передачи в Client Component
  const profileForClient = {
    ...profile,
    rating: profile.rating ? Number(profile.rating) : 0,
    yandex_rating: profile.yandex_rating ? Number(profile.yandex_rating) : null,
  }
  
  console.log('📥 [ProfileEditPage] Loaded profile with relations:', {
    profileId: profileForClient.id,
    primary_venue_type: profileForClient.primary_venue_type,
    activitiesCount: profileForClient.activities.length,
    activities: profileForClient.activities,
    servicesCount: profileForClient.services.length,
    services: profileForClient.services,
  })

  // Проверяем права доступа
  if (profile.user_id !== user.id && user.role !== 'admin') {
    redirect('/profiles')
  }

  return <ProfileManageClient profile={profileForClient} />
}

