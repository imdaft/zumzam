'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { useUser } from '@/lib/hooks/useUser'

export default function QuickProfilePage() {
  const router = useRouter()
  const { user } = useUser()
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const [displayName, setDisplayName] = useState('')
  const [slug, setSlug] = useState('')
  const [bio, setBio] = useState('')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState('Москва')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError('Нужно войти')
      return
    }

    setStatus('Создаю...')
    setError('')

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const profileData = {
        user_id: user.id,
        display_name: displayName,
        slug: slug || displayName.toLowerCase().replace(/\s+/g, '-'),
        bio: bio || 'Описание отсутствует',
        description: description || 'Подробное описание отсутствует. Мы работаем над его добавлением.',
        city: city,
        tags: ['детские праздники'],
        price_range: '$$',
        email: user.email || '',
        active: true,
        verified: false,
      }

      console.log('Creating profile:', profileData)

      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
          disabled={!displayName || !slug || !user}
          style={{
            padding: '0.75rem',
            background: !displayName || !slug || !user ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: !displayName || !slug || !user ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold',
          }}
        >
          Создать профиль
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

