'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ChevronRight, Plus, Trash2, HelpCircle } from 'lucide-react'

interface FAQ {
  id: string
  question: string
  answer: string
}

interface WizardFAQProps {
  data: any
  onNext: (data: any) => void
  onSkip: () => void
}

export function WizardFAQ({ data, onNext, onSkip }: WizardFAQProps) {
  const [faqs, setFaqs] = useState<FAQ[]>(data.faq || [])
  const [newFAQ, setNewFAQ] = useState<FAQ>({
    id: '',
    question: '',
    answer: '',
  })
  const [showForm, setShowForm] = useState(false)

  const handleAddFAQ = () => {
    if (!newFAQ.question || !newFAQ.answer) {
      alert('Заполните вопрос и ответ')
      return
    }

    const faq = {
      ...newFAQ,
      id: `faq-${Date.now()}`,
    }

    setFaqs([...faqs, faq])
    setNewFAQ({
      id: '',
      question: '',
      answer: '',
    })
    setShowForm(false)
  }

  const handleRemoveFAQ = (id: string) => {
    setFaqs(faqs.filter((f) => f.id !== id))
  }

  const handleNext = () => {
    onNext({ faq: faqs })
  }

  // Популярные вопросы для подсказки
  const suggestedQuestions = [
    'Какой минимальный заказ?',
    'Есть ли скидки на группы?',
    'Нужна ли предоплата?',
    'Можно ли принести свою еду?',
    'Есть ли парковка?',
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
          Часто задаваемые вопросы
        </h1>
        <p className="text-sm text-gray-500">
          <span className="text-blue-600 font-medium">Рекомендуется</span> · Ответьте на популярные вопросы заранее (можно пропустить)
        </p>
      </div>

      <div className="space-y-4 mb-6">
        {faqs.length === 0 ? (
          <div className="text-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-xl">
            <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-1">
              Вопросы пока не добавлены
            </p>
            <p className="text-xs text-gray-400 mb-4">
              Добавьте ответы на частые вопросы клиентов
            </p>
            <Button
              onClick={() => setShowForm(true)}
              variant="outline"
              className="mx-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить вопрос
            </Button>

            {/* Подсказки */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-700 mb-2">
                Популярные вопросы:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setNewFAQ({ ...newFAQ, question: q })
                      setShowForm(true)
                    }}
                    className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {faqs.map((faq, index) => (
              <div
                key={faq.id}
                className="bg-white border border-gray-200 rounded-xl p-4 relative"
              >
                <button
                  onClick={() => handleRemoveFAQ(faq.id)}
                  className="absolute top-3 right-3 p-2 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex items-start gap-3 pr-8">
                  <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {faq.question}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {!showForm && (
              <Button
                onClick={() => setShowForm(true)}
                variant="outline"
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Добавить ещё
              </Button>
            )}
          </>
        )}

        {showForm && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
            <h3 className="font-semibold text-gray-900">Новый вопрос</h3>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                Вопрос *
              </label>
              <Input
                value={newFAQ.question}
                onChange={(e) => setNewFAQ({ ...newFAQ, question: e.target.value })}
                placeholder="Например: Какой минимальный заказ?"
                className="h-11 rounded-[16px]"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                Ответ *
              </label>
              <Textarea
                value={newFAQ.answer}
                onChange={(e) => setNewFAQ({ ...newFAQ, answer: e.target.value })}
                placeholder="Подробный ответ на вопрос..."
                className="min-h-[100px] rounded-[16px]"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setShowForm(false)
                  setNewFAQ({
                    id: '',
                    question: '',
                    answer: '',
                  })
                }}
                variant="outline"
                className="flex-1"
              >
                Отмена
              </Button>
              <Button
                onClick={handleAddFAQ}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                Добавить
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Кнопки навигации */}
      <div className="mt-8 flex gap-3 pb-20 lg:pb-6">
        <Button
          onClick={onSkip}
          variant="outline"
          className="flex-1 h-11 sm:h-12 rounded-full font-semibold text-sm"
        >
          Пропустить
        </Button>
        <Button
          onClick={handleNext}
          className="flex-1 h-11 sm:h-12 bg-orange-500 hover:bg-orange-600 rounded-full font-semibold text-sm"
        >
          Далее
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
        </Button>
      </div>
    </div>
  )
}

















