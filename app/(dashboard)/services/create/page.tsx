import { ServiceForm } from '@/components/features/service/service-form'

/**
 * Страница создания услуги
 */
export default function CreateServicePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Новая услуга</h1>
        <p className="text-muted-foreground mt-2">
          Добавьте услугу, которую вы предлагаете родителям
        </p>
      </div>

      <ServiceForm />
    </div>
  )
}

