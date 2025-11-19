import Link from 'next/link'
import { ROUTES } from '@/lib/constants'
import { UserMenu } from '@/components/shared/user-menu'

// Отключаем статическую генерацию для всех public страниц
export const dynamic = 'force-dynamic'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href={ROUTES.HOME} className="text-2xl font-bold text-orange-600 dark:text-orange-400 flex items-center gap-2">
              <span>🚀</span>
              <span>DetiNaRakete</span>
            </Link>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link 
                href={ROUTES.SEARCH}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                Поиск
              </Link>
              <Link 
                href="/scenario-generator"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors flex items-center gap-1"
              >
                <span>✨</span>
                Генератор сценариев
              </Link>
              <Link 
                href="/#how-it-works"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                Как это работает
              </Link>
              <Link 
                href="/#for-studios"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                Для студий
              </Link>
            </nav>

            {/* User Menu */}
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-slate-950 text-slate-400 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company */}
            <div>
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <span>🚀</span>
                <span>DetiNaRakete</span>
              </h3>
              <p className="text-sm">
                Запускаем детей к их мечтам!
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Платформа</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href={ROUTES.SEARCH} className="hover:text-white">Поиск</Link></li>
                <li><Link href="/#about" className="hover:text-white">О нас</Link></li>
                <li><Link href="/#how-it-works" className="hover:text-white">Как работает</Link></li>
              </ul>
            </div>

            {/* For Studios */}
            <div>
              <h4 className="text-white font-semibold mb-4">Для студий</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/#pricing" className="hover:text-white">Тарифы</Link></li>
                <li><Link href={ROUTES.SIGNUP} className="hover:text-white">Регистрация</Link></li>
                <li><Link href="/#faq" className="hover:text-white">FAQ</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold mb-4">Документы</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/terms" className="hover:text-white">Условия использования</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Политика конфиденциальности</Link></li>
                <li><Link href="/contact" className="hover:text-white">Контакты</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-800 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} DetiNaRakete. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

