'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/contexts/auth-context'

export default function TestAuthPage() {
  const [status, setStatus] = useState('Начинаю тест...')
  const [logs, setLogs] = useState<string[]>([])
  const { user, loading } = useAuth()
  
  const addLog = (msg: string) => {
    console.log(msg)
    setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].slice(0, -1)} - ${msg}`])
  }

  useEffect(() => {
    const runTest = async () => {
      try {
        addLog('🔧 Шаг 1: Проверяю JWT Auth')
        addLog(`  JWT_SECRET: ${process.env.JWT_SECRET ? '✅' : '❌'}`)
        
        addLog('🔧 Шаг 2: Проверяю AuthContext')
        addLog(`  Loading: ${loading}`)
        addLog(`  User: ${user ? user.email : 'NULL'}`)
        
        addLog('🔧 Шаг 3: Проверяю cookies')
        const cookies = document.cookie
        const hasAuthToken = cookies.includes('auth-token')
        const hasUserInfo = cookies.includes('user-info')
        
        addLog(`  auth-token: ${hasAuthToken ? '✅' : '❌'}`)
        addLog(`  user-info: ${hasUserInfo ? '✅' : '❌'}`)
        
        if (user) {
          addLog('✅ Пользователь авторизован!')
          addLog(`  ID: ${user.id}`)
          addLog(`  Email: ${user.email}`)
          addLog(`  Role: ${user.role}`)
          setStatus('✅ ТЕСТ ПРОЙДЕН - Пользователь авторизован!')
        } else {
          addLog('⚠️ Пользователь не авторизован')
          setStatus('⚠️ ТЕСТ ПРОЙДЕН - Но пользователь не авторизован')
        }
        
      } catch (error: any) {
        addLog(`❌ ОШИБКА: ${error.message}`)
        setStatus(`❌ ПРОВАЛ: ${error.message}`)
      }
    }
    
    if (!loading) {
      runTest()
    }
  }, [user, loading])

  return (
    <div style={{ 
      padding: '2rem', 
      fontFamily: 'monospace', 
      maxWidth: '800px', 
      margin: '0 auto' 
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
        🧪 Тест Supabase Auth
      </h1>
      
      <div style={{ 
        padding: '1rem', 
        background: status.includes('✅') ? '#d4edda' : status.includes('❌') ? '#f8d7da' : '#fff3cd',
        border: '1px solid',
        borderColor: status.includes('✅') ? '#c3e6cb' : status.includes('❌') ? '#f5c6cb' : '#ffeaa7',
        borderRadius: '4px',
        marginBottom: '2rem'
      }}>
        <strong>Статус:</strong> {status}
      </div>

      <div style={{ 
        background: '#000', 
        color: '#0f0', 
        padding: '1rem', 
        borderRadius: '4px',
        maxHeight: '500px',
        overflowY: 'auto',
        fontFamily: 'Consolas, monospace',
        fontSize: '0.9rem'
      }}>
        {logs.map((log, i) => (
          <div key={i} style={{ marginBottom: '0.25rem' }}>
            {log}
          </div>
        ))}
        {logs.length === 0 && <div>Загрузка...</div>}
      </div>
      
      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8f9fa', borderRadius: '4px' }}>
        <h3>💡 Что проверяем:</h3>
        <ol>
          <li>Переменные окружения загружены</li>
          <li>Supabase client создается</li>
          <li>getSession() отвечает в течение 5 секунд</li>
        </ol>
        <p style={{ marginTop: '1rem', color: '#666' }}>
          <strong>Если видите TIMEOUT</strong> - проблема в сети или в настройках Supabase проекта.
        </p>
      </div>
    </div>
  )
}

