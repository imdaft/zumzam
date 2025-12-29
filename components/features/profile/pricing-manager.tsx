'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Package, Ticket, Clock } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface PricingManagerProps {
  profileId: string
  onUpdate?: () => void
}

export function PricingManager({ profileId, onUpdate }: PricingManagerProps) {
  const [loading, setLoading] = useState(true)
  const [businessModels, setBusinessModels] = useState<string[]>([])

  useEffect(() => {
    loadData()
  }, [profileId])

  const loadData = async () => {
    try {
      const response = await fetch(`/api/profiles/${profileId}`)
      
      if (!response.ok) {
        throw new Error('Failed to load profile')
      }

      const data = await response.json()

      if (data) {
        setBusinessModels(data.business_models || [])
      }
    } catch (error) {
      console.error('Failed to load pricing data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="rounded-[24px] border-gray-100 shadow-sm">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  const hasPackages = businessModels.includes('packages_turnkey')
  const hasTickets = businessModels.includes('tickets_freeplay')
  const hasRental = businessModels.includes('rental_only') || businessModels.includes('hybrid')

  return (
    <Card className="rounded-[24px] border-gray-100 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900">
          Цены и пакеты
        </CardTitle>
        <CardDescription>
          Управление ценами на ваши услуги
        </CardDescription>
      </CardHeader>

      <CardContent>
        {businessModels.length === 0 ? (
          <Alert>
            <AlertDescription>
              Сначала выберите бизнес-модели в разделе "Основная информация" → "Классификация"
            </AlertDescription>
          </Alert>
        ) : (
          <Tabs defaultValue={hasPackages ? 'packages' : hasTickets ? 'tickets' : 'rental'}>
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${businessModels.length}, 1fr)` }}>
              {hasPackages && (
                <TabsTrigger value="packages" className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Пакеты
                </TabsTrigger>
              )}
              {hasTickets && (
                <TabsTrigger value="tickets" className="flex items-center gap-2">
                  <Ticket className="w-4 h-4" />
                  Билеты
                </TabsTrigger>
              )}
              {hasRental && (
                <TabsTrigger value="rental" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Аренда
                </TabsTrigger>
              )}
            </TabsList>

            {hasPackages && (
              <TabsContent value="packages" className="space-y-4">
                <Alert>
                  <AlertDescription>
                    🚧 Управление пакетами под ключ в разработке. Пока используйте раздел "Услуги и цены"
                  </AlertDescription>
                </Alert>
              </TabsContent>
            )}

            {hasTickets && (
              <TabsContent value="tickets" className="space-y-4">
                <Alert>
                  <AlertDescription>
                    🚧 Управление билетами в разработке. Пока используйте раздел "Услуги и цены"
                  </AlertDescription>
                </Alert>
              </TabsContent>
            )}

            {hasRental && (
              <TabsContent value="rental" className="space-y-4">
                <Alert>
                  <AlertDescription>
                    🚧 Управление арендой в разработке. Пока используйте раздел "Услуги и цены"
                  </AlertDescription>
                </Alert>
              </TabsContent>
            )}
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}




