'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, Trash2, Loader2, Star } from 'lucide-react'
import { CharacterForm } from './character-form'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import Image from 'next/image'
import { toast } from 'sonner'

interface CharactersManagerProps {
  profileId: string
  hideHeader?: boolean
}

interface Character {
  id: string
  name: string
  description: string | null
  photos: string[]
  video_url: string | null
  age_range: string | null
  age_ranges?: string[] | null
  program_types: string[]
  work_format: string | null
  is_active: boolean
  created_at: string
}

const AGE_RANGE_LABELS: Record<string, string> = {
  '3-5': '3-5 лет',
  '5-7': '5-7 лет',
  '7-10': '7-10 лет',
  '10-14': '10-14 лет',
  'universal': 'Любой возраст'
}

const PROGRAM_TYPE_LABELS: Record<string, string> = {
  'interactive': 'Интерактив',
  'show': 'Шоу',
  'quest': 'Квест',
  'master_class': 'Мастер-класс',
  'games': 'Игры'
}

const WORK_FORMAT_LABELS: Record<string, string> = {
  'mobile': 'Выездной',
  'studio': 'В студии',
  'both': 'Выездной и в студии'
}

export function CharactersManager({ profileId, hideHeader }: CharactersManagerProps) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  useEffect(() => {
    let isMounted = true
    
    const fetchCharacters = async () => {
      console.log('[CharactersManager] Starting fetch for profile:', profileId)
      setIsLoading(true)
      setLoadError(null)
      
      try {
        const response = await fetch(`/api/animator-characters?profileId=${profileId}`)
        
        if (!response.ok) {
          throw new Error(`Failed to load characters: ${response.statusText}`)
        }
        
        const data = await response.json()
        const charactersList = data.characters || []
        
        if (isMounted) {
          console.log('[CharactersManager] Setting characters:', charactersList.length)
          setCharacters(charactersList)
        }
      } catch (error: any) {
        console.error('[CharactersManager] Fetch error:', error)
        if (isMounted) {
          const errorMessage = error?.message || error?.toString() || 'Неизвестная ошибка'
          setLoadError(`Не удалось загрузить персонажей: ${errorMessage}`)
        }
      } finally {
        if (isMounted) {
          console.log('[CharactersManager] Setting isLoading = false')
          setIsLoading(false)
        }
      }
    }
    
    fetchCharacters()
    
    return () => {
      isMounted = false
    }
  }, [profileId])
  
  // Отдельная функция для ручного обновления (после создания/редактирования)
  const refetchCharacters = useCallback(async () => {
    console.log('[CharactersManager] refetchCharacters called')
    setIsLoading(true)
    setLoadError(null)
    try {
      console.log('[CharactersManager] Fetching characters for profile:', profileId)
      const response = await fetch(`/api/animator-characters?profileId=${profileId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to load characters: ${response.statusText}`)
      }
      
      const data = await response.json()
      const charactersList = data.characters || []
      console.log('[CharactersManager] Fetched', charactersList.length, 'characters')
      setCharacters(charactersList)
    } catch (error) {
      console.warn('[CharactersManager] Error fetching characters:', error)
      setLoadError('Не удалось загрузить список персонажей. Попробуйте обновить.')
      throw error
    } finally {
      console.log('[CharactersManager] Setting isLoading = false')
      setIsLoading(false)
    }
  }, [profileId])

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/animator-characters/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete character')
      }
      
      await refetchCharacters()
      setDeletingId(null)
    } catch (error) {
      console.error('Error deleting character:', error)
      alert('Не удалось удалить персонажа')
    }
  }

  const handleEdit = useCallback((character: Character) => {
    setEditingCharacter(character)
    setIsFormOpen(true)
  }, [])

  const handleFormClose = useCallback(() => {
    setIsFormOpen(false)
    setEditingCharacter(null)
  }, [])

  const handleFormSuccess = useCallback(async () => {
    console.log('[CharactersManager] handleFormSuccess called')
    try {
      await refetchCharacters()
      console.log('[CharactersManager] Refetch completed successfully')
    } catch (e) {
      console.error('[CharactersManager] Failed to refetch after save:', e)
      // Даже если refetch упал, закрываем форму (пользователь может обновить вручную)
      toast.error('Персонаж сохранён, но не удалось обновить список. Обновите страницу.')
    } finally {
      console.log('[CharactersManager] Closing form')
      setIsFormOpen(false)
      setEditingCharacter(null)
    }
  }, [refetchCharacters])

  if (isFormOpen) {
    return (
      <CharacterForm
        profileId={profileId}
        initialData={editingCharacter}
        isEditMode={!!editingCharacter}
        onSuccess={handleFormSuccess}
        onCancel={handleFormClose}
      />
    )
  }

  const addButton = (
    <Button 
      onClick={() => setIsFormOpen(true)}
      className="rounded-[24px] h-10 px-4 w-full sm:w-auto shrink-0 bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors"
    >
      <Plus className="mr-2 h-4 w-4" />
      Добавить персонажа
    </Button>
  )

  const content = (
    <>
      {!hideHeader && (
        <CardHeader className="border-b border-slate-200 p-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <CardTitle className="text-base sm:text-lg font-bold text-slate-900 leading-tight text-left">
              Персонажи и программы
            </CardTitle>
            {addButton}
          </div>
        </CardHeader>
      )}

      <CardContent className={hideHeader ? "p-0" : "p-4"}>
        {hideHeader && characters.length > 0 && (
          <div className="px-3 pt-3 pb-2">
            {addButton}
          </div>
        )}

        {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : loadError ? (
        <Card className="border-none shadow-sm rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Star className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-base font-semibold text-slate-900 mb-2">Не удалось загрузить</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              {loadError}
            </p>
            <Button
              onClick={refetchCharacters}
              className="bg-primary hover:bg-primary/90 text-white font-bold rounded-full px-6 shadow-lg shadow-orange-200"
            >
              Повторить
            </Button>
          </CardContent>
        </Card>
      ) : characters.length === 0 ? (
        <div className={hideHeader ? "text-center py-12 px-3" : "text-center py-12"}>
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-base text-slate-600 mb-4">
            Добавьте персонажей
          </p>
          <Button 
            onClick={() => setIsFormOpen(true)}
            className="rounded-[24px] h-10 px-5 bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Добавить персонажа
          </Button>
        </div>
      ) : (
        <div className={hideHeader ? "grid grid-cols-1 gap-4 px-3 pb-3" : "grid grid-cols-1 gap-6"}>
          {characters.map((character) => (
            <Card key={character.id} className="border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.06)] rounded-[24px] overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex gap-6">
                  {/* Фото персонажа */}
                  <div className="w-32 flex-shrink-0">
                    <div className="aspect-square w-full relative rounded-[24px] overflow-hidden bg-slate-100">
                      {character.photos && character.photos.length > 0 ? (
                        <Image
                          src={character.photos[0]}
                          alt={character.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Star className="h-10 w-10 opacity-20" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Информация */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-slate-900 mb-2">{character.name}</h3>
                        {character.description && (
                          <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                            {character.description}
                          </p>
                        )}
                        
                        <div className="flex flex-wrap gap-2 text-xs">
                          {(character.age_ranges && character.age_ranges.length > 0 ? character.age_ranges : (character.age_range ? [character.age_range] : [])).map((ageRange) => (
                            <span key={ageRange} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg font-medium">
                              {AGE_RANGE_LABELS[ageRange] || ageRange}
                            </span>
                          ))}
                          {(character.age_ranges || [])
                            .filter(Boolean)
                            .filter((v, i, arr) => arr.indexOf(v) === i)
                            .filter((v) => v !== character.age_range)
                            .map((age) => (
                              <span
                                key={age}
                                className="px-2 py-1 bg-blue-50 text-blue-700 rounded-[18px] font-medium"
                              >
                                {AGE_RANGE_LABELS[age] || age}
                              </span>
                            ))}
                          {character.program_types && character.program_types.map((type) => (
                            <span key={type} className="px-2 py-1 bg-orange-50 text-orange-700 rounded-lg font-medium">
                              {PROGRAM_TYPE_LABELS[type] || type}
                            </span>
                          ))}
                          {character.work_format && (
                            <span className="px-2 py-1 bg-green-50 text-green-700 rounded-[18px] font-medium">
                              {WORK_FORMAT_LABELS[character.work_format] || character.work_format}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Кнопки управления */}
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(character)}
                          className="rounded-xl"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeletingId(character.id)}
                          className="rounded-full text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить персонажа?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Персонаж будет удален навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && handleDelete(deletingId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )

  // Для мобильной версии (hideHeader=true) - без Card обертки
  if (hideHeader) {
    return <div className="space-y-0">{content}</div>
  }

  // Для десктопной версии - с Card оберткой
  return (
    <Card className="shadow-[0_2px_8px_rgba(0,0,0,0.06)] rounded-[24px] border border-slate-200">
      {content}
    </Card>
  )
}

