import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/parse-yandex-maps
 * Парсит данные организации с Яндекс.Карт по ссылке
 */
export async function POST(request: Request) {
  try {
    const { url } = await request.json()
    
    console.log('[ParseYandexMaps] ======= START =======')
    console.log('[ParseYandexMaps] Received URL:', url)

    if (!url || typeof url !== 'string') {
      console.error('[ParseYandexMaps] Invalid URL provided')
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Извлекаем OID (organization ID) из URL
    // Примеры URL:
    // https://yandex.ru/maps/org/kids_point/140508158689/?ll=30.216541%2C59.995791&z=16
    // https://yandex.ru/maps/-/CCUAqXBD4D
    // https://yandex.ru/maps/2/saint-petersburg/search/kids%20point/?ll=30.216541%2C59.995791&oid=123456789
    // https://yandex.ru/maps/?oid=123456789
    // https://yandex.ru/maps/org/название_компании/1234567890/
    
    let oid: string | null = null
    
    console.log('[ParseYandexMaps] Extracting OID from URL...')
    
    // Пытаемся найти oid в параметрах URL
    const urlObj = new URL(url)
    oid = urlObj.searchParams.get('oid')
    console.log('[ParseYandexMaps] OID from query params:', oid)
    
    // Если не нашли в параметрах, пытаемся найти в пути /org/.../OID/
    if (!oid) {
      // Вариант 1: /org/название/123456789/
      const orgMatch1 = url.match(/\/org\/[^\/]+\/(\d+)/)
      if (orgMatch1) {
        oid = orgMatch1[1]
        console.log('[ParseYandexMaps] OID from /org/ path (variant 1):', oid)
      }
      
      // Вариант 2: /org/123456789/
      if (!oid) {
        const orgMatch2 = url.match(/\/org\/(\d+)/)
        if (orgMatch2) {
          oid = orgMatch2[1]
          console.log('[ParseYandexMaps] OID from /org/ path (variant 2):', oid)
        }
      }
      
      // Вариант 3: просто число в пути
      if (!oid) {
        const numMatch = url.match(/\/(\d{9,})/)
        if (numMatch) {
          oid = numMatch[1]
          console.log('[ParseYandexMaps] OID from numeric path:', oid)
        }
      }
    }

    // Если это короткая ссылка (типа https://yandex.ru/maps/-/CCUAqXBD4D)
    // нужно сначала её развернуть
    if (!oid && url.includes('yandex.ru/maps/-/')) {
      console.log('[ParseYandexMaps] Short link detected, expanding...')
      
      try {
        // Делаем запрос, чтобы получить редирект
        const response = await fetch(url, {
          method: 'GET',
          redirect: 'follow',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        })
        
        const finalUrl = response.url
        console.log('[ParseYandexMaps] Expanded URL:', finalUrl)
        
        // Пытаемся извлечь OID из развёрнутого URL
        const expandedUrlObj = new URL(finalUrl)
        oid = expandedUrlObj.searchParams.get('oid')
        
        if (!oid) {
          const orgMatch = finalUrl.match(/\/org\/[^\/]+\/(\d+)/)
          if (orgMatch) {
            oid = orgMatch[1]
          }
        }
      } catch (error) {
        console.error('[ParseYandexMaps] Error expanding short link:', error)
      }
    }

    if (!oid) {
      return NextResponse.json(
        { 
          error: 'Could not extract organization ID from URL',
          hint: 'Убедитесь, что ссылка содержит ID организации (например, /org/название/123456789/ или ?oid=123456789)'
        },
        { status: 400 }
      )
    }

    console.log('[ParseYandexMaps] Organization ID:', oid)

    // Проверяем наличие API ключа для Search API
    const searchApiKey = process.env.YANDEX_SEARCH_API_KEY
    
    if (!searchApiKey) {
      console.error('[ParseYandexMaps] YANDEX_SEARCH_API_KEY not configured')
      return NextResponse.json(
        { 
          error: 'Search API key not configured',
          hint: 'Добавьте YANDEX_SEARCH_API_KEY в .env.local'
        },
        { status: 500 }
      )
    }
    
    console.log('[ParseYandexMaps] Using Search API key:', searchApiKey.substring(0, 10) + '...')

    // Yandex Search API требует текстовый поиск, а не прямой запрос по OID
    // Поэтому мы делаем запрос по координатам организации
    // Сначала нужно получить координаты из URL или использовать текстовый поиск
    
    // Вариант: используем текстовый поиск с указанием OID в фильтре
    const apiUrl = `https://search-maps.yandex.ru/v1/?apikey=${searchApiKey}&text=oid:${oid}&lang=ru_RU&type=biz&results=1`
    
    console.log('[ParseYandexMaps] Requesting URL:', apiUrl.replace(searchApiKey, 'API_KEY_HIDDEN'))
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[ParseYandexMaps] Yandex API error:')
      console.error('  Status:', response.status, response.statusText)
      console.error('  Response:', errorText.substring(0, 500))
      return NextResponse.json(
        { 
          error: 'Failed to fetch data from Yandex Maps API',
          details: `Status ${response.status}: ${response.statusText}`,
          hint: errorText.substring(0, 200)
        },
        { status: 500 }
      )
    }

    const data = await response.json()
    console.log('[ParseYandexMaps] Received data from Yandex')

    // Извлекаем нужные данные
    const feature = data?.features?.[0]
    if (!feature) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    const properties = feature.properties
    const companyMetaData = properties?.CompanyMetaData || {}
    
    // Извлекаем рейтинг и количество отзывов
    const rating = companyMetaData.rating || null
    const reviewCount = companyMetaData.reviewCount || 0
    const name = companyMetaData.name || ''
    const address = companyMetaData.address || ''
    const categories = companyMetaData.Categories || []
    const phones = companyMetaData.Phones || []
    const hours = companyMetaData.Hours || {}
    const website = companyMetaData.url || null

    const result = {
      name,
      address,
      rating: rating ? parseFloat(rating) : null,
      reviewCount: parseInt(reviewCount) || 0,
      categories: categories.map((c: any) => c.name),
      phone: phones[0]?.formatted || null,
      workingHours: hours.text || null,
      website,
      yandexUrl: url,
      oid,
    }

    console.log('[ParseYandexMaps] Parsed result:', result)

    return NextResponse.json({ success: true, data: result })

  } catch (error: any) {
    console.error('[ParseYandexMaps] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

