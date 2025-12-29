import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import path from 'path'

// Добавляем stealth плагин для обхода детекции headless браузера
puppeteer.use(StealthPlugin())

interface YandexReview {
  id: string
  author: {
    name: string
    avatar?: string
    profile_url?: string
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
 * Парсит отзывы с Яндекс.Карт через Puppeteer (headless браузер)
 */
export async function parseYandexReviewsWithPuppeteer(
  yandexUrl: string
): Promise<{ reviews: YandexReview[]; rating: number | null; reviewCount: number }> {
  console.log('[Puppeteer] Starting browser with persistent session...')
  
  // Путь для сохранения профиля браузера (cookies, история и т.д.)
  const userDataDir = path.join(process.cwd(), 'chrome-user-data')
  console.log('[Puppeteer] User data directory:', userDataDir)
  
  const browser = await puppeteer.launch({
    headless: false, // ← ВИДИМЫЙ браузер! (иначе CAPTCHA)
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
      'Referer': 'https://yandex.ru/',
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

    console.log('[Puppeteer] Navigating to:', yandexUrl)

    // Переходим на страницу
    await page.goto(yandexUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    console.log('[Puppeteer] Page loaded, waiting for content...')
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Кликаем по кнопке "Посмотреть все отзывы" (если есть)
    console.log('[Puppeteer] Looking for "Show all reviews" button...')
    const buttonClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const targetButton = buttons.find(btn => 
        btn.textContent && btn.textContent.includes('Посмотреть все') && btn.textContent.includes('отзыв')
      )
      
      if (targetButton) {
        console.log('[Client] Found button:', targetButton.textContent?.trim())
        targetButton.click()
        return true
      }
      return false
    })

    if (buttonClicked) {
      console.log('[Puppeteer] ✅ Button clicked! Waiting for reviews to load...')
      await new Promise(resolve => setTimeout(resolve, 5000))
    } else {
      console.log('[Puppeteer] ⚠️ Button not found, will scroll manually')
    }

    // Прокручиваем контейнер для подгрузки всех отзывов
    console.log('[Puppeteer] Scrolling to load all reviews...')
    let prevCount = 0
    let stableCount = 0
    
    for (let i = 0; i < 40; i++) {
      await page.evaluate(() => {
        const scrollContainer = document.querySelector('.scroll__container')
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight
        }
      })
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Проверяем количество отзывов каждые 5 итераций
      if (i % 5 === 4) {
        const currentCount = await page.evaluate(() => {
          return document.querySelectorAll('[class*="business-review-view"]').length
        })
        
        console.log(`[Puppeteer] Scroll ${i + 1}/40 - reviews: ${currentCount}`)
        
        if (currentCount === prevCount) {
          stableCount++
          if (stableCount >= 4) {
            console.log('[Puppeteer] No more reviews loading, stopping scroll')
            break
          }
        } else {
          stableCount = 0
          prevCount = currentCount
        }
      }
    }

    console.log('[Puppeteer] Waiting for final content load...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    console.log('[Puppeteer] Extracting reviews...')

    // Извлекаем отзывы из страницы
    const data = await page.evaluate(() => {
      const reviews: any[] = []
      
      // Ищем блоки с отзывами
      const reviewElements = document.querySelectorAll('[class*="business-review-view"]')
      
      console.log('Found review elements:', reviewElements.length)
      
      reviewElements.forEach((element, index) => {
        try {
          // Имя автора
          const authorElement = element.querySelector('[itemprop="name"]') || 
                                element.querySelector('[class*="author"]')
          const authorName = authorElement?.textContent?.trim() || 'Аноним'

          // Аватар
          const avatarElement = element.querySelector('img[class*="avatar"]')
          const avatar = avatarElement?.getAttribute('src') || undefined

          // Рейтинг
          const ratingElement = element.querySelector('[class*="rating"]')
          const ratingText = ratingElement?.textContent?.trim() || '5'
          const rating = parseFloat(ratingText.replace(',', '.')) || 5

          // Текст отзыва
          const textElement = element.querySelector('[itemprop="reviewBody"]') ||
                             element.querySelector('[class*="body"]')
          const text = textElement?.textContent?.trim() || ''

          // Дата
          const dateElement = element.querySelector('[class*="date"]') ||
                             element.querySelector('time')
          const dateText = dateElement?.textContent?.trim() || new Date().toISOString()

          // Ответ организации
          const replyElement = element.querySelector('[class*="comment"]')
          let businessComment = undefined
          
          if (replyElement) {
            const replyTextEl = replyElement.querySelector('[class*="text"]') || replyElement
            const replyText = replyTextEl?.textContent?.trim()
            const replyDateEl = replyElement.querySelector('[class*="date"]')
            const replyDate = replyDateEl?.textContent?.trim()
            
            // Проверяем, что это не кнопка "Посмотреть ответ"
            if (replyText && !replyText.includes('Посмотреть ответ') && replyText.length > 10) {
              businessComment = {
                text: replyText,
                date: replyDate || dateText,
              }
            }
          }

          // Добавляем только если есть текст отзыва
          if (text && text.length > 3) {
            reviews.push({
              id: `review_${Date.now()}_${index}`,
              author: {
                name: authorName,
                avatar,
              },
              rating,
              text,
              date: dateText,
              businessComment,
            })
          }
        } catch (err) {
          console.error('Error parsing review:', err)
        }
      })

      // Общий рейтинг
      const ratingBadge = document.querySelector('[class*="business-summary-rating"]')
      const overallRating = ratingBadge?.textContent?.trim()
      const rating = overallRating ? parseFloat(overallRating.replace(',', '.')) : null

      // Количество отзывов
      const reviewCountElement = document.querySelector('[class*="business-summary-rating"] + span')
      const reviewCountText = reviewCountElement?.textContent?.trim() || '0'
      const reviewCount = parseInt(reviewCountText.replace(/\D/g, '')) || 0

      return { reviews, rating, reviewCount }
    })

    // Убираем дубликаты по тексту отзыва
    const uniqueReviews = Array.from(
      new Map(data.reviews.map(r => [r.text, r])).values()
    )

    console.log(`[Puppeteer] ✅ Extracted ${uniqueReviews.length} unique reviews (${data.reviews.length} total)`)

    return {
      reviews: uniqueReviews,
      rating: data.rating,
      reviewCount: data.reviewCount
    }

  } catch (error: any) {
    console.error('[Puppeteer] Error:', error.message)
    throw error
  } finally {
    await browser.close()
    console.log('[Puppeteer] Browser closed')
  }
}

