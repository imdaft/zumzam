/**
 * RAG (Retrieval-Augmented Generation) для AI
 * Временная заглушка - векторный поиск будет реализован позже через Prisma + pgvector
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
 * Поиск релевантных документов
 * TODO: Реализовать через Prisma + pgvector raw SQL
 */
export async function findRelevantDocs(
  query: string,
  profileId?: string,
  limit: number = 5,
  threshold: number = 0.6
): Promise<RAGDocument[]> {
  console.warn('[RAG] Vector search temporarily disabled - returning empty results')
  console.log('[RAG] Query:', query, 'ProfileId:', profileId)
  
  // TODO: Реализовать через Prisma:
  // await prisma.$queryRaw`
  //   SELECT * FROM services
  //   WHERE embedding <=> ${embedding}::vector < ${threshold}
  //   ORDER BY embedding <=> ${embedding}::vector
  //   LIMIT ${limit}
  // `
  
  return []
}

/**
 * Построение контекста для AI из найденных документов
 */
export function buildContext(docs: RAGDocument[]): string {
  if (docs.length === 0) {
    return 'Контекст не найден.'
  }

  return docs
    .map((doc, i) => `[${i + 1}] ${doc.content}`)
    .join('\n\n')
}
