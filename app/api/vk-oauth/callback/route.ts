import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/vk-oauth/callback - OAuth callback от VK
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state') // user_id

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=vk_auth_failed`)
    }

    // TODO: Обмен code на access_token
    // const tokenResponse = await fetch('https://oauth.vk.com/access_token', {
    //   method: 'POST',
    //   body: new URLSearchParams({
    //     client_id: process.env.VK_CLIENT_ID!,
    //     client_secret: process.env.VK_CLIENT_SECRET!,
    //     redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/vk-oauth/callback`,
    //     code
    //   })
    // })
    // const tokenData = await tokenResponse.json()

    // Сохранить VK данные
    await prisma.users.update({
      where: { id: state },
      data: {
        vk_id: 'vk_user_id', // tokenData.user_id
        vk_access_token: 'encrypted_token' // encrypt(tokenData.access_token)
      }
    })

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?vk=connected`)
  } catch (error: any) {
    console.error('Error in VK OAuth callback:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=vk_auth_failed`)
  }
}



