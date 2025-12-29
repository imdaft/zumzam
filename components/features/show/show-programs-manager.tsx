'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, Trash2, Loader2, Sparkles } from 'lucide-react'
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
import { SHOW_GENRES, SHOW_AGE_RANGES, type ShowGenre, type ShowAgeRange } from '@/lib/constants/show-genres'
import { ShowProgramForm } from './show-program-form'

interface ShowProgramsManagerProps {
  profileId: string
}

interface ShowProgram {
  id: string
  name: string
  description: string | null
  photos: string[]
  video_url: string | null
  genres: string[]
  duration: number | null
  performers_count: number | null
  age_ranges: string[]
  requires_sound: boolean
  stage_requirements: string | null
  requires_light: boolean
  additional_requirements: string | null
  is_active: boolean
  created_at: string
}

export function ShowProgramsManager({ profileId }: ShowProgramsManagerProps) {
  const [programs, setPrograms] = useState<ShowProgram[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProgram, setEditingProgram] = useState<ShowProgram | null>(null)

  const fetchPrograms = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const response = await fetch(`/api/show-programs?profile_id=${profileId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to load programs: ${response.statusText}`)
      }
      
      const data = await response.json()
      const programsList = Array.isArray(data.programs) ? data.programs : []
      setPrograms(programsList)
    } catch (error: any) {
      console.error('[ShowPrograms] Error:', error)
      setLoadError(`Не удалось загрузить программы: ${error?.message || 'Неизвестная ошибка'}`)
    } finally {
      setIsLoading(false)
    }
  }, [profileId])

  useEffect(() => {
    fetchPrograms()
  }, [fetchPrograms])

  const refetchPrograms = useCallback(async () => {
    await fetchPrograms()
  }, [fetchPrograms])

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/show-programs/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete program')
      }

      await refetchPrograms()
      toast.success('Программа удалена')
    } catch (error: any) {
      console.error('[ShowPrograms] Delete error:', error)
      toast.error(error.message || 'Не удалось удалить программу')
    } finally {
      setDeletingId(null)
    }
  }

  const handleEdit = useCallback((program: ShowProgram) => {
    setEditingProgram(program)
    setIsFormOpen(true)
  }, [])

  const handleFormClose = useCallback(() => {
    setIsFormOpen(false)
    setEditingProgram(null)
  }, [])

  const handleFormSuccess = useCallback(async () => {
    try {
      await refetchPrograms()
    } catch (e) {
      toast.error('Программа сохранена, но не удалось обновить список. Обновите страницу.')
    } finally {
      setIsFormOpen(false)
      setEditingProgram(null)
    }
  }, [refetchPrograms])

  if (isFormOpen) {
    return (
      <ShowProgramForm
        profileId={profileId}
        initialData={editingProgram}
        isEditMode={!!editingProgram}
        onSuccess={handleFormSuccess}
        onCancel={handleFormClose}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  if (loadError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-500" />
            Номера и программы
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <h3 className="text-base font-semibold text-slate-900 mb-2">Не удалось загрузить</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              {loadError}
            </p>
            <Button onClick={() => window.location.reload()}>
              Обновить страницу
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-500" />
                Номера и программы
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Добавьте свои шоу-номера и программы
              </p>
            </div>
            <Button 
              onClick={() => setIsFormOpen(true)}
              className="bg-orange-500 hover:bg-orange-600 rounded-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить программу
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {programs.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-[24px]">
              <Sparkles className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <h3 className="text-base font-semibold text-slate-900 mb-2">Нет программ</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Добавьте свои шоу-номера и программы, чтобы клиенты могли их заказать
              </p>
              <Button
                onClick={() => setIsFormOpen(true)}
                className="bg-orange-500 hover:bg-orange-600 rounded-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Добавить первую программу
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {programs.map((program) => (
                <Card key={program.id} className="border-none shadow-sm rounded-[28px] overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      {/* Фото программы */}
                      <div className="w-32 flex-shrink-0">
                        <div className="aspect-square w-full relative rounded-[24px] overflow-hidden bg-slate-100">
                          {program.photos?.[0] ? (
                            <Image
                              src={program.photos[0]}
                              alt={program.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <Sparkles className="h-10 w-10 opacity-20" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Информация */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-slate-900 mb-2">{program.name}</h3>
                            {program.description && (
                              <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                                {program.description}
                              </p>
                            )}
                            
                            {/* Метаданные */}
                            <div className="flex flex-wrap gap-2 text-xs">
                              {program.duration && (
                                <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-[18px] font-medium">
                                  {program.duration} мин
                                </span>
                              )}
                              {program.performers_count && (
                                <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-[18px] font-medium">
                                  {program.performers_count} {program.performers_count === 1 ? 'артист' : 'артистов'}
                                </span>
                              )}
                              {program.genres?.map((genre) => (
                                <span key={genre} className="px-2 py-1 bg-orange-50 text-orange-700 rounded-[18px] font-medium">
                                  {SHOW_GENRES[genre as ShowGenre] || genre}
                                </span>
                              ))}
                              {program.age_ranges?.map((range) => (
                                <span key={range} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-[18px] font-medium">
                                  {SHOW_AGE_RANGES[range as ShowAgeRange] || range}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Кнопки управления */}
                          <div className="flex gap-2 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(program)}
                              className="rounded-xl"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDeletingId(program.id)}
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
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить программу?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Программа будет удалена навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && handleDelete(deletingId)}
              className="bg-red-600 hover:bg-red-700 rounded-full"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}




