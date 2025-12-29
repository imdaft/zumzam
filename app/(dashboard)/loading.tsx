import { Loader2 } from 'lucide-react'

export default function DashboardLoading() {
  return (
    <div className="space-y-4">
      {/* Profile card skeleton */}
      <div className="bg-white rounded-xl md:rounded-[24px] p-4 md:p-5 animate-pulse">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gray-200" />
          <div className="flex-1">
            <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-48 bg-gray-100 rounded" />
          </div>
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg md:rounded-[16px] p-3 md:p-4 animate-pulse">
            <div className="h-6 w-12 bg-gray-200 rounded mx-auto mb-2" />
            <div className="h-3 w-16 bg-gray-100 rounded mx-auto" />
          </div>
        ))}
      </div>

      {/* Menu grid skeleton */}
      <div className="grid grid-cols-4 gap-2 md:gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg md:rounded-[16px] p-2.5 md:p-4 animate-pulse">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 rounded-lg mx-auto mb-2" />
            <div className="h-3 w-12 bg-gray-100 rounded mx-auto" />
          </div>
        ))}
      </div>

      {/* Центральный индикатор */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      </div>
    </div>
  )
}
