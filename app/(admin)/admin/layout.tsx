import Link from 'next/link'
import { 
  LayoutDashboard, 
  Users, 
  Star, 
  Calendar, 
  Settings,
  Shield,
  FileText,
  BarChart3,
} from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const navigation = [
    { name: 'Обзор', href: '/admin', icon: LayoutDashboard },
    { name: 'Профили', href: '/admin/profiles', icon: Users },
    { name: 'Отзывы', href: '/admin/reviews', icon: Star },
    { name: 'Бронирования', href: '/admin/bookings', icon: Calendar },
    { name: 'Услуги', href: '/admin/services', icon: FileText },
    { name: 'Аналитика', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Настройки', href: '/admin/settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white dark:bg-slate-800 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-red-600" />
              <Link href="/admin" className="text-xl font-bold">
                Admin Panel
              </Link>
            </div>
            
            <Link 
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Вернуться на сайт
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
          {/* Sidebar */}
          <aside className="space-y-2">
            <nav className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main>{children}</main>
        </div>
      </div>
    </div>
  )
}


