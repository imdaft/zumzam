/**
 * Layout для админ-панели ZumZam
 */

'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Shield, Users, Star, FileText, BarChart3, Settings, Zap, ArrowLeft, Rocket, CreditCard, TrendingUp, FlaskConical, Building2, CheckSquare, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Обзор', href: '/admin', icon: Shield, exactMatch: true },
    { name: 'Пользователи', href: '/admin/users', icon: Users },
    { name: 'Профили', href: '/admin/profiles', icon: FileText },
    { name: 'Заявки на владение', href: '/admin/claim-requests', icon: Building2 },
    { name: 'Отзывы', href: '/admin/reviews', icon: Star },
    { name: 'Подписки', href: '/admin/subscriptions', icon: CreditCard },
    { name: 'Реклама', href: '/admin/advertising', icon: TrendingUp },
    { name: 'Аналитика', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Статус страниц', href: '/admin/pages-status', icon: CheckSquare },
    { name: 'Настройки AI', href: '/admin/ai-settings', icon: Zap },
    { name: 'Тестирование', href: '/admin/tests', icon: FlaskConical },
    { name: 'Настройки', href: '/admin/settings', icon: Settings },
  ]

  const isActive = (href: string, exactMatch?: boolean) => {
    if (exactMatch) {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <div className="min-h-screen bg-[#F3F3F5]">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/" className="flex items-center gap-2" onClick={closeMobileMenu}>
            <Image 
              src="/zumzam_mob.svg" 
              alt="ZumZam" 
              width={36}
              height={24}
              className="h-6 w-auto"
              priority
            />
            <span className="text-xs font-semibold text-slate-500">Admin</span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 h-full w-64 bg-white border-r border-slate-200 overflow-y-auto z-50 transition-transform duration-300",
        "lg:translate-x-0",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6">
          {/* Лого */}
          <Link href="/" className="block mb-8 hover:opacity-90 transition-opacity" onClick={closeMobileMenu}>
            <div className="flex items-center gap-2">
              <Image 
                src="/zumzam.svg" 
                alt="ZumZam" 
                width={160}
                height={30}
                className="h-7 w-auto"
                quality={100}
                unoptimized
                priority
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">Панель администратора</p>
          </Link>

          {/* Навигация */}
          <nav className="space-y-1">
            {navigation.map((item) => {
              const active = isActive(item.href, item.exactMatch)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    active
                      ? "bg-gradient-to-r from-[#FF6B35]/10 to-[#F7931E]/10 text-[#FF6B35] shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5 transition-transform",
                    active && "scale-110"
                  )} />
                  {item.name}
                  {active && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FF6B35]" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Кнопка возврата */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <Link
              href="/"
              onClick={closeMobileMenu}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Вернуться на сайт
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  )
}

