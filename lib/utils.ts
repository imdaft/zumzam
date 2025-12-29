import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format as dateFnsFormat } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Безопасное форматирование даты с проверкой валидности
 * @param dateValue - значение даты (Date, string, number)
 * @param formatStr - строка формата для date-fns
 * @param options - опции для date-fns (например, locale)
 * @param fallback - значение по умолчанию при ошибке (по умолчанию '--')
 * @returns отформатированная дата или fallback
 */
export function safeFormatDate(
  dateValue: any, 
  formatStr: string, 
  options?: any,
  fallback: string = '--'
): string {
  try {
    if (!dateValue) return fallback
    const date = new Date(dateValue)
    if (isNaN(date.getTime())) return fallback
    return dateFnsFormat(date, formatStr, options)
  } catch {
    return fallback
  }
}

/**
 * Вычисляет расстояние между двумя точками (в км) по формуле Haversine
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Радиус Земли в км
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Number((R * c).toFixed(1))
}

function toRad(value: number): number {
  return (value * Math.PI) / 180
}
