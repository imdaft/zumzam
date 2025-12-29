import { Metadata } from 'next'
import { CreateRequestWizard } from '@/components/features/request/create-request-wizard'

export const metadata: Metadata = {
  title: 'Создать заявку — ZumZam',
  description: 'Опишите, что вам нужно для детского праздника, и исполнители сами предложат свои услуги',
}

type CreateRequestPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function CreateRequestPage({ searchParams }: CreateRequestPageProps) {
  const params = await searchParams
  const prefillRaw = typeof params?.prefill === 'string' ? params.prefill : null
  let initialData: Record<string, unknown> | undefined

  if (prefillRaw) {
    try {
      const decoded = Buffer.from(prefillRaw, 'base64url').toString('utf-8')
      initialData = JSON.parse(decoded)
    } catch (error) {
      console.error('[CreateRequestPage] Не удалось распарсить prefill', error)
    }
  }

  return <CreateRequestWizard initialData={initialData} />
}

