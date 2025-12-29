import { Loader2 } from 'lucide-react'

export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="mx-auto max-w-[1340px] px-4 sm:px-6 md:px-8 pt-6">
        {/* Promo Carousel Skeleton */}
        <div className="h-[180px] sm:h-[220px] bg-gray-100 rounded-[24px] animate-pulse mb-6" />

        {/* Category Nav Skeleton */}
        <div className="flex gap-2 overflow-hidden mb-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 w-24 bg-gray-100 rounded-full animate-pulse shrink-0" />
          ))}
        </div>

        {/* Profiles Grid Skeleton */}
        <div className="space-y-8">
          {[...Array(2)].map((_, sectionIdx) => (
            <div key={sectionIdx}>
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="aspect-[2/1] bg-gray-100 rounded-xl animate-pulse" />
                    <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-gray-50 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Центральный индикатор */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 pointer-events-none z-50">
        <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
          <span className="text-sm text-gray-600">Загрузка...</span>
        </div>
      </div>
    </div>
  )
}
