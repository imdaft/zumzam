'use client'

import { MapPin, Phone, Mail, Globe, MessageCircle, Clock } from 'lucide-react'
import { Profile } from '@/lib/types/profile'
import { Button } from '@/components/ui/button'

/**
 * Блок контактов
 */
export function ContactsBlock({ profile }: { profile: Profile }) {
  return (
    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Контакты</h2>
      
      <div className="space-y-4">
        {/* Адрес */}
        {profile.address && (
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-slate-900">Адрес</div>
              <div className="text-slate-600">{profile.address}</div>
            </div>
          </div>
        )}
        
        {/* Телефон */}
        {profile.phone && (
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-slate-900">Телефон</div>
              <a href={`tel:${profile.phone}`} className="text-orange-600 hover:underline">
                {profile.phone}
              </a>
            </div>
          </div>
        )}
        
        {/* Email */}
        {profile.email && (
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-slate-900">Email</div>
              <a href={`mailto:${profile.email}`} className="text-orange-600 hover:underline">
                {profile.email}
              </a>
            </div>
          </div>
        )}
        
        {/* Website */}
        {profile.website && (
          <div className="flex items-start gap-3">
            <Globe className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-slate-900">Сайт</div>
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 hover:underline"
              >
                {profile.website}
              </a>
            </div>
          </div>
        )}
        
        {/* Мессенджеры */}
        {profile.messenger_contacts && (
          <div className="flex items-start gap-3">
            <MessageCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-slate-900 mb-2">Мессенджеры</div>
              <div className="flex flex-wrap gap-2">
                {profile.messenger_contacts.whatsapp && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`https://wa.me/${profile.messenger_contacts.whatsapp}`} target="_blank" rel="noopener noreferrer">
                      WhatsApp
                    </a>
                  </Button>
                )}
                {profile.messenger_contacts.telegram && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`https://t.me/${profile.messenger_contacts.telegram}`} target="_blank" rel="noopener noreferrer">
                      Telegram
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Время работы */}
        {profile.working_hours && (
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-slate-900">Время работы</div>
              <div className="text-slate-600">
                {profile.working_hours.format === '24/7' && 'Круглосуточно'}
                {profile.working_hours.format === 'by_appointment' && 'По записи'}
                {profile.working_hours.format === 'schedule' && profile.working_hours.schedule && (
                  <div className="mt-2 space-y-1 text-sm">
                    {Object.entries(profile.working_hours.schedule).map(([day, hours]) => (
                      <div key={day} className="flex justify-between">
                        <span className="capitalize">{translateDay(day)}:</span>
                        <span>{hours.open} - {hours.close}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* CTA */}
      <div className="mt-6 pt-6 border-t border-slate-100">
        <Button size="lg" className="w-full bg-orange-600 hover:bg-orange-700">
          📞 Связаться с нами
        </Button>
      </div>
    </div>
  )
}

function translateDay(day: string): string {
  const days: Record<string, string> = {
    monday: 'Понедельник',
    tuesday: 'Вторник',
    wednesday: 'Среда',
    thursday: 'Четверг',
    friday: 'Пятница',
    saturday: 'Суббота',
    sunday: 'Воскресенье',
  }
  return days[day] || day
}





