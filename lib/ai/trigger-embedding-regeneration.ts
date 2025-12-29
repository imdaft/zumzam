/**
 * Вызывает регенерацию embeddings для профиля
 * Используется после создания/обновления услуг, пакетов, отзывов
 */
export async function triggerEmbeddingRegeneration(profileId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4000'
    
    // Вызываем webhook в фоновом режиме (не ждем результата)
    fetch(`${baseUrl}/api/webhooks/profile-updated`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId })
    }).catch(error => {
      console.error('[triggerEmbeddingRegeneration] Failed:', error)
    })

    console.log(`[triggerEmbeddingRegeneration] Triggered for profile ${profileId}`)
  } catch (error) {
    console.error('[triggerEmbeddingRegeneration] Error:', error)
  }
}















