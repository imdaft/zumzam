'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

interface FAQItem {
  question: string
  answer: string
}

interface FAQManagerProps {
  profileId: string
  initialData?: FAQItem[]
  hideHeader?: boolean
}

export function FAQManager({ profileId, initialData = [], hideHeader }: FAQManagerProps) {
  const [faq, setFaq] = useState<FAQItem[]>(initialData)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [editData, setEditData] = useState<FAQItem>({ question: '', answer: '' })
  const [isSaving, setIsSaving] = useState(false)

  const handleAdd = () => {
    setEditIndex(faq.length)
    setEditData({ question: '', answer: '' })
  }

  const handleEdit = (index: number) => {
    setEditIndex(index)
    setEditData(faq[index])
  }

  const handleSave = async () => {
    if (!editData.question.trim() || !editData.answer.trim()) {
      setTimeout(() => toast.error('Заполните вопрос и ответ'), 0)
      return
    }

    setIsSaving(true)
    try {
      const newFaq = [...faq]
      if (editIndex !== null) {
        if (editIndex === faq.length) {
          newFaq.push(editData)
        } else {
          newFaq[editIndex] = editData
        }
      }

      const res = await fetch(`/api/profiles/${profileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faq: newFaq })
      })

      if (!res.ok) throw new Error('Ошибка сохранения')

      setFaq(newFaq)
      setEditIndex(null)
      setEditData({ question: '', answer: '' })
      setTimeout(() => toast.success('FAQ сохранен!'), 0)
    } catch (err) {
      setTimeout(() => toast.error('Не удалось сохранить'), 0)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (index: number) => {
    if (!confirm('Удалить этот вопрос?')) return

    setIsSaving(true)
    try {
      const newFaq = faq.filter((_, i) => i !== index)

      const res = await fetch(`/api/profiles/${profileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faq: newFaq })
      })

      if (!res.ok) throw new Error('Ошибка удаления')

      setFaq(newFaq)
      setTimeout(() => toast.success('Вопрос удален'), 0)
    } catch (err) {
      setTimeout(() => toast.error('Не удалось удалить'), 0)
    } finally {
      setIsSaving(false)
    }
  }

  const addButton = (
    <Button 
      onClick={handleAdd}
      className="rounded-[24px] h-10 px-4 w-full sm:w-auto shrink-0 bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors"
    >
      <Plus className="w-4 h-4 mr-2" />
      Добавить вопрос
    </Button>
  )

  const content = (
    <>
      {!hideHeader && (
        <CardHeader className="border-b border-slate-200 p-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <CardTitle className="text-base sm:text-lg font-bold text-slate-900 leading-tight text-left">
              Часто задаваемые вопросы
            </CardTitle>
            {addButton}
          </div>
        </CardHeader>
      )}

      <CardContent className={hideHeader ? "p-0" : "p-4"}>
        {hideHeader && faq.length > 0 && editIndex === null && (
          <div className="px-3 pt-3 pb-2">
            {addButton}
          </div>
        )}

        {/* Список FAQ */}
        <div className={hideHeader ? "space-y-2 px-3 pb-3" : "space-y-3 mb-6"}>
        {faq.map((item, index) => (
          <Card key={index} className="p-3 rounded-[18px] border border-slate-200 bg-slate-50">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-slate-900 mb-1.5 leading-tight">{item.question}</h4>
                <p className="text-sm text-slate-600 whitespace-pre-wrap leading-snug">{item.answer}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(index)}
                  className="h-8 w-8 p-0 rounded-[12px] hover:bg-slate-200"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(index)}
                  className="h-8 w-8 p-0 rounded-[12px] text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {faq.length === 0 && editIndex === null && (
          <div className={hideHeader ? "text-center py-12 px-3" : "text-center py-12"}>
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-base text-slate-600 mb-4">Добавьте вопросы</p>
            <Button 
              onClick={handleAdd}
              className="rounded-[24px] h-10 px-5 bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить вопрос
            </Button>
          </div>
        )}
      </div>

      {/* Форма редактирования */}
      {editIndex !== null && (
        <div className={hideHeader ? "px-3 pb-3" : ""}>
          <Card className="p-4 rounded-[18px] border border-orange-200 bg-orange-50/50">
            <h4 className="text-sm font-semibold text-slate-900 mb-3 text-left">
              {editIndex === faq.length ? 'Новый вопрос' : 'Редактирование'}
            </h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1.5 block text-left">
                  Вопрос
                </label>
                <Input
                  value={editData.question}
                  onChange={(e) => setEditData({ ...editData, question: e.target.value })}
                  placeholder="Например: Можно ли прийти с тортом?"
                  className="h-10 rounded-[18px] text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1.5 block text-left">
                  Ответ
                </label>
                <Textarea
                  value={editData.answer}
                  onChange={(e) => setEditData({ ...editData, answer: e.target.value })}
                  placeholder="Да, конечно! Вы можете принести свой торт..."
                  rows={4}
                  className="rounded-[18px] resize-none text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="rounded-[18px] h-10 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {isSaving ? 'Сохранение...' : 'Сохранить'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditIndex(null)
                    setEditData({ question: '', answer: '' })
                  }}
                  disabled={isSaving}
                  className="rounded-[18px] h-10"
                >
                  Отмена
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      </CardContent>
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















