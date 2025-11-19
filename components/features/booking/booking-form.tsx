'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Calendar as CalendarIcon, Clock, MapPin, Users, Baby, MessageSquare } from 'lucide-react'
import { createBookingSchema, type CreateBookingInput } from '@/lib/validations/booking'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface BookingFormProps {
  serviceId: string
  profileId: string
  serviceName?: string
  profileName?: string
  onSuccess?: (bookingId: string) => void
}

/**
 * Форма создания бронирования
 */
export function BookingForm({
  serviceId,
  profileId,
  serviceName,
  profileName,
  onSuccess,
}: BookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CreateBookingInput>({
    resolver: zodResolver(createBookingSchema),
    defaultValues: {
      service_id: serviceId,
      profile_id: profileId,
      event_date: '',
      event_time: '',
      child_age: 7,
      children_count: 10,
      event_address: '',
      client_message: '',
    },
  })

  const onSubmit = async (data: CreateBookingInput) => {
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ошибка создания бронирования')
      }

      const result = await response.json()
      
      toast.success('Заявка отправлена! 🎉', {
        description: 'Мы свяжемся с вами в ближайшее время.',
      })

      if (onSuccess) {
        onSuccess(result.booking.id)
      }

      form.reset()
    } catch (error: any) {
      console.error('Booking error:', error)
      toast.error('Ошибка отправки заявки', {
        description: error.message || 'Попробуйте ещё раз.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Заголовок */}
        {serviceName && (
          <div>
            <h3 className="text-lg font-semibold">Забронировать услугу</h3>
            <p className="text-sm text-muted-foreground">
              {serviceName} {profileName && `• ${profileName}`}
            </p>
          </div>
        )}

        {/* Дата */}
        <FormField
          control={form.control}
          name="event_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Дата мероприятия *</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? (
                        format(new Date(field.value), 'PPP', { locale: ru })
                      ) : (
                        <span>Выберите дату</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => field.onChange(date?.toISOString())}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Время */}
        <FormField
          control={form.control}
          name="event_time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Время начала *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="time" 
                    className="pl-10"
                    {...field} 
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Возраст и количество */}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="child_age"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Возраст именинника *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Baby className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="number" 
                      min="1" 
                      max="18"
                      className="pl-10"
                      {...field} 
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="children_count"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Количество детей *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="number" 
                      min="1" 
                      max="100"
                      className="pl-10"
                      {...field} 
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Адрес */}
        <FormField
          control={form.control}
          name="event_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Адрес проведения *</FormLabel>
              <FormControl>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea 
                    placeholder="Город, улица, дом, квартира"
                    className="pl-10 min-h-[80px]"
                    {...field} 
                  />
                </div>
              </FormControl>
              <FormDescription>
                Укажите точный адрес проведения мероприятия
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Пожелания */}
        <FormField
          control={form.control}
          name="client_message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Пожелания и комментарии</FormLabel>
              <FormControl>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea 
                    placeholder="Расскажите о ваших пожеланиях, особенностях мероприятия..."
                    className="pl-10 min-h-[100px]"
                    {...field} 
                  />
                </div>
              </FormControl>
              <FormDescription>
                Укажите тему праздника, интересы ребёнка, особые пожелания
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit */}
        <Button 
          type="submit" 
          size="lg" 
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Отправляем...' : 'Отправить заявку'}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          После отправки заявки с вами свяжется организатор для уточнения деталей
        </p>
      </form>
    </Form>
  )
}

