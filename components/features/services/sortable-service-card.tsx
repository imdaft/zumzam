'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MoreVertical, Pencil, Copy, Trash, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface SortableServiceCardProps {
  service: any
  onEdit: (service: any) => void
  onDuplicate: (service: any) => void
  onDelete: (id: string) => void
  variant?: 'default' | 'package'
}

export function SortableServiceCard({ 
  service, 
  onEdit, 
  onDuplicate, 
  onDelete,
  variant = 'default'
}: SortableServiceCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: service.id,
    transition: {
      duration: 200,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const isPackage = variant === 'package'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${
        isPackage 
          ? 'bg-white rounded-[24px] border-2 border-orange-200 hover:border-orange-300'
          : 'bg-white rounded-[24px] border border-slate-200 hover:border-orange-200'
      } overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.25)] transition-all group relative ${
        isDragging ? 'z-50 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.35)] scale-[1.02]' : ''
      }`}
    >
      {/* Drag Handle */}
      <div 
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.25)] transition-all">
          <GripVertical className={`w-4 h-4 ${isPackage ? 'text-orange-600' : 'text-slate-400'}`} />
        </div>
      </div>

      <div className="aspect-[3/2] bg-slate-100 relative">
        {service.images && service.images[0] ? (
          <img src={service.images[0]} alt={service.name || service.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            Нет фото
          </div>
        )}
        
        {/* Menu Button */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-white/90 hover:bg-white">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-[18px]">
              <DropdownMenuItem onClick={() => onEdit(service)}>
                <Pencil className="mr-2 h-4 w-4" />
                Редактировать
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(service)}>
                <Copy className="mr-2 h-4 w-4" />
                Дублировать
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => onDelete(service.id)}>
                <Trash className="mr-2 h-4 w-4" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="p-4">
        <h4 className="font-semibold text-gray-900 mb-1.5 line-clamp-2 text-sm">{service.name || service.title}</h4>
        <p className="text-xs text-gray-500 mb-3 line-clamp-3">{service.description}</p>
        {service.details?.package_includes && service.details.package_includes.length > 0 && (
          <div className="text-xs text-orange-700 mb-2">
            ✓ Включено {service.details.package_includes.length} позиций
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="font-bold text-orange-600 text-sm">
            {service.price_type === 'negotiable' 
              ? 'Договорная'
              : service.price > 0 
                ? `${service.price_type === 'from' ? 'от ' : ''}${service.price} ₽${service.price_type === 'hourly' ? '/час' : service.price_type === 'per_person' ? '/чел' : ''}`
                : 'По запросу'
            }
          </span>
          {service.duration && (
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
              {service.duration} мин
            </span>
          )}
        </div>
      </div>
    </div>
  )
}


