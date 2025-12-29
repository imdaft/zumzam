'use client'

import { useEffect, useState } from 'react'
import { ProfileCard } from '@/components/features/profile/profile-card'
import { Loader2, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface FavoriteProfile {
  id: string
  profile: {
    id: string
    slug: string
    display_name: string
    category: string
    city: string
    rating: number
    reviews_count: number
    main_photo: string
    photos: string[]
    priceFrom: number
    tags: string[]
    verified: boolean
  } | null
  notes: string | null
  created_at: string | null
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadFavorites()
  }, [])

  const loadFavorites = async () => {
    try {
      const response = await fetch('/api/favorites')
      
      if (!response.ok) {
        if (response.status === 401) {
          setFavorites([])
          return
        }
        throw new Error('Failed to load favorites')
      }

      const data = await response.json()
      setFavorites(data || [])
    } catch (error) {
      console.error('Error loading favorites:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveFavorite = async (favoriteId: string) => {
    try {
      const response = await fetch(`/api/favorites/${favoriteId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove favorite')
      }
      
      // Обновляем список
      setFavorites(favorites.filter(f => f.id !== favoriteId))
    } catch (error) {
      console.error('Error removing favorite:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <div className="space-y-4">
        <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-red-500 fill-red-500" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Избранное</h1>
          </div>
          <p className="text-sm text-gray-600 mt-0.5">Профили, которые вы отметили как избранные</p>
        </div>

        {favorites.length === 0 ? (
          <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-10 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center mb-4 shadow-sm">
              <Heart className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">У вас пока нет избранных профилей</h2>
            <p className="text-sm text-gray-600 mt-1 mb-6">
              Добавляйте профили в избранное, чтобы быстро находить их позже
            </p>
            <Link href="/">
              <Button className="rounded-full h-11 px-6 text-sm font-semibold bg-orange-500 hover:bg-orange-600">
                Перейти к поиску
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {favorites
              .filter((favorite) => favorite.profile) // Фильтруем удаленные профили
              .map((favorite) => (
                <div key={favorite.id} className="relative">
                  <ProfileCard
                    id={favorite.profile!.id}
                    slug={favorite.profile!.slug}
                    name={favorite.profile!.display_name}
                    category={favorite.profile!.category}
                    city={favorite.profile!.city}
                    rating={favorite.profile!.rating}
                    reviewsCount={favorite.profile!.reviews_count}
                    photos={favorite.profile!.photos}
                    priceFrom={favorite.profile!.priceFrom}
                    tags={favorite.profile!.tags}
                    verified={favorite.profile!.verified}
                  />
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}


