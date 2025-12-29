import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import path from 'path'

// Добавляем stealth плагин для обхода детекции headless браузера
puppeteer.use(StealthPlugin())

interface DgisReview {
  id: string
  author: {
    name: string
    avatar?: string
  }
  rating: number
  text: string
  date: string
  photos?: string[]
  businessComment?: {
    text: string
    date: string
  }
}

/**
 * Парсит отзывы с 2GIS через Puppeteer (headless браузер)
 */
export async function parse2GisReviewsWithPuppeteer(
  dgisUrl: string
): Promise<{ reviews: DgisReview[]; rating: number | null; reviewCount: number }> {
  console.log('[2GIS Puppeteer] Starting browser with persistent session...')
  
  // Путь для сохранения профиля браузера (cookies, история и т.д.)
  const userDataDir = path.join(process.cwd(), 'chrome-user-data-2gis')
  console.log('[2GIS Puppeteer] User data directory:', userDataDir)
  
  const browser = await puppeteer.launch({
    headless: false, // ← ВИДИМЫЙ браузер (для надёжности)
    userDataDir, // Используем постоянный профиль!
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--start-maximized',
      '--disable-blink-features=AutomationControlled',
    ],
    defaultViewport: null,
  })

  try {
    const page = await browser.newPage()

    // User-Agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

    // Viewport
    await page.setViewport({ width: 1920, height: 1080 })

    // Заголовки
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Referer': 'https://2gis.ru/',
    })

    // Эмулируем реальный браузер
    await page.evaluateOnNewDocument(() => {
      // Переопределяем navigator.webdriver
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      })
      
      // Добавляем plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      })
      
      // Добавляем языки
      Object.defineProperty(navigator, 'languages', {
        get: () => ['ru-RU', 'ru', 'en-US', 'en'],
      })
      
      // Chrome property
      (window as any).chrome = {
        runtime: {},
      }
      
      // Permissions
      const originalQuery = window.navigator.permissions.query
      window.navigator.permissions.query = (parameters: any) =>
        parameters.name === 'notifications'
          ? Promise.resolve({ state: Notification.permission } as PermissionStatus)
          : originalQuery(parameters)
    })

    console.log('[2GIS Puppeteer] Navigating to:', dgisUrl)

    // Переходим на страницу
    await page.goto(dgisUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    console.log('[2GIS Puppeteer] Page loaded, waiting for content...')
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Кликаем по вкладке "Отзывы" (если есть)
    console.log('[2GIS Puppeteer] Looking for "Reviews" tab...')
    const tabClicked = await page.evaluate(() => {
      // Ищем вкладку с отзывами
      const tabs = Array.from(document.querySelectorAll('a, button, div[role="tab"]'))
      const reviewTab = tabs.find(tab => 
        tab.textContent && (
          tab.textContent.includes('Отзыв') || 
          tab.textContent.includes('отзыв') ||
          tab.textContent.includes('Комментари')
        )
      )
      
      if (reviewTab && reviewTab instanceof HTMLElement) {
        console.log('[2GIS Client] Found tab:', reviewTab.textContent?.trim())
        reviewTab.click()
        return true
      }
      return false
    })

    if (tabClicked) {
      console.log('[2GIS Puppeteer] ✅ Reviews tab clicked! Waiting for reviews to load...')
      await new Promise(resolve => setTimeout(resolve, 3000))
    } else {
      console.log('[2GIS Puppeteer] ⚠️ Reviews tab not found, will try to parse current content')
    }

    // Прокручиваем контейнер для подгрузки всех отзывов
    console.log('[2GIS Puppeteer] Scrolling to load all reviews...')
    let prevCount = 0
    let stableCount = 0
    
    for (let i = 0; i < 40; i++) {
      await page.evaluate(() => {
        // 2GIS часто использует body для скролла
        window.scrollTo(0, document.body.scrollHeight)
        
        // Также пробуем найти контейнер с классом scroll
        const scrollContainer = document.querySelector('[class*="scroll"]')
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight
        }
      })
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Проверяем количество отзывов каждые 5 итераций
      if (i % 5 === 4) {
        const currentCount = await page.evaluate(() => {
          // Различные варианты селекторов для 2GIS
          const reviews = document.querySelectorAll(
            '[data-testid="review-item"], ' +
            '[class*="review"], ' +
            '[class*="comment"]'
          )
          return reviews.length
        })
        
        console.log(`[2GIS Puppeteer] Scroll ${i + 1}/40 - reviews: ${currentCount}`)
        
        if (currentCount === prevCount) {
          stableCount++
          if (stableCount >= 4) {
            console.log('[2GIS Puppeteer] No more reviews loading, stopping scroll')
            break
          }
        } else {
          stableCount = 0
          prevCount = currentCount
        }
      }
    }

    console.log('[2GIS Puppeteer] Waiting for final content load...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    console.log('[2GIS Puppeteer] Extracting reviews...')

    // Извлекаем отзывы из страницы
    const data = await page.evaluate(() => {
      const reviews: any[] = []
      
      // 2GIS использует разные классы в зависимости от версии интерфейса
      // Пробуем несколько вариантов
      const reviewElements = document.querySelectorAll(
        '[data-testid="review-item"], ' +
        '[class*="_reviewItem"], ' +
        '[class*="review-item"], ' +
        'article[itemtype*="Review"]'
      )
      
      console.log('[2GIS Client] Found review elements:', reviewElements.length)
      
      reviewElements.forEach((element, index) => {
        try {
          // Имя автора
          const authorElement = element.querySelector(
            '[itemprop="author"], ' +
            '[class*="author"], ' +
            '[class*="userName"], ' +
            '[data-testid="review-author"]'
          )
          const authorName = authorElement?.textContent?.trim() || 'Аноним'

          // Аватар
          const avatarElement = element.querySelector('img[class*="avatar"], img[alt*="Аватар"]')
          const avatar = avatarElement?.getAttribute('src') || undefined

          // Рейтинг (2GIS использует звёзды)
          const ratingElement = element.querySelector(
            '[itemprop="ratingValue"], ' +
            '[class*="rating"], ' +
            '[class*="stars"]'
          )
          const ratingText = ratingElement?.textContent?.trim() || 
                            ratingElement?.getAttribute('content') || '5'
          const rating = parseFloat(ratingText.replace(',', '.')) || 5

          // Текст отзыва
          const textElement = element.querySelector(
            '[itemprop="reviewBody"], ' +
            '[itemprop="description"], ' +
            '[class*="text"], ' +
            '[class*="comment"], ' +
            '[data-testid="review-text"]'
          )
          const text = textElement?.textContent?.trim() || ''

          // Дата
          const dateElement = element.querySelector(
            '[itemprop="datePublished"], ' +
            'time, ' +
            '[class*="date"]'
          )
          const dateText = dateElement?.getAttribute('datetime') || 
                          dateElement?.textContent?.trim() || 
                          new Date().toISOString()

          // Ответ организации
          const replyElement = element.querySelector(
            '[class*="reply"], ' +
            '[class*="answer"], ' +
            '[class*="comment"][class*="business"]'
          )
          let businessComment = undefined
          
          if (replyElement) {
            const replyTextEl = replyElement.querySelector('[class*="text"]') || replyElement
            const replyText = replyTextEl?.textContent?.trim()
            const replyDateEl = replyElement.querySelector('[class*="date"], time')
            const replyDate = replyDateEl?.getAttribute('datetime') ||
                             replyDateEl?.textContent?.trim()
            
            if (replyText && replyText.length > 10) {
              businessComment = {
                text: replyText,
                date: replyDate || dateText,
              }
            }
          }

          // Фотографии (если есть)
          const photoElements = element.querySelectorAll('img[class*="photo"]')
          const photos = Array.from(photoElements)
            .map(img => img.getAttribute('src'))
            .filter(Boolean) as string[]

          // Добавляем только если есть текст отзыва
          if (text && text.length > 3) {
            reviews.push({
              id: `2gis_review_${Date.now()}_${index}`,
              author: {
                name: authorName,
                avatar,
              },
              rating,
              text,
              date: dateText,
              photos: photos.length > 0 ? photos : undefined,
              businessComment,
            })
          }
        } catch (err) {
          console.error('[2GIS Client] Error parsing review:', err)
        }
      })

      // Общий рейтинг
      const ratingBadge = document.querySelector(
        '[itemprop="aggregateRating"] [itemprop="ratingValue"], ' +
        '[class*="rating"][class*="total"], ' +
        '[class*="averageRating"]'
      )
      const overallRating = ratingBadge?.textContent?.trim() || 
                           ratingBadge?.getAttribute('content')
      const rating = overallRating ? parseFloat(overallRating.replace(',', '.')) : null

      // Количество отзывов
      const reviewCountElement = document.querySelector(
        '[itemprop="reviewCount"], ' +
        '[class*="reviewCount"], ' +
        '[class*="review"][class*="count"]'
      )
      const reviewCountText = reviewCountElement?.textContent?.trim() || 
                             reviewCountElement?.getAttribute('content') || '0'
      const reviewCount = parseInt(reviewCountText.replace(/\D/g, '')) || 0

      return { reviews, rating, reviewCount }
    })

    // Убираем дубликаты по тексту отзыва
    const uniqueReviews = Array.from(
      new Map(data.reviews.map(r => [r.text, r])).values()
    )

    console.log(`[2GIS Puppeteer] ✅ Extracted ${uniqueReviews.length} unique reviews (${data.reviews.length} total)`)

    return {
      reviews: uniqueReviews,
      rating: data.rating,
      reviewCount: data.reviewCount
    }

  } catch (error: any) {
    console.error('[2GIS Puppeteer] Error:', error.message)
    throw error
  } finally {
    await browser.close()
    console.log('[2GIS Puppeteer] Browser closed')
  }
}
















