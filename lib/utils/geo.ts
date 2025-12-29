/**
 * Утилиты для работы с геоданными
 */

/**
 * Декодирует EWKB (PostGIS binary format) в координаты
 * @param hexString - EWKB hex строка
 * @returns { lat, lng } или null если не удалось распарсить
 */
export function parseEWKB(hexString: string): { lat: number; lng: number } | null {
  try {
    // EWKB format: byte order + type + SRID + coordinates
    // Для POINT: 8 bytes per coordinate (double)
    // Пропускаем заголовок (первые 18 hex символов = 9 байт)
    const coordsStart = 18
    
    // Извлекаем координаты (по 16 hex символов = 8 байт на каждую)
    const lngHex = hexString.substring(coordsStart, coordsStart + 16)
    const latHex = hexString.substring(coordsStart + 16, coordsStart + 32)
    
    // Конвертируем hex в double (little-endian)
    const lngBytes = new Uint8Array(lngHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)))
    const latBytes = new Uint8Array(latHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)))
    
    const lng = new DataView(lngBytes.buffer).getFloat64(0, true)
    const lat = new DataView(latBytes.buffer).getFloat64(0, true)
    
    return { lat, lng }
  } catch (e) {
    console.error('Failed to parse EWKB:', e)
    return null
  }
}

/**
 * Парсит WKT POINT строку
 * @param wkt - WKT строка типа "POINT(30.3351 59.9343)"
 * @returns { lat, lng } или null
 */
export function parseWKT(wkt: string): { lat: number; lng: number } | null {
  try {
    const matches = wkt.match(/POINT\(([\d\.\-]+)\s+([\d\.\-]+)\)/)
    if (matches) {
      return {
        lng: parseFloat(matches[1]),
        lat: parseFloat(matches[2])
      }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Парсит GeoJSON Point
 * @param geojson - GeoJSON объект
 * @returns { lat, lng } или null
 */
export function parseGeoJSON(geojson: any): { lat: number; lng: number } | null {
  try {
    if (geojson?.coordinates && Array.isArray(geojson.coordinates)) {
      return {
        lng: geojson.coordinates[0],
        lat: geojson.coordinates[1]
      }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Универсальный парсер координат из разных форматов
 * @param location - geo_location в любом формате
 * @returns { lat, lng } или дефолтные координаты СПб
 */
export function parseGeoLocation(location: any): { lat: number; lng: number } {
  const defaultCoords = { lat: 59.9343, lng: 30.3351 } // СПб
  
  if (!location) return defaultCoords
  
  if (typeof location === 'string') {
    // WKT формат
    const wkt = parseWKT(location)
    if (wkt) return wkt
    
    // EWKB формат
    if (location.startsWith('0101000020')) {
      const ewkb = parseEWKB(location)
      if (ewkb) return ewkb
    }
  } else if (typeof location === 'object') {
    // GeoJSON формат
    const geojson = parseGeoJSON(location)
    if (geojson) return geojson
  }
  
  return defaultCoords
}

/**
 * Дефолтные координаты городов
 */
export const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'Санкт-Петербург': { lat: 59.9343, lng: 30.3351 },
  'Москва': { lat: 55.7558, lng: 37.6173 },
  'Казань': { lat: 55.7879, lng: 49.1233 },
  'Екатеринбург': { lat: 56.8389, lng: 60.6057 },
  'Новосибирск': { lat: 55.0084, lng: 82.9357 },
}

