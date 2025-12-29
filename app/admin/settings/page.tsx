'use client'

/**
 * Админка: Настройки сайта
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const FONTS = [
  { value: 'Helvetica Neue', label: 'Helvetica Neue', desc: 'Минималистичный премиум' },
  { value: 'Nunito', label: 'Nunito', desc: 'Мягкий и дружелюбный' },
  { value: 'Montserrat', label: 'Montserrat', desc: 'Округлый популярный' },
  { value: 'Jost', label: 'Jost', desc: 'Современный геометрия' },
  { value: 'Commissioner', label: 'Commissioner', desc: 'Элегантный округлый' },
  { value: 'Ubuntu', label: 'Ubuntu', desc: 'Дружелюбный мягкий' },
  { value: 'Open Sans', label: 'Open Sans', desc: 'Универсальный читаемый' },
  { value: 'Raleway', label: 'Raleway', desc: 'Утончённый элегантный' },
  { value: 'Onest', label: 'Onest', desc: 'Современный чистый' },
  { value: 'Quicksand', label: 'Quicksand', desc: 'Игривый и лёгкий' },
  { value: 'Comfortaa', label: 'Comfortaa', desc: 'Супер-округлый' },
  { value: 'Rubik', label: 'Rubik', desc: 'Универсальный кубики' },
  { value: 'Manrope', label: 'Manrope', desc: 'Строгий элегантный' },
  { value: 'Inter', label: 'Inter', desc: 'Нейтральный UI' },
  { value: 'Exo 2', label: 'Exo 2', desc: 'Museo-style техно' },
  { value: 'Public Sans', label: 'Public Sans', desc: 'Helvetica-style' },
]

export default function AdminSettingsPage() {
  const [selectedFont, setSelectedFont] = useState('Nunito')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const savedFont = localStorage.getItem('site-font') || 'Nunito'
    setSelectedFont(savedFont)
    applyFont(savedFont)
  }, [])

  const applyFont = (font: string) => {
    document.documentElement.style.setProperty('--font-family', font)
    document.body.style.fontFamily = `'${font}', system-ui, sans-serif`
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      localStorage.setItem('site-font', selectedFont)
      applyFont(selectedFont)
      toast.success(`Шрифт ${selectedFont} сохранён`)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePreview = (font: string) => {
    setSelectedFont(font)
    applyFont(font)
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <h1 className="text-[28px] sm:text-[32px] font-bold text-gray-900 mb-6">Настройки сайта</h1>

      {/* Шрифт */}
      <div className="bg-white border rounded-lg p-4 mb-4">
        <h2 className="font-semibold text-gray-700 mb-3">Шрифт сайта</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-5">
          {FONTS.map((font) => (
            <button
              key={font.value}
              onClick={() => handlePreview(font.value)}
              className={`p-4 rounded-[18px] text-left border-2 transition-all ${
                selectedFont === font.value
                  ? 'border-orange-500 bg-orange-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
              style={{ fontFamily: `'${font.value}', system-ui, sans-serif` }}
            >
              <div className="font-bold text-[15px] mb-1">{font.label}</div>
              <div className="text-[13px] text-gray-500">{font.desc}</div>
            </button>
          ))}
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-orange-500 hover:bg-orange-600 rounded-full px-6 h-11 text-[15px] font-medium"
        >
          {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
        </Button>
      </div>

      {/* Превью */}
      <div className="bg-white border rounded-[24px] p-5 shadow-sm">
        <h2 className="font-bold text-gray-900 mb-4 text-lg">Превью шрифта {selectedFont}</h2>
        <div className="space-y-4">
          <h1 className="text-[32px] font-bold text-gray-900">Заголовок H1 — 32px</h1>
          <h2 className="text-[24px] font-bold text-gray-900">Заголовок H2 — 24px</h2>
          <h3 className="text-[20px] font-bold text-gray-900">Заголовок H3 — 20px</h3>
          <p className="text-[15px] text-gray-700 leading-relaxed">
            Это обычный текст размером 15px с шрифтом <span className="font-semibold">{selectedFont}</span>. 
            Проверяем читаемость кириллицы и цифр: 1234567890. 
            АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ абвгдежзийклмнопрстуфхцчшщъыьэюя.
          </p>
          <div className="flex gap-3 pt-2">
            <Button className="bg-orange-500 hover:bg-orange-600 rounded-full">Основная кнопка</Button>
            <Button variant="outline" className="rounded-full">Вторая кнопка</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
