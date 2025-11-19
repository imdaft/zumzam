import { notFound } from 'next/navigation'
import { ProfileHeader } from '@/components/features/profile/profile-header'
import { ProfileGallery } from '@/components/features/profile/profile-gallery'
import { ProfileReviews } from '@/components/features/profile/profile-reviews'
import { ChatWidget } from '@/components/features/ai/chat-widget'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'

interface ProfilePageProps {
  params: {
    slug: string
  }
}

/**
 * Получить данные профиля
 */
async function getProfile(slug: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/profiles/${slug}`, {
      cache: 'no-store', // Для динамических данных
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error('Failed to fetch profile')
    }

    const data = await response.json()
    return data.profile
  } catch (error) {
    console.error('Error fetching profile:', error)
    return null
  }
}

/**
 * Публичная страница профиля студии/аниматора
 */
export default async function ProfilePage({ params }: ProfilePageProps) {
  const profile = await getProfile(params.slug)

  if (!profile) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Шапка профиля */}
          <ProfileHeader profile={profile} />

          {/* Описание */}
          {profile.description && (
            <Card>
              <CardHeader>
                <CardTitle>О нас</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {profile.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Галерея */}
          <ProfileGallery profile={profile} />

          {/* Отзывы */}
          <div>
            <ProfileReviews />
          </div>
        </div>
      </div>
      
      {/* AI Chat Widget */}
      <ChatWidget 
        profileId={profile.id} 
        profileName={profile.display_name}
      />
    </div>
  )
}

/**
 * Генерация метаданных для SEO
 */
export async function generateMetadata({ params }: ProfilePageProps) {
  const profile = await getProfile(params.slug)

  if (!profile) {
    return {
      title: 'Профиль не найден',
    }
  }

  return {
    title: `${profile.display_name} - ${profile.city} | DetiNaRakete`,
    description: profile.bio || profile.description?.substring(0, 160),
    openGraph: {
      title: profile.display_name,
      description: profile.bio,
      images: profile.cover_photo ? [profile.cover_photo] : [],
    },
  }
}

