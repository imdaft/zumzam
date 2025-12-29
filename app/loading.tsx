/**
 * Глобальный loading state для Next.js App Router
 * Показывается при переходах между страницами
 */
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-4">
        {/* Анимированный логотип/спиннер */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-200 rounded-full animate-pulse" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary rounded-full animate-spin" />
        </div>
        
        {/* Текст */}
        <p className="text-slate-500 text-sm animate-pulse">
          Загрузка...
        </p>
      </div>
    </div>
  )
}

