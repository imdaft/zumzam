import Link from 'next/link'
import Image from 'next/image'
import { ROUTES } from '@/lib/constants'
import { UserMenu } from '@/components/shared/user-menu'
import { HeaderActions } from '@/components/shared/header-actions'
import { CitySelector } from '@/components/features/header/city-selector'
import { MobileBottomTabs } from '@/components/shared/mobile-bottom-tabs'
import { MobileHeaderIcons } from '@/components/shared/mobile-header-icons'
import { MobileProfileAvatar } from '@/components/shared/mobile-profile-avatar'
import { ChatWidget } from '@/components/features/ai/chat-widget'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register'
import { PWAInstallPrompt } from '@/components/pwa/pwa-install-prompt'
import { Search, MessageCircle } from 'lucide-react'

// Убран force-dynamic - layout статичный, данные грузятся на клиенте

export const metadata = {
  title: 'ZumZam - детские праздники',
  description: 'Платформа для поиска и бронирования услуг детских праздников: аниматоры, шоу, квесты, мастер-классы, фотографы',
  keywords: 'детские праздники, аниматоры, шоу, квесты, мастер-классы, фотографы, СПб',
  authors: [{ name: 'ZumZam Team' }],
  creator: 'ZumZam',
  publisher: 'ZumZam',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://zumzam.ru'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'ZumZam - детские праздники',
    description: 'Найдите лучших аниматоров, шоу-программы и площадки для детского праздника в СПб',
    url: 'https://zumzam.ru',
    siteName: 'ZumZam',
    locale: 'ru_RU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZumZam - детские праздники',
    description: 'Найдите лучших аниматоров, шоу-программы и площадки для детского праздника в СПб',
    creator: '@zumzam_kids',
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ZumZam',
    startupImage: [
      {
        url: '/icon-512.png',
        media: '(device-width: 768px) and (device-height: 1024px)',
      },
    ],
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#f97316',
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TooltipProvider delayDuration={200}>
    <ServiceWorkerRegister />
    <PWAInstallPrompt />
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header — стиль Яндекс.Еды, компактный на мобильных */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* Left: Logo */}
            <Link href={ROUTES.HOME} className="shrink-0 hover:opacity-90 transition-opacity">
              {/* Мобильный логотип */}
              <Image 
                src="/zumzam_mob.svg" 
                alt="ZumZam" 
                width={36}
                height={24}
                className="h-6 w-auto md:hidden"
                unoptimized
                priority
              />
              {/* Десктопный логотип */}
              <Image 
                src="/zumzam.svg" 
                alt="ZumZam" 
                width={110}
                height={22}
                className="h-6 w-auto hidden md:block"
                unoptimized
                priority
              />
            </Link>

            {/* Center: Search Bar (desktop only) */}
            <div className="flex-1 max-w-2xl mx-4 hidden md:block">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="text"
                  placeholder="Найти аниматора, шоу или квест..."
                  className="w-full h-10 pl-12 pr-4 bg-gray-100 hover:bg-gray-50 focus:bg-white border-2 border-transparent focus:border-gray-200 rounded-full text-[15px] focus:outline-none transition-all placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1 md:gap-2 shrink-0">
              {/* City Selector — только на десктопе */}
              <div className="hidden md:block">
                <CitySelector />
              </div>
              
              {/* HeaderActions — только на десктопе */}
              <div className="hidden md:flex">
                <HeaderActions />
              </div>
              
              {/* MobileHeaderIcons — только на мобильных */}
              <div className="flex md:hidden">
                <MobileHeaderIcons />
              </div>
              
              {/* UserMenu — только десктоп */}
              <div className="hidden md:block">
                <UserMenu />
              </div>
              
              {/* Аватарка профиля — только мобильные */}
              <MobileProfileAvatar />
            </div>
          </div>
        </div>
        
        {/* Mobile Search Bar — УБРАНО, используем иконку поиска в header */}
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-white pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Tabs */}
      <MobileBottomTabs />

      {/* AI Chat Widget - только на desktop */}
      <div className="hidden md:block">
        <ChatWidget />
      </div>

      {/* Footer - минималистичный в стиле Яндекса */}
      <footer className="bg-white border-t border-gray-100 mt-auto">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          {/* Основная строка */}
          <div className="flex flex-col md:flex-row md:items-center justify-between py-4 md:py-6 gap-4">
            {/* Логотип и навигация */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
              <Link href={ROUTES.HOME} className="shrink-0">
                <Image 
                  src="/zumzam.svg" 
                  alt="ZumZam" 
                  width={100}
                  height={20}
                  className="h-5 w-auto opacity-60 hover:opacity-100 transition-opacity"
                  unoptimized
                />
              </Link>
              
              <nav className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-500">
                <Link href={ROUTES.SEARCH} className="hover:text-gray-900 transition-colors">Каталог</Link>
                <Link href={ROUTES.SIGNUP} className="hover:text-gray-900 transition-colors">Партнёрам</Link>
                <Link href="/help" className="hover:text-gray-900 transition-colors">Помощь</Link>
              </nav>
            </div>

            {/* Соцсети */}
            <div className="flex items-center gap-2 sm:gap-3">
              <a 
                href="https://vk.com/zumzam_kids" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-100 hover:bg-[#0077FF] flex items-center justify-center text-gray-500 hover:text-white transition-all text-xs font-medium"
              >
                VK
              </a>
              <a 
                href="https://t.me/zumzam_kids" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-100 hover:bg-[#26A5E4] flex items-center justify-center text-gray-500 hover:text-white transition-all text-xs font-medium"
              >
                TG
              </a>
            </div>
          </div>

          {/* Нижняя строка — копирайт и правовые ссылки */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 md:py-4 border-t border-gray-100 text-xs text-gray-400 gap-3 md:gap-0">
            <p className="order-2 md:order-1">&copy; {new Date().getFullYear()} ZumZam</p>
            
            {/* Правовые ссылки — на мобильных компактно */}
            <div className="order-1 md:order-2 grid grid-cols-2 sm:flex sm:flex-wrap gap-x-4 gap-y-2">
              <Link href="/terms" className="hover:text-gray-600 transition-colors whitespace-nowrap">Условия</Link>
              <Link href="/privacy" className="hover:text-gray-600 transition-colors whitespace-nowrap">Конфиденциальность</Link>
              <Link href="/cookies-policy" className="hover:text-gray-600 transition-colors whitespace-nowrap">Cookies</Link>
              <Link href="/executor-agreement" className="hover:text-gray-600 transition-colors whitespace-nowrap">Исполнителям</Link>
              <Link href="/subscription-terms" className="hover:text-gray-600 transition-colors whitespace-nowrap">Подписки</Link>
              <Link href="/cancellation-policy" className="hover:text-gray-600 transition-colors whitespace-nowrap">Отмена</Link>
              <Link href="/reviews-policy" className="hover:text-gray-600 transition-colors whitespace-nowrap">Отзывы</Link>
              <Link href="/disclaimer" className="hover:text-gray-600 transition-colors whitespace-nowrap">Ответственность</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </TooltipProvider>
  )
}
