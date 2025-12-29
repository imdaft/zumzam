'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { useAuth } from '@/lib/contexts/auth-context'

interface FavoritesContextType {
  favorites: string[]
  toggleFavorite: (id: string) => Promise<void>
  isFavorite: (id: string) => boolean
  isLoading: boolean
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Используем user из AuthContext вместо дублирующего запроса auth
  const { user, isLoading: authLoading } = useAuth()
  const loadedRef = useRef(false)

  // Загружаем избранное когда AuthContext готов
  useEffect(() => {
    // Ждём пока AuthContext загрузится
    if (authLoading) return
    
    // Не загружаем повторно для того же пользователя
    if (loadedRef.current) return
    
    const loadFavorites = async () => {
      try {
        if (user) {
          // Юзер вошел -> грузим из БД через API
          const response = await fetch('/api/favorites')
          if (response.ok) {
            const data = await response.json()
            setFavorites(data.favorites || [])
          } else {
            console.error('Error loading favorites from API:', response.statusText)
          }
        } else {
          // Гость -> грузим из LocalStorage
          const saved = localStorage.getItem('favorites')
          if (saved) {
            try {
              setFavorites(JSON.parse(saved))
            } catch (e) {
              console.error('Error parsing local favorites', e)
            }
          }
        }
        loadedRef.current = true
      } catch (e) {
        console.error('Error loading favorites:', e)
      } finally {
        setIsLoading(false)
      }
    }

    loadFavorites()
  }, [user?.id, authLoading])

  // Сбрасываем при выходе пользователя
  useEffect(() => {
    if (!authLoading && !user && loadedRef.current) {
      // Пользователь вышел - загружаем локальные избранные
      const saved = localStorage.getItem('favorites')
      if (saved) {
        try {
          setFavorites(JSON.parse(saved))
        } catch (e) {
          setFavorites([])
        }
        } else {
             setFavorites([]) 
        }
    }
  }, [user, authLoading])

  const toggleFavorite = async (id: string) => {
    // Оптимистичное обновление (сразу меняем UI)
    const isLiked = favorites.includes(id)
    const newFavorites = isLiked
      ? favorites.filter(favId => favId !== id)
      : [...favorites, id]
    
    setFavorites(newFavorites)

    if (user) {
      // Если юзер -> пишем в БД через API (без await для не-блокирующей записи)
      if (isLiked) {
        fetch(`/api/favorites?profile_id=${id}`, { method: 'DELETE' })
          .then(() => {})
          .catch(e => console.error('Error removing favorite:', e))
      } else {
        fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile_id: id }),
        })
          .then(() => {})
          .catch(e => console.error('Error adding favorite:', e))
      }
    } else {
      // Если гость -> пишем в LocalStorage
      localStorage.setItem('favorites', JSON.stringify(newFavorites))
    }
  }

  const isFavorite = (id: string) => favorites.includes(id)

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, isLoading }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}
