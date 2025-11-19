'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function QuickProfilePage() {
  const router = useRouter()
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const [displayName, setDisplayName] = useState('')
  const [slug, setSlug] = useState('')
  const [bio, setBio] = useState('')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState('Москва')

  console.log('[QuickProfile] Component rendered')
  console.log('[QuickProfile] Display name:', displayName)
  console.log('[QuickProfile] Slug:', slug)

  const handleCreate = async (e: React.FormEvent) => {
    console.log('========================================')
    console.log('[handleCreate] BUTTON CLICKED!')
    console.log('[handleCreate] Event:', e)
    
    e.preventDefault()
    
    console.log('[handleCreate] Display name:', displayName)
    console.log('[handleCreate] Slug:', slug)
    
    setStatus('Проверяю сессию...')
    setError('')

    try {
      const supabase = createClient()

      // СНАЧАЛА проверим есть ли сессия вообще
      console.log('[handleCreate] Checking session...')
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log('[handleCreate] Session check:', session ? 'EXISTS' : 'NULL', sessionError?.message || '')
      
      if (!session) {
        throw new Error('Нет активной сессии! Пожалуйста, сначала войдите через /login или /quick-login')
      }

      // Получаем текущего пользователя напрямую
      console.log('[handleCreate] Fetching current user...')
      setStatus('Получаю пользователя...')
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
      
      console.log('[handleCreate] Auth result:', currentUser ? `ID: ${currentUser.id}` : 'NULL', 'Error:', authError?.message || 'NONE')

      if (authError || !currentUser) {
        throw new Error(authError?.message || 'Не удалось получить пользователя. Войдите заново.')
      }

      console.log('[handleCreate] Starting profile creation...')
      setStatus('Создаю профиль...')

      const profileData = {
        user_id: currentUser.id,
        display_name: displayName,
        slug: slug || displayName.toLowerCase().replace(/\s+/g, '-'),
        bio: bio || 'Описание отсутствует',
        description: description || 'Подробное описание отсутствует. Мы работаем над его добавлением.',
        city: city,
        tags: ['детские праздники'],
        price_range: '$$',
        email: currentUser.email || '',
        active: true,
        verified: false,
      }

      console.log('Creating profile:', profileData)

      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // ВАЖНО: отправляем cookies для аутентификации
        body: JSON.stringify(profileData),
      })

      const result = await response.json()
      console.log('Response:', response.status, result)

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create profile')
      }

      setStatus('Успешно! Перенаправляю...')
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 1000)
    } catch (err: any) {
      console.error('Create error:', err)
      setError(err.message)
      setStatus('Ошибка')
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1>🚀 Быстрое создание профиля</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>Минимальная форма для тестирования</p>

      {/* ВАЖНОЕ ПРЕДУПРЕЖДЕНИЕ */}
      <div style={{ 
        padding: '1.5rem', 
        background: '#fff3cd', 
        border: '2px solid #ffc107', 
        borderRadius: '8px', 
        marginBottom: '2rem',
        fontSize: '0.95rem'
      }}>
        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
          ⚠️ ВАЖНО: СНАЧАЛА НУЖНО ВОЙТИ!
        </p>
        <p style={{ margin: 0, marginBottom: '0.5rem' }}>
          Для создания профиля нужна активная сессия.
        </p>
        <p style={{ margin: 0 }}>
          <strong>Шаг 1:</strong> <a href="/quick-login" style={{ color: '#0070f3', textDecoration: 'underline' }}>Войдите через /quick-login</a>
          <br />
          <strong>Шаг 2:</strong> Вернитесь сюда и создайте профиль
        </p>
      </div>

      <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Название студии: <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Веселые праздники"
            required
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Slug (URL): <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="veselye-prazdniki"
            required
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          <small style={{ color: '#666' }}>Латиница, цифры, дефисы. Пример: my-studio</small>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Короткое описание (био):
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Организуем незабываемые детские праздники"
            rows={3}
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Полное описание:
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Мы занимаемся организацией детских праздников уже более 10 лет..."
            rows={5}
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          <small style={{ color: '#666' }}>Минимум 50 символов</small>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Город:
          </label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
          >
            <option value="Москва">Москва</option>
            <option value="Санкт-Петербург">Санкт-Петербург</option>
            <option value="Новосибирск">Новосибирск</option>
            <option value="Екатеринбург">Екатеринбург</option>
            <option value="Казань">Казань</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={!displayName || !slug}
          style={{
            padding: '0.75rem',
            background: !displayName || !slug ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: !displayName || !slug ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold',
          }}
        >
          Создать профиль (прямая проверка auth)
        </button>
      </form>

      {status && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          background: error ? '#fee' : '#efe', 
          borderRadius: '4px',
          border: error ? '1px solid #fcc' : '1px solid #cfc'
        }}>
          <strong>Статус:</strong> {status}
        </div>
      )}

      {error && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          background: '#fee', 
          borderRadius: '4px', 
          color: 'red',
          border: '1px solid #fcc'
        }}>
          <strong>Ошибка:</strong> {error}
        </div>
      )}

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '4px', fontSize: '0.875rem' }}>
        <p><strong>💡 Инструкция:</strong></p>
        <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
          <li>Заполните название студии (обязательно)</li>
          <li>Укажите slug - это будет в URL (обязательно)</li>
          <li>Остальные поля опциональны</li>
          <li>Нажмите "Создать профиль"</li>
        </ul>
        <p style={{ marginTop: '1rem' }}><strong>🔍 Смотрите консоль (F12) для логов</strong></p>
      </div>
    </div>
  )
}

