'use client'

import { ExternalLink } from 'lucide-react'

interface VKSourceBadgeProps {
  metadata?: {
    source?: string
    vk_group_id?: string
    vk_group_name?: string
    vk_group_screen_name?: string
    verified?: boolean
    imported_at?: string
  }
}

export function VKSourceBadge({ metadata }: VKSourceBadgeProps) {
  if (!metadata || metadata.source !== 'vk_market') {
    return null
  }
  
  const vkUrl = metadata.vk_group_screen_name
    ? `https://vk.com/${metadata.vk_group_screen_name}`
    : `https://vk.com/public${metadata.vk_group_id}`
  
  const importDate = metadata.imported_at 
    ? new Date(metadata.imported_at).toLocaleDateString('ru-RU')
    : null
  
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs">
      <span className="text-blue-700">📱 Из ВКонтакте:</span>
      <a
        href={vkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 hover:underline font-medium inline-flex items-center gap-1"
      >
        {metadata.vk_group_name || 'Группа VK'}
        <ExternalLink className="w-3 h-3" />
      </a>
      
      {metadata.verified && (
        <span className="text-green-600 font-medium" title="Владелец группы подтверждён">
          ✓ Проверено
        </span>
      )}
      
      {importDate && (
        <span className="text-gray-500">
          • {importDate}
        </span>
      )}
    </div>
  )
}
















