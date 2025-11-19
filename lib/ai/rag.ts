import { generateEmbedding, cosineSimilarity } from './embeddings'
import { createServerClient } from '@/lib/supabase/server'

/**
 * Интерфейс для документа в RAG
 */
export interface RAGDocument {
  id: string
  content: string
  metadata: {
    type: 'profile' | 'service' | 'review'
    profile_id?: string
    service_id?: string
    title?: string
    [key: string]: any
  }
  similarity?: number
}

/**
 * Поиск релевантных документов по embedding similarity
 */
export async function findRelevantDocs(
  query: string,
  profileId?: string,
  limit: number = 5,
  threshold: number = 0.6
): Promise<RAGDocument[]> {
  try {
    const supabase = await createServerClient()
    
    // Генерируем embedding для запроса
    const queryEmbedding = await generateEmbedding(query)
    
    const docs: RAGDocument[] = []

    // 1. Поиск релевантных услуг
    const { data: services } = await supabase.rpc('match_services', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
    })

    // Фильтруем по profile_id если указан
    const filteredServices = profileId
      ? services?.filter((s: any) => s.profile_id === profileId)
      : services

    filteredServices?.forEach((service: any) => {
      docs.push({
        id: service.id,
        content: `Услуга: ${service.title}\nОписание: ${service.description}\nЦена: ${service.price}₽\nВозраст: ${service.age_from}-${service.age_to} лет\nТеги: ${service.tags?.join(', ')}`,
        metadata: {
          type: 'service',
          service_id: service.id,
          profile_id: service.profile_id,
          title: service.title,
        },
        similarity: service.similarity,
      })
    })

    // 2. Поиск информации о профиле
    if (profileId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single()

      if (profile) {
        const profileContent = `Профиль: ${profile.display_name}\nОписание: ${profile.bio || ''}\nГород: ${profile.city}\nАдрес: ${profile.address || ''}\nТелефон: ${profile.phone || ''}\nEmail: ${profile.email || ''}\nСайт: ${profile.website || ''}\nТеги: ${profile.tags?.join(', ') || ''}\nРейтинг: ${profile.rating}/5\nПроверен: ${profile.verified ? 'Да' : 'Нет'}`
        const profileEmbedding = await generateEmbedding(profileContent)
        const profileSimilarity = cosineSimilarity(queryEmbedding, profileEmbedding)

        if (profileSimilarity >= threshold) {
          docs.push({
            id: profile.id,
            content: profileContent,
            metadata: {
              type: 'profile',
              profile_id: profile.id,
              title: profile.display_name,
            },
            similarity: profileSimilarity,
          })
        }
      }
    }

    // 3. TODO: Поиск релевантных отзывов (когда будет таблица reviews)
    // Пока пропускаем

    // Сортируем по relevance
    docs.sort((a, b) => (b.similarity || 0) - (a.similarity || 0))

    return docs.slice(0, limit)
  } catch (error) {
    console.error('RAG findRelevantDocs error:', error)
    return []
  }
}

/**
 * Генерация ответа с использованием RAG
 */
export async function generateRAGResponse(
  query: string,
  profileId?: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<{ answer: string; sources: RAGDocument[] }> {
  try {
    // 1. Находим релевантные документы
    const relevantDocs = await findRelevantDocs(query, profileId, 5, 0.5)

    if (relevantDocs.length === 0) {
      return {
        answer: 'К сожалению, я не нашёл достаточно информации, чтобы ответить на ваш вопрос. Попробуйте переформулировать вопрос или задайте другой.',
        sources: [],
      }
    }

    // 2. Формируем контекст из найденных документов
    const context = relevantDocs
      .map((doc, i) => `Документ ${i + 1}:\n${doc.content}`)
      .join('\n\n---\n\n')

    // 3. Формируем промпт для генерации
    const systemPrompt = `Ты - помощник по детским праздникам и развлечениям на платформе DetiNaRakete.ru.

Твоя задача - отвечать на вопросы пользователей о студиях, аниматорах и услугах, используя ТОЛЬКО информацию из предоставленных документов.

Правила:
- Отвечай на русском языке
- Будь дружелюбным и полезным
- Используй только факты из документов
- Если информации нет, так и скажи
- Не придумывай цены и детали
- Будь кратким (2-4 предложения)
- Используй эмодзи для дружелюбности 😊
- Если говоришь о конкретной услуге, упомяни её название

Контекст (документы):
${context}`

    // 4. Формируем историю разговора для Gemini
    const messages = [
      { role: 'user' as const, content: systemPrompt },
      ...conversationHistory,
      { role: 'user' as const, content: query },
    ]

    // Пока используем простую генерацию (можно добавить streaming позже)
    const { generateText } = await import('./gemini')
    const answer = await generateText(
      messages.map(m => m.content).join('\n\n'),
      {
        temperature: 0.7,
        maxTokens: 500,
      }
    )

    return {
      answer,
      sources: relevantDocs,
    }
  } catch (error) {
    console.error('RAG generateResponse error:', error)
    return {
      answer: 'Извините, произошла ошибка при обработке вашего вопроса. Попробуйте ещё раз.',
      sources: [],
    }
  }
}

