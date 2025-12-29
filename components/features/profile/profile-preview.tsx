import { Eye, MapPin, Star, Clock, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ProfilePreviewProps {
  data: any
  className?: string
}

export function ProfilePreview({ data, className }: ProfilePreviewProps) {
  const {
    display_name,
    description,
    city,
    cover_photo,
    category,
    slug,
    id,
    price_range,
    rating
  } = data

  const profileUrl = slug ? `/profiles/${slug}` : id ? `/profiles/${id}` : '#'
  const displayRating = rating || 5.0
  const reviewCount = data.reviews_count || 0

  return (
    <aside className={cn("hidden lg:block sticky top-24 w-[360px]", className)}>
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-bold text-slate-700">Предпросмотр</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-xs hover:bg-white" 
            onClick={() => window.open(profileUrl, '_blank')}
            disabled={!slug && !id}
          >
            Открыть на сайте
          </Button>
        </div>
        
        <div className="relative bg-[#F3F3F5] aspect-[9/19.5] w-full overflow-y-auto scrollbar-hide pb-8">
          <div className="p-3 space-y-3 transform scale-[1] origin-top">
            
            {/* Main Card (Header) */}
            <div className="bg-white rounded-[24px] overflow-hidden shadow-sm pb-4 relative">
              <div className="aspect-video w-full bg-slate-200 relative">
                {cover_photo ? (
                  <img src={cover_photo} className="w-full h-full object-cover" alt="Cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-200">
                    <div className="text-center">
                        <div className="w-12 h-12 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-2xl">📸</span>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">Загрузите обложку</span>
                    </div>
                  </div>
                )}
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                
                {/* Content over Image */}
                <div className="absolute bottom-0 left-0 w-full p-4 text-white">
                   <h2 className="text-xl font-bold leading-tight mb-2 drop-shadow-sm">
                     {display_name || 'Название профиля'}
                   </h2>
                   
                   <div className="flex flex-wrap items-center gap-2">
                      {/* Rating Badge */}
                      <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg">
                         <div className="flex gap-0.5">
                            <Star className="w-3 h-3 fill-[#FCE000] text-[#FCE000]" />
                         </div>
                         <span className="text-xs font-bold">{displayRating.toFixed(1)}</span>
                         <span className="text-[10px] opacity-80">({reviewCount})</span>
                      </div>

                      {/* Duration Badge */}
                      <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg">
                         <Clock className="w-3 h-3" />
                         <span className="text-xs font-medium">30 мин</span>
                      </div>
                   </div>
                </div>
              </div>

              {/* Description Section */}
              <div className="px-4 pt-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold text-slate-900">О нас</h3>
                    {category && (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-primary bg-primary/10 px-2 py-1 rounded-full">
                            {category === 'venue' ? 'Площадка' : category === 'animator' ? 'Аниматор' : category === 'show' ? 'Шоу' : 'Агентство'}
                        </span>
                    )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap line-clamp-4">
                  {description || 'Здесь будет ваше подробное описание. Расскажите клиентам о своих услугах, опыте и преимуществах. Чем подробнее описание, тем больше доверия!'}
                </p>
              </div>
            </div>

            {/* Services Section Mockup */}
            <div>
                <h3 className="text-sm font-bold text-slate-900 mb-2 px-1">Популярные услуги</h3>
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white p-2 rounded-2xl shadow-sm">
                        <div className="h-20 bg-slate-100 rounded-xl mb-2 relative overflow-hidden">
                            <div className="absolute bottom-1 left-1 bg-white/90 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                {price_range === '$$$' ? '15 000 ₽' : price_range === '$$' ? '8 000 ₽' : '3 500 ₽'}
                            </div>
                        </div>
                        <div className="h-3 w-full bg-slate-100 rounded mb-1"></div>
                        <div className="h-3 w-2/3 bg-slate-100 rounded"></div>
                    </div>
                    <div className="bg-white p-2 rounded-2xl shadow-sm">
                        <div className="h-20 bg-slate-100 rounded-xl mb-2 relative overflow-hidden">
                             <div className="absolute bottom-1 left-1 bg-white/90 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                {price_range === '$$$' ? '25 000 ₽' : price_range === '$$' ? '12 000 ₽' : '5 000 ₽'}
                            </div>
                        </div>
                        <div className="h-3 w-full bg-slate-100 rounded mb-1"></div>
                        <div className="h-3 w-1/2 bg-slate-100 rounded"></div>
                    </div>
                </div>
            </div>

            {/* Reviews Mockup */}
            <div className="bg-white rounded-[24px] p-4 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Отзывы</h3>
                <div className="space-y-3">
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 shrink-0"></div>
                        <div>
                            <div className="h-3 w-20 bg-slate-100 rounded mb-1"></div>
                            <div className="h-2 w-full bg-slate-50 rounded mb-1"></div>
                            <div className="h-2 w-3/4 bg-slate-50 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Map Section Mockup */}
            <div className="bg-white rounded-[24px] p-4 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-[#FCE000]" /> 
                    Как нас найти
                </h3>
                {city ? (
                    <div className="text-xs text-slate-600">
                        <p className="font-medium mb-2">{city}, {data.address || 'Адрес не указан'}</p>
                        <div className="h-24 w-full bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 text-[10px]">
                            Карта
                        </div>
                    </div>
                ) : (
                    <div className="text-xs text-slate-400">Адрес пока не добавлен</div>
                )}
            </div>

          </div>

          {/* Phone Frame Overlay (Optional, maybe too distracting) */}
          {/* <div className="absolute inset-0 pointer-events-none border-[12px] border-black/5 rounded-[0px]"></div> */}
        </div>
        
        <div className="p-3 bg-slate-50 text-center border-t border-slate-100">
           <p className="text-[10px] text-slate-400">
             Предпросмотр обновляется автоматически
           </p>
        </div>
      </div>
    </aside>
  )
}
