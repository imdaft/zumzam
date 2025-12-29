/**
 * Типы для системы кропа обложки
 */

export interface CropData {
  x: number
  y: number
  zoom: number
  aspect: number // соотношение сторон (ширина / высота)
}

export interface CoverPhotoCrop {
  classic?: CropData
  modern?: CropData
  minimal?: CropData
}

export interface CoverPhotoAIExpanded {
  top?: string // URL расширенного изображения сверху
  bottom?: string
  left?: string
  right?: string
  all?: string // расширение со всех сторон
}

export interface CropEditorProps {
  imageUrl: string
  templateId: 'classic' | 'modern' | 'minimal'
  initialCrop?: CropData
  onSave: (crop: CropData) => Promise<void>
  onCancel: () => void
  onExpandImage?: (direction: 'top' | 'bottom' | 'left' | 'right' | 'all') => Promise<string>
}















