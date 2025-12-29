import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { EditRequestClient } from './client'

export const metadata: Metadata = {
  title: 'Редактировать объявление — ZumZam',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditRequestPage({ params }: PageProps) {
  const { id } = await params

  

  const user = await getCurrentUser()
  if (!user) {
    redirect('/login?redirect=/my-requests/' + id + '/edit')
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

  return <EditRequestClient request={request} />
}





