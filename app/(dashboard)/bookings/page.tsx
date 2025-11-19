'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Loader2 } from 'lucide-react'
import { BookingCard } from '@/components/features/booking/booking-card'
import { EmptyState } from '@/components/shared/empty-state'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useUser } from '@/lib/hooks/useUser'

/**
 * Dashboard бронирований
 */
export default function BookingsPage() {
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const [bookings, setBookings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<'client' | 'profile'>('client')

  // Проверка авторизации
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login')
    }
  }, [user, userLoading, router])

  // Загрузка бронирований
  const loadBookings = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // Определяем роль пользователя (проверяем есть ли у него профиль)
      const profileResponse = await fetch(`/api/profiles?user_id=${user.id}`)
      const profileData = await profileResponse.json()
      
      const hasProfile = profileData.profiles && profileData.profiles.length > 0
      const role = hasProfile ? 'profile' : 'client'
      setUserRole(role)

      // Загружаем бронирования в зависимости от роли
      const params = new URLSearchParams()
      if (role === 'profile') {
        params.append('profile_id', profileData.profiles[0].id)
      } else {
        params.append('client_id', user.id)
      }

      const response = await fetch(`/api/bookings?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to load bookings')
      }

      const data = await response.json()
      setBookings(data.bookings || [])
    } catch (error) {
      console.error('Load bookings error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadBookings()
    }
  }, [user])

  // Фильтрация по статусу
  const filterByStatus = (status?: string) => {
    if (!status) return bookings
    return bookings.filter(b => b.status === status)
  }

  const pendingBookings = filterByStatus('pending')
  const confirmedBookings = filterByStatus('confirmed')
  const completedBookings = filterByStatus('completed')
  const cancelledBookings = filterByStatus('cancelled')
  const rejectedBookings = filterByStatus('rejected')

  if (userLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Бронирования</h1>
        <p className="text-muted-foreground mt-1">
          {userRole === 'client' 
            ? 'Управляйте вашими заявками на услуги'
            : 'Управляйте заявками от клиентов'
          }
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ожидают</CardDescription>
            <CardTitle className="text-3xl">{pendingBookings.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Подтверждено</CardDescription>
            <CardTitle className="text-3xl">{confirmedBookings.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Завершено</CardDescription>
            <CardTitle className="text-3xl">{completedBookings.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Отменено</CardDescription>
            <CardTitle className="text-3xl">
              {cancelledBookings.length + rejectedBookings.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">
            Все ({bookings.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Ожидают ({pendingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="confirmed">
            Подтверждено ({confirmedBookings.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Завершено ({completedBookings.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Отменено ({cancelledBookings.length + rejectedBookings.length})
          </TabsTrigger>
        </TabsList>

        {/* All */}
        <TabsContent value="all" className="space-y-4">
          {bookings.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="Нет бронирований"
              description={
                userRole === 'client'
                  ? 'Забронируйте свою первую услугу!'
                  : 'Пока нет заявок от клиентов'
              }
            />
          ) : (
            bookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                userRole={userRole}
                onStatusChange={loadBookings}
              />
            ))
          )}
        </TabsContent>

        {/* Pending */}
        <TabsContent value="pending" className="space-y-4">
          {pendingBookings.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="Нет ожидающих"
              description="Все бронирования обработаны"
            />
          ) : (
            pendingBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                userRole={userRole}
                onStatusChange={loadBookings}
              />
            ))
          )}
        </TabsContent>

        {/* Confirmed */}
        <TabsContent value="confirmed" className="space-y-4">
          {confirmedBookings.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="Нет подтверждённых"
              description="Пока нет подтверждённых бронирований"
            />
          ) : (
            confirmedBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                userRole={userRole}
                onStatusChange={loadBookings}
              />
            ))
          )}
        </TabsContent>

        {/* Completed */}
        <TabsContent value="completed" className="space-y-4">
          {completedBookings.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="Нет завершённых"
              description="История завершённых мероприятий появится здесь"
            />
          ) : (
            completedBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                userRole={userRole}
                onStatusChange={loadBookings}
              />
            ))
          )}
        </TabsContent>

        {/* Cancelled */}
        <TabsContent value="cancelled" className="space-y-4">
          {cancelledBookings.length === 0 && rejectedBookings.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="Нет отменённых"
              description="Отменённые бронирования появятся здесь"
            />
          ) : (
            [...cancelledBookings, ...rejectedBookings].map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                userRole={userRole}
                onStatusChange={loadBookings}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}


