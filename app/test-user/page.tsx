'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function TestUserPage() {
  const [status, setStatus] = useState('Loading...')
  const [authUser, setAuthUser] = useState<any>(null)
  const [dbUser, setDbUser] = useState<any>(null)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    async function test() {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // 1. Проверяем auth
        setStatus('Checking auth...')
        const { data: { user } } = await supabase.auth.getUser()
        setAuthUser(user)

        if (!user) {
          setStatus('No auth user')
          return
        }

        // 2. Проверяем таблицу users
        setStatus('Fetching from public.users...')
        const { data, error: dbError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (dbError) {
          setError(dbError)
          setStatus('Error fetching from DB')
        } else {
          setDbUser(data)
          setStatus('Success!')
        }
      } catch (err: any) {
        setError(err)
        setStatus('Exception: ' + err.message)
      }
    }

    test()
  }, [])

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>User Test Page</h1>
      
      <h2>Status: {status}</h2>

      <h3>Auth User:</h3>
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

