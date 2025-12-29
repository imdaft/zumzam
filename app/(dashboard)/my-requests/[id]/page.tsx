import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { RequestDetailClient } from './client'

export const metadata: Metadata = {
  title: 'Моё объявление — ZumZam',
}

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ created?: string }>
}

export default async function MyRequestPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { created } = await searchParams

  

  const user = await getCurrentUser()
  if (!user) {
    redirect('/login?redirect=/my-requests/' + id)
  }

  const { data: request, error } = await supabase
    .from('order_requests')
    .select('*')
    .eq('id', id)
    .eq('client_id', user.id)
    .single()

  if (error || !request) {
    notFound()
  }

  const { data: responses } = await supabase
    .from('order_responses')
    .select(`
      *,
      profile:profiles (
        id,
        title,
        slug,
        logo,
        rating,
        reviews_count
      )
    `)
    .eq('request_id', id)
    .order('created_at', { ascending: false })

  return (
    <RequestDetailClient
      request={request}
      responses={responses || []}
      isNewlyCreated={created === 'true'}
    />
  )
}





