'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/contexts/auth-context'

export default function TestUserPage() {
  const { user: authUser } = useAuth()
  const [status, setStatus] = useState('Loading...')
  const [dbUser, setDbUser] = useState<any>(null)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    async function test() {
      try {
        // 1. Проверяем auth через context
        setStatus('Checking auth...')
        
        if (!authUser) {
          setStatus('No auth user')
          return
        }

        // 2. Проверяем таблицу users через API
        setStatus('Fetching from /api/users/me...')
        const response = await fetch('/api/users/me')
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          setError(errorData)
          setStatus('Error fetching from DB')
          return
        }

        const result = await response.json()
        
        if (result.error) {
          setError(result.error)
          setStatus('Error fetching from DB')
        } else {
          setDbUser(result.data)
          setStatus('Success!')
        }
      } catch (err: any) {
        setError(err)
        setStatus('Exception: ' + err.message)
      }
    }

    if (authUser !== undefined) {
      test()
    }
  }, [authUser])

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>User Test Page</h1>
      
      <h2>Status: {status}</h2>

      <h3>Auth User (from context):</h3>
      <pre>{JSON.stringify(authUser, null, 2)}</pre>

      <h3>DB User:</h3>
      <pre>{JSON.stringify(dbUser, null, 2)}</pre>

      {error && (
        <>
          <h3 style={{ color: 'red' }}>Error:</h3>
          <pre style={{ color: 'red' }}>{JSON.stringify(error, null, 2)}</pre>
        </>
      )}
    </div>
  )
}

