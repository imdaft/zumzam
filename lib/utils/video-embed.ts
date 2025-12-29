/**
 * Утилита для работы с видео с разных платформ
 * Поддерживает: YouTube, VK, RuTube, Яндекс.Видео, Kinescope
 */

export type VideoProvider = 'youtube' | 'vk' | 'rutube' | 'yandex' | 'kinescope' | 'unknown'

export interface VideoInfo {
  provider: VideoProvider
  videoId: string
  embedUrl: string
  thumbnailUrl?: string
}

/**
 * Определяет платформу видео по URL
 */
export function detectVideoProvider(url: string): VideoProvider {
  const lowerUrl = url.toLowerCase()
  
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    return 'youtube'
  }
  if (lowerUrl.includes('vk.com') || lowerUrl.includes('vkvideo.ru')) {
    return 'vk'
  }
  if (lowerUrl.includes('rutube.ru')) {
    return 'rutube'
  }
  if (lowerUrl.includes('yandex.ru/video') || lowerUrl.includes('ya.ru')) {
    return 'yandex'
  }
  if (lowerUrl.includes('kinescope.io')) {
    return 'kinescope'
  }
  
  return 'unknown'
}

/**
 * Извлекает ID видео из YouTube URL
 */
function extractYouTubeId(url: string): string | null {
  // youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/[?&]v=([^&]+)/)
  if (watchMatch) return watchMatch[1]
  
  // youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([^?]+)/)
  if (shortMatch) return shortMatch[1]
  
  // youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(/youtube\.com\/embed\/([^?]+)/)
  if (embedMatch) return embedMatch[1]
  
  return null
}

/**
 * Извлекает ID видео из VK URL
 */
function extractVKId(url: string): string | null {
  // vk.com/video-123456_789
  // vkvideo.ru/video-123456_789
  const match = url.match(/video(-?\d+_\d+)/)
  if (match) return match[1]
  
  return null
}

/**
 * Извлекает ID видео из RuTube URL
 */
function extractRuTubeId(url: string): string | null {
  // rutube.ru/video/VIDEO_ID/
  // rutube.ru/video/private/VIDEO_ID/
  const match = url.match(/rutube\.ru\/video\/(?:private\/)?([a-zA-Z0-9]+)/)
  if (match) return match[1]
  
  return null
}

/**
 * Извлекает ID видео из Яндекс.Видео URL
 */
function extractYandexId(url: string): string | null {
  // ya.ru/video/preview/VIDEO_ID
  // yandex.ru/video/preview/VIDEO_ID
  const match = url.match(/video\/preview\/(\d+)/)
  if (match) return match[1]
  
  return null
}

/**
 * Извлекает ID видео из Kinescope URL
 */
function extractKinescopeId(url: string): string | null {
  // kinescope.io/VIDEO_ID
  // kinescope.io/embed/VIDEO_ID
  const match = url.match(/kinescope\.io\/(?:embed\/)?([a-zA-Z0-9]+)/)
  if (match) return match[1]
  
  return null
}

/**
 * Получает информацию о видео по URL
 */
export function getVideoInfo(url: string): VideoInfo | null {
  const provider = detectVideoProvider(url)
  let videoId: string | null = null
  let embedUrl = ''
  let thumbnailUrl: string | undefined
  
  switch (provider) {
    case 'youtube':
      videoId = extractYouTubeId(url)
      if (videoId) {
        embedUrl = `https://www.youtube.com/embed/${videoId}`
        thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
      }
      break
      
    case 'vk':
      videoId = extractVKId(url)
      if (videoId) {
        const [oid, id] = videoId.split('_')
        embedUrl = `https://vk.com/video_ext.php?oid=${oid}&id=${id}`
      }
      break
      
    case 'rutube':
      videoId = extractRuTubeId(url)
      if (videoId) {
        embedUrl = `https://rutube.ru/play/embed/${videoId}`
      }
      break
      
    case 'yandex':
      videoId = extractYandexId(url)
      if (videoId) {
        embedUrl = `https://yandex.ru/video/preview/${videoId}`
      }
      break
      
    case 'kinescope':
      videoId = extractKinescopeId(url)
      if (videoId) {
        embedUrl = `https://kinescope.io/embed/${videoId}`
      }
      break
      
    default:
      return null
  }
  
  if (!videoId) return null
  
  return {
    provider,
    videoId,
    embedUrl,
    thumbnailUrl
  }
}

/**
 * Получает embed URL для видео
 */
export function getVideoEmbedUrl(url: string): string | null {
  const info = getVideoInfo(url)
  return info?.embedUrl || null
}

/**
 * Получает URL превью для видео (если доступно)
 */
export function getVideoThumbnail(url: string): string | null {
  const info = getVideoInfo(url)
  return info?.thumbnailUrl || null
}

/**
 * Проверяет, является ли URL видео
 */
export function isVideoUrl(url: string): boolean {
  return detectVideoProvider(url) !== 'unknown'
}


