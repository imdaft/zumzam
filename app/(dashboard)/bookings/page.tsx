'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Loader2, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { BookingCard } from '@/components/features/booking/booking-card'
import { OrderCardProvider } from '@/components/features/booking/order-card-provider'
import { OrderCardClient } from '@/components/features/booking/order-card-client'
import { EmptyState } from '@/components/shared/empty-state'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/lib/contexts/auth-context'
import { cn } from '@/lib/utils'

function BookingsPage() {
  const router = useRouter()
  const { user, isLoading: userLoading } = useAuth()
  const [bookings, setBookings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<'client' | 'profile'>('client')

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login')
    }
  }, [user, userLoading, router])

  const loadBookings = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const profileResponse = await fetch(`/api/profiles?user_id=${user.id}`)
      const profileData = await profileResponse.json()
      
      const hasProfile = profileData.profiles && profileData.profiles.length > 0
      const role = hasProfile ? 'profile' : 'client'
      setUserRole(role)

      // Загружаем как старые bookings, так и новые orders
      let allBookings: any[] = []

      // Старые bookings
      const bookingsParams = new URLSearchParams()
      if (role === 'profile') {
        bookingsParams.append('profile_id', profileData.profiles[0].id)
      } else {
        bookingsParams.append('client_id', user.id)
      }

      const bookingsResponse = await fetch(`/api/bookings?${bookingsParams.toString()}`)
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json()
        allBookings = [...allBookings, ...(bookingsData.bookings || [])]
      }

      // Новые orders (только для поставщиков)
      if (role === 'profile') {
        const ordersParams = new URLSearchParams()
        ordersParams.append('role', 'provider')

        const ordersResponse = await fetch(`/api/orders?${ordersParams.toString()}`)
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json()
          // Добавляем метку, что это новые заявки
          const ordersWithType = (ordersData.orders || []).map((order: any) => ({
            ...order,
            isNewOrder: true, // флаг для различия старых и новых заявок
          }))
          allBookings = [...allBookings, ...ordersWithType]
        }
      }

      setBookings(allBookings)
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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-4 sm:p-5">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Заявки
        </h1>
        <p className="text-sm text-gray-600 mt-0.5">
          {userRole === 'client' 
            ? 'Управляйте вашими заявками на услуги'
            : 'Управляйте заявками от клиентов'
          }
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center">
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
            <p className="text-xs text-gray-600">Ожидают</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{pendingBookings.length}</p>
        </div>

        <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-xs text-gray-600">Подтверждено</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{confirmedBookings.length}</p>
        </div>

        <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-gray-600" />
            </div>
            <p className="text-xs text-gray-600">Завершено</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{completedBookings.length}</p>
        </div>

        <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
            <p className="text-xs text-gray-600">Отменено</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {cancelledBookings.length + rejectedBookings.length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <div className="bg-white rounded-[28px] shadow-sm border border-gray-100 p-1">
          <TabsList className="w-full bg-transparent gap-1">
            <TabsTrigger 
              value="all"
              className={cn(
                'flex-1 rounded-full text-sm font-semibold',
                'data-[state=active]:bg-orange-500 data-[state=active]:text-white'
              )}
            >
              Все ({bookings.length})
            </TabsTrigger>
            <TabsTrigger 
              value="pending"
              className={cn(
                'flex-1 rounded-full text-sm font-semibold',
                'data-[state=active]:bg-orange-500 data-[state=active]:text-white'
              )}
            >
              Ожидают ({pendingBookings.length})
            </TabsTrigger>
            <TabsTrigger 
              value="confirmed"
              className={cn(
                'hidden sm:flex flex-1 rounded-full text-sm font-semibold',
                'data-[state=active]:bg-orange-500 data-[state=active]:text-white'
              )}
            >
              Подтверждено ({confirmedBookings.length})
            </TabsTrigger>
            <TabsTrigger 
              value="completed"
              className={cn(
                'hidden sm:flex flex-1 rounded-full text-sm font-semibold',
                'data-[state=active]:bg-orange-500 data-[state=active]:text-white'
              )}
            >
              Завершено ({completedBookings.length})
            </TabsTrigger>
            <TabsTrigger 
              value="cancelled"
              className={cn(
                'hidden sm:flex flex-1 rounded-full text-sm font-semibold',
                'data-[state=active]:bg-orange-500 data-[state=active]:text-white'
              )}
            >
              Отменено ({cancelledBookings.length + rejectedBookings.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* All */}
        <TabsContent value="all" className="space-y-4">
          {bookings.length === 0 ? (
            <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-10 text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center mb-4 shadow-sm">
                <Calendar className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Нет заявок</h3>
              <p className="text-sm text-gray-600 mt-1">
                {userRole === 'client' ? 'Забронируйте свою первую услугу!' : 'Пока нет заявок от клиентов'}
              </p>
            </div>
          ) : (
            bookings.map((booking) => (
              booking.isNewOrder ? (
                userRole === 'profile' ? (
                  <OrderCardProvider
                    key={booking.id}
                    order={booking}
                    onStatusChange={loadBookings}
                  />
                ) : (
                  <OrderCardClient
                    key={booking.id}
                    order={booking}
                    onStatusChange={loadBookings}
                  />
                )
              ) : (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  userRole={userRole}
                  onStatusChange={loadBookings}
                />
              )
            ))
          )}
        </TabsContent>

        {/* Pending */}
        <TabsContent value="pending" className="space-y-4">
          {pendingBookings.length === 0 ? (
            <EmptyState
              icon={AlertCircle}
              title="Нет ожидающих"
              description="Все заявки обработаны"
            />
          ) : (
            pendingBookings.map((booking) => (
              booking.isNewOrder ? (
                userRole === 'profile' ? (
                  <OrderCardProvider
                    key={booking.id}
                    order={booking}
                    onStatusChange={loadBookings}
                  />
                ) : (
                  <OrderCardClient
                    key={booking.id}
                    order={booking}
                    onStatusChange={loadBookings}
                  />
                )
              ) : (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  userRole={userRole}
                  onStatusChange={loadBookings}
                />
              )
            ))
          )}
        </TabsContent>

        {/* Confirmed */}
        <TabsContent value="confirmed" className="space-y-4">
          {confirmedBookings.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Нет подтверждённых"
              description="Пока нет подтверждённых заявок"
            />
          ) : (
            confirmedBookings.map((booking) => (
              booking.isNewOrder ? (
                userRole === 'profile' ? (
                  <OrderCardProvider
                    key={booking.id}
                    order={booking}
                    onStatusChange={loadBookings}
                  />
                ) : (
                  <OrderCardClient
                    key={booking.id}
                    order={booking}
                    onStatusChange={loadBookings}
                  />
                )
              ) : (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  userRole={userRole}
                  onStatusChange={loadBookings}
                />
              )
            ))
          )}
        </TabsContent>

        {/* Completed */}
        <TabsContent value="completed" className="space-y-4">
          {completedBookings.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Нет завершённых"
              description="История завершённых мероприятий появится здесь"
            />
          ) : (
            completedBookings.map((booking) => (
              booking.isNewOrder ? (
                userRole === 'profile' ? (
                  <OrderCardProvider
                    key={booking.id}
                    order={booking}
                    onStatusChange={loadBookings}
                  />
                ) : (
                  <OrderCardClient
                    key={booking.id}
                    order={booking}
                    onStatusChange={loadBookings}
                  />
                )
              ) : (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  userRole={userRole}
                  onStatusChange={loadBookings}
                />
              )
            ))
          )}
        </TabsContent>

        {/* Cancelled */}
        <TabsContent value="cancelled" className="space-y-4">
          {cancelledBookings.length === 0 && rejectedBookings.length === 0 ? (
            <EmptyState
              icon={XCircle}
              title="Нет отменённых"
              description="Отменённые заявки появятся здесь"
            />
          ) : (
            [...cancelledBookings, ...rejectedBookings].map((booking) => (
              booking.isNewOrder ? (
                userRole === 'profile' ? (
                  <OrderCardProvider
                    key={booking.id}
                    order={booking}
                    onStatusChange={loadBookings}
                  />
                ) : (
                  <OrderCardClient
                    key={booking.id}
                    order={booking}
                    onStatusChange={loadBookings}
                  />
                )
              ) : (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  userRole={userRole}
                  onStatusChange={loadBookings}
                />
              )
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default BookingsPage
