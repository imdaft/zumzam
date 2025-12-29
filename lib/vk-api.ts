/**
 * VK API утилиты для работы с Market
 */

export interface VKMarketItem {
  id: number
  owner_id: number
  title: string
  description: string
  price: {
    amount: string // В копейках
    currency: {
      id: number
      name: string
    }
    text: string
  }
  category?: {
    id: number
    name: string
  }
  thumb_photo?: string
  photos?: Array<{
    id: number
    sizes: Array<{
      type: string // s, m, x, y, z
      url: string
      width: number
      height: number
    }>
  }>
  date: number
  availability: number // 0 = доступно, 1 = удалено, 2 = недоступно
}

export interface VKMarketResponse {
  count: number
  items: VKMarketItem[]
}

export interface VKGroupInfo {
  id: number
  name: string
  screen_name: string
  city?: {
    id: number
    title: string
  }
  description?: string
}

/**
 * Получить товары из VK Market группы
 */
export async function getVKMarketItems(
  groupId: string,
  accessToken: string,
  count: number = 100
): Promise<VKMarketResponse> {
  const ownerId = `-${groupId}`
  
  // Если токен = 'admin_import', используем service token из env
  const token = accessToken === 'admin_import' 
    ? process.env.VK_SERVICE_TOKEN || '' 
    : accessToken
  
  const params = new URLSearchParams({
    owner_id: ownerId,
    count: count.toString(),
    extended: '1',
    access_token: token,
    v: '5.131'
  })
  
  const response = await fetch(
    `https://api.vk.com/method/market.get?${params.toString()}`
  )
  
  const data = await response.json()
  
  if (data.error) {
    throw new Error(data.error.error_msg || 'VK API Error')
  }
  
  return data.response
}

/**
 * Получить информацию о группе
 */
export async function getVKGroupInfo(
  groupId: string,
  accessToken: string
): Promise<VKGroupInfo> {
  // Если токен = 'admin_import', используем service token из env
  const token = accessToken === 'admin_import' 
    ? process.env.VK_SERVICE_TOKEN || '' 
    : accessToken
  
  const params = new URLSearchParams({
    group_id: groupId,
    fields: 'name,screen_name,city,description',
    access_token: token,
    v: '5.131'
  })
  
  const response = await fetch(
    `https://api.vk.com/method/groups.getById?${params.toString()}`
  )
  
  const data = await response.json()
  
  if (data.error) {
    throw new Error(data.error.error_msg || 'VK API Error')
  }
  
  return data.response[0]
}

/**
 * Проверить, является ли пользователь администратором группы
 */
export async function checkUserIsGroupAdmin(
  userAccessToken: string,
  groupId: string
): Promise<boolean> {
  try {
    // Проверяем роль пользователя в группе
    const params = new URLSearchParams({
      group_id: groupId,
      access_token: userAccessToken,
      v: '5.131'
    })
    
    const response = await fetch(
      `https://api.vk.com/method/groups.isMember?${params.toString()}`
    )
    
    const data = await response.json()
    
    if (data.error) {
      // Если ошибка доступа - значит не админ
      return false
    }
    
    // Проверяем роль
    // administrator, moderator, editor, creator - подходят
    // member или пустое - не подходят
    const role = data.response?.role
    
    return role === 'administrator' || 
           role === 'creator' || 
           role === 'moderator' ||
           role === 'editor'
  } catch (error) {
    console.error('[VK API] Error checking admin status:', error)
    return false
  }
}

/**
 * Извлечь ID группы из URL VK
 */
export function extractGroupIdFromUrl(url: string): string | null {
  try {
    // https://vk.com/market-53593965
    // https://vk.com/club53593965
    // https://vk.com/public53593965
    // https://vk.com/marketalbum-53593965_0
    
    // Вариант 1: market-ID
    let match = url.match(/market-(\d+)/)
    if (match) return match[1]
    
    // Вариант 2: club/public
    match = url.match(/(?:club|public)(\d+)/)
    if (match) return match[1]
    
    // Вариант 3: просто число после минуса
    match = url.match(/-(\d+)/)
    if (match) return match[1]
    
    // Вариант 4: screen_name (например, /zumzam_msk)
    // Для этого нужно сделать запрос к API
    const screenMatch = url.match(/vk\.com\/([a-zA-Z0-9_]+)/)
    if (screenMatch && !screenMatch[1].includes('-')) {
      return screenMatch[1] // Вернём screen_name, нужно будет резолвить в API
    }
    
    return null
  } catch {
    return null
  }
}

/**
 * Конвертировать VK товар в формат услуги нашей платформы
 */
export function convertVKItemToService(item: VKMarketItem, groupInfo: VKGroupInfo) {
  // Выбираем лучшее качество фото
  const getBestPhoto = (photos?: VKMarketItem['photos']) => {
    if (!photos || photos.length === 0) return null
    
    const sizes = photos[0].sizes
    // Приоритет: z > y > x > m > s
    const best = sizes.find(s => s.type === 'z') ||
                sizes.find(s => s.type === 'y') ||
                sizes.find(s => s.type === 'x') ||
                sizes.find(s => s.type === 'm') ||
                sizes[0]
    
    return best.url
  }
  
  // Собираем все фото (не только первое)
  const getAllPhotos = (photos?: VKMarketItem['photos']) => {
    if (!photos || photos.length === 0) return []
    
    return photos.map(photo => {
      const sizes = photo.sizes
      const best = sizes.find(s => s.type === 'z') ||
                  sizes.find(s => s.type === 'y') ||
                  sizes.find(s => s.type === 'x') ||
                  sizes[0]
      return best.url
    })
  }
  
  // Цена в рублях (из копеек)
  const priceInRubles = parseInt(item.price.amount) / 100
  
  return {
    name: item.title,
    description: item.description || '',
    price: priceInRubles.toString(),
    photos: getAllPhotos(item.photos),
    category: item.category?.name,
    vk_source: {
      vk_item_id: item.id,
      vk_owner_id: item.owner_id,
      vk_group_id: Math.abs(item.owner_id).toString(),
      vk_group_name: groupInfo.name,
      vk_group_screen_name: groupInfo.screen_name,
      vk_category: item.category?.name,
      imported_at: new Date().toISOString(),
      verified: true, // Прошёл OAuth верификацию
    },
    availability: item.availability === 0 ? 'available' : 'unavailable',
    created_at: new Date(item.date * 1000).toISOString(),
  }
}

/**
 * Получить ID группы по screen_name
 */
export async function resolveGroupScreenName(
  screenName: string,
  accessToken: string
): Promise<string | null> {
  try {
    // Если токен = 'admin_import', используем service token из env
    const token = accessToken === 'admin_import' 
      ? process.env.VK_SERVICE_TOKEN || '' 
      : accessToken
    
    const params = new URLSearchParams({
      group_id: screenName,
      access_token: token,
      v: '5.131'
    })
    
    const response = await fetch(
      `https://api.vk.com/method/groups.getById?${params.toString()}`
    )
    
    const data = await response.json()
    
    if (data.error || !data.response?.[0]?.id) {
      return null
    }
    
    return data.response[0].id.toString()
  } catch {
    return null
  }
}
















