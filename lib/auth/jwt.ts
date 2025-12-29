import { jwtVerify, SignJWT } from 'jose'

export interface JWTPayload {
  userId: string
  email: string
  role: string
  type: 'access' | 'refresh'
}

/**
 * Создаёт JWT токен для пользователя
 */
export async function signJWT(
  userId: string,
  email?: string,
  role?: string
): Promise<string> {
  const secret = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-secret-key-change-me'
  )

  const token = await new SignJWT({
    userId,
    email: email || '',
    role: role || 'user',
    type: 'access',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // 7 дней
    .sign(secret)

  return token
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'your-secret-key-change-me'
    )
    
    const { payload } = await jwtVerify(token, secret)
    
    if (payload.type !== 'access') {
      return null
    }
    
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as string,
      type: payload.type as 'access' | 'refresh',
    }
  } catch (error) {
    return null
  }
}

export function getUserFromCookies(request: Request): JWTPayload | null {
  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) return null

  const cookies = Object.fromEntries(
    cookieHeader.split('; ').map(c => {
      const [key, ...v] = c.split('=')
      return [key, v.join('=')]
    })
  )

  const authToken = cookies['auth-token']
  if (!authToken) return null

  // Note: We can't use async in this function, so we'll need to call verifyJWT separately
  return null
}

/**
 * Verify JWT token and return payload with standard JWT fields (sub, email, etc.)
 */
export async function verifyToken(token: string): Promise<{ sub: string; email?: string; role?: string } | null> {
  try {
    const jwtPayload = await verifyJWT(token)
    if (!jwtPayload) return null
    
    return {
      sub: jwtPayload.userId,
      email: jwtPayload.email,
      role: jwtPayload.role,
    }
  } catch (error) {
    return null
  }
}

/**
 * Get user ID from request (helper function)
 */
export async function getUserIdFromRequest(request: Request): Promise<string | null> {
  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) return null

  const cookies = Object.fromEntries(
    cookieHeader.split('; ').map(c => {
      const [key, ...v] = c.split('=')
      return [key, v.join('=')]
    })
  )

  const authToken = cookies['auth-token']
  if (!authToken) return null

  const payload = await verifyToken(authToken)
  return payload?.sub || null
}

/**
 * Verify authentication from request and return user info
 */
export async function verifyAuth(request: Request): Promise<{
  user: JWTPayload | null
  error?: string
}> {
  try {
    const cookieHeader = request.headers.get('cookie')
    if (!cookieHeader) {
      return { user: null, error: 'No auth token' }
    }

    const cookies = Object.fromEntries(
      cookieHeader.split('; ').map(c => {
        const [key, ...v] = c.split('=')
        return [key, v.join('=')]
      })
    )

    const authToken = cookies['auth-token']
    if (!authToken) {
      return { user: null, error: 'No auth token' }
    }

    const user = await verifyJWT(authToken)
    if (!user) {
      return { user: null, error: 'Invalid token' }
    }

    return { user }
  } catch (error) {
    return { user: null, error: 'Auth verification failed' }
  }
}
