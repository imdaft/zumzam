'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function QuickLoginPage() {
  const [email, setEmail] = useState('vanekseleznev@gmail.com')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('Входим...')
    setError('')

    try {
      console.log('[QuickLogin] Attempting login...')
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Ошибка входа')
        setStatus('Ошибка входа')
      } else {
        console.log('[QuickLogin] Login success!')
        setStatus('Успешно! Перенаправляю на создание профиля...')
        setTimeout(() => {
          router.push('/quick-profile')
          router.refresh()
        }, 1000)
      }
    } catch (err: any) {
      setError(err.message)
      setStatus('Исключение: ' + err.message)
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1>🚀 Быстрый вход</h1>
      
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Пароль:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
            required
          />
        </div>

        <button
          type="submit"
          style={{
            padding: '0.75rem',
            background: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          Войти
        </button>
      </form>

      {status && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: error ? '#fee' : '#efe', borderRadius: '4px' }}>
          <strong>Статус:</strong> {status}
        </div>
      )}

      {error && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#fee', borderRadius: '4px', color: 'red' }}>
          <strong>Ошибка:</strong> {error}
        </div>
      )}

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '4px', fontSize: '0.875rem' }}>
        <p><strong>💡 Подсказка:</strong></p>
        <p>Если забыли пароль, зарегистрируйтесь заново с этим же email</p>
        <a href="/register" style={{ color: '#0070f3' }}>→ Регистрация</a>
      </div>
    </div>
  )
}

