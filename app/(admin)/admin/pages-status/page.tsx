'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, X, AlertCircle } from 'lucide-react'

interface PageStatus {
  id: string
  section: string
  name: string
  path: string
  desktop_ready: boolean
  mobile_ready: boolean
  tablet_ready: boolean
  priority: number
  notes?: string
  updated_at: string
}

export default function PagesStatusPage() {
  const [pages, setPages] = useState<PageStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchPages()
  }, [])

  const fetchPages = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/admin/pages-status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPages(data.pages || [])
      }
    } catch (error) {
      console.error('Error fetching pages:', error)
    } finally {
      setLoading(false)
    }
  }

  const groupedPages = pages.reduce((acc, page) => {
    if (!acc[page.section]) {
      acc[page.section] = []
    }
    acc[page.section].push(page)
    return acc
  }, {} as Record<string, PageStatus[]>)

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <Check className="w-5 h-5 text-green-600" />
    ) : (
      <X className="w-5 h-5 text-red-500" />
    )
  }

  const getReadinessPercent = (page: PageStatus) => {
    const total = 3
    const ready = [page.desktop_ready, page.mobile_ready, page.tablet_ready].filter(Boolean).length
    return Math.round((ready / total) * 100)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Статус страниц</h1>
        <p className="text-slate-600">Готовность страниц для разных устройств</p>
      </div>

      {/* Фильтры */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'all'
              ? 'bg-orange-500 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Все
        </button>
        <button
          onClick={() => setFilter('ready')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'ready'
              ? 'bg-orange-500 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Готовые
        </button>
        <button
          onClick={() => setFilter('incomplete')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'incomplete'
              ? 'bg-orange-500 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          В работе
        </button>
      </div>

      {/* Страницы по секциям */}
      <div className="space-y-6">
        {Object.entries(groupedPages).map(([section, sectionPages]) => (
          <Card key={section} className="rounded-[24px] border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-900">
                {section}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sectionPages.map((page) => {
                  const readiness = getReadinessPercent(page)
                  
                  return (
                    <div
                      key={page.id}
                      className="p-4 bg-slate-50 rounded-[18px] border border-slate-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900">{page.name}</h3>
                          <p className="text-sm text-slate-500">{page.path}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right mr-4">
                            <div className={`text-2xl font-bold ${
                              readiness === 100 ? 'text-green-600' : 'text-orange-600'
                            }`}>
                              {readiness}%
                            </div>
                            <div className="text-xs text-slate-500">готовность</div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(page.desktop_ready)}
                          <span className="text-sm text-slate-700">Desktop</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(page.mobile_ready)}
                          <span className="text-sm text-slate-700">Mobile</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(page.tablet_ready)}
                          <span className="text-sm text-slate-700">Tablet</span>
                        </div>
                      </div>

                      {page.notes && (
                        <div className="mt-3 p-3 bg-yellow-50 rounded-lg flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                          <p className="text-sm text-slate-700">{page.notes}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}



