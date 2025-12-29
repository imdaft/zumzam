'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronRight, Plus, Trash2, MapPin, Star } from 'lucide-react'

interface Branch {
  id: string
  name: string
  address: string
  phone: string
  isMain: boolean
}

interface WizardBranchesProps {
  data: any
  onNext: (data: any) => void
  onSkip: () => void
}

export function WizardBranches({ data, onNext, onSkip }: WizardBranchesProps) {
  const [branches, setBranches] = useState<Branch[]>(data.branches || [])
  const [newBranch, setNewBranch] = useState<Branch>({
    id: '',
    name: '',
    address: '',
    phone: '',
    isMain: branches.length === 0,
  })
  const [showForm, setShowForm] = useState(false)

  const handleAddBranch = () => {
    if (!newBranch.name || !newBranch.address) {
      alert('Заполните название и адрес филиала')
      return
    }

    const branch = {
      ...newBranch,
      id: `branch-${Date.now()}`,
    }

    setBranches([...branches, branch])
    setNewBranch({
      id: '',
      name: '',
      address: '',
      phone: '',
      isMain: false,
    })
    setShowForm(false)
  }

  const handleRemoveBranch = (id: string) => {
    setBranches(branches.filter((b) => b.id !== id))
  }

  const handleSetMain = (id: string) => {
    setBranches(
      branches.map((b) => ({
        ...b,
        isMain: b.id === id,
      }))
    )
  }

  const handleNext = () => {
    onNext({ branches })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
          Филиалы и адреса
        </h1>
        <p className="text-sm text-gray-500">
          <span className="text-orange-600 font-medium">Опционально</span> · Если у вас несколько локаций (можно пропустить)
        </p>
      </div>

      <div className="space-y-4 mb-6">
        {branches.length === 0 ? (
          <div className="text-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-xl">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-1">
              Дополнительные филиалы не добавлены
            </p>
            <p className="text-xs text-gray-400 mb-4">
              Основной адрес уже указан в базовой информации
            </p>
            <Button
              onClick={() => setShowForm(true)}
              variant="outline"
              className="mx-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить филиал
            </Button>
          </div>
        ) : (
          <>
            {branches.map((branch) => (
              <div
                key={branch.id}
                className="bg-white border border-gray-200 rounded-xl p-4 relative"
              >
                {branch.isMain && (
                  <div className="absolute top-3 right-12 flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                    <Star className="w-3 h-3 fill-current" />
                    Главный
                  </div>
                )}

                <button
                  onClick={() => handleRemoveBranch(branch.id)}
                  className="absolute top-3 right-3 p-2 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <h3 className="font-semibold text-gray-900 mb-2 pr-24">
                  {branch.name}
                </h3>

                <div className="space-y-1 text-sm">
                  <div className="flex items-start gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{branch.address}</span>
                  </div>

                  {branch.phone && (
                    <div className="text-gray-600">
                      📞 {branch.phone}
                    </div>
                  )}
                </div>

                {!branch.isMain && (
                  <Button
                    onClick={() => handleSetMain(branch.id)}
                    variant="ghost"
                    size="sm"
                    className="mt-3 text-xs h-7"
                  >
                    Сделать главным
                  </Button>
                )}
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
            <h3 className="font-semibold text-gray-900">Новый филиал</h3>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                Название филиала *
              </label>
              <Input
                value={newBranch.name}
                onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                placeholder="Например: Филиал на Невском"
                className="h-11 rounded-[16px]"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                Адрес *
              </label>
              <Input
                value={newBranch.address}
                onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                placeholder="Улица, дом"
                className="h-11 rounded-[16px]"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                Телефон
              </label>
              <Input
                value={newBranch.phone}
                onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })}
                placeholder="+7 (___) ___-__-__"
                className="h-11 rounded-[16px]"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newBranch.isMain}
                onChange={(e) => setNewBranch({ ...newBranch, isMain: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">
                Сделать главным филиалом
              </span>
            </label>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setShowForm(false)
                  setNewBranch({
                    id: '',
                    name: '',
                    address: '',
                    phone: '',
                    isMain: false,
                  })
                }}
                variant="outline"
                className="flex-1"
              >
                Отмена
              </Button>
              <Button
                onClick={handleAddBranch}
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

















