'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, Trash2, Loader2, Map } from 'lucide-react'
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
import { QuestProgramForm } from './quest-program-form'

interface QuestProgramsManagerProps {
  profileId: string
}

interface QuestProgram {
  id: string
  name: string
  description: string | null
  photos: string[]
  themes: string[]
  difficulty: string | null
  duration: number | null
  min_players: number | null
  max_players: number | null
  is_active: boolean
  created_at: string
}

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Легкая',
  medium: 'Средняя',
  hard: 'Сложная'
}

export function QuestProgramsManager({ profileId }: QuestProgramsManagerProps) {
  const [programs, setPrograms] = useState<QuestProgram[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProgram, setEditingProgram] = useState<QuestProgram | null>(null)

  const fetchPrograms = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/quest-programs?profile_id=${profileId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to load programs: ${response.statusText}`)
      }
      
      const data = await response.json()
      const programsList = Array.isArray(data.programs) ? data.programs : []
      setPrograms(programsList)
    } catch (error: any) {
      console.error('[QuestPrograms] Error:', error)
      toast.error(`Не удалось загрузить квесты: ${error?.message || 'Неизвестная ошибка'}`)
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
      const response = await fetch(`/api/quest-programs/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete')
      }

      await refetchPrograms()
      toast.success('Квест удален')
    } catch (error) {
      toast.error('Не удалось удалить квест')
    } finally {
      setDeletingId(null)
    }
  }

  const handleEdit = useCallback((program: QuestProgram) => {
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
      toast.error('Квест сохранен, но не удалось обновить список. Обновите страницу.')
    } finally {
      setIsFormOpen(false)
      setEditingProgram(null)
    }
  }, [refetchPrograms])

  if (isFormOpen) {
    return (
      <QuestProgramForm
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Map className="w-5 h-5 text-orange-500" />
                Наши квесты
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Добавьте квесты, которые вы проводите
              </p>
            </div>
            <Button 
              onClick={() => setIsFormOpen(true)}
              className="bg-orange-500 hover:bg-orange-600 rounded-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить квест
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {programs.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-[24px]">
              <Map className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <h3 className="text-base font-semibold text-slate-900 mb-2">Нет квестов</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Добавьте квесты, чтобы клиенты могли их заказать
              </p>
              <Button 
                onClick={() => setIsFormOpen(true)}
                className="bg-orange-500 hover:bg-orange-600 rounded-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Добавить первый квест
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {programs.map((program) => (
                <Card key={program.id} className="border-none shadow-sm rounded-[28px] overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      {/* Фото квеста */}
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
                              <Map className="h-10 w-10 opacity-20" />
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
                              {program.difficulty && (
                                <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-[18px] font-medium">
                                  {DIFFICULTY_LABELS[program.difficulty] || program.difficulty}
                                </span>
                              )}
                              {program.duration && (
                                <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-[18px] font-medium">
                                  {program.duration} мин
                                </span>
                              )}
                              {program.min_players && program.max_players && (
                                <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-[18px] font-medium">
                                  {program.min_players}-{program.max_players} чел
                                </span>
                              )}
                              {program.themes?.map((theme) => (
                                <span key={theme} className="px-2 py-1 bg-orange-50 text-orange-700 rounded-[18px] font-medium">
                                  {theme}
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

      {/* Delete Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить квест?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить
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




