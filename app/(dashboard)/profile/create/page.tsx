import { CreateProfileForm } from '@/components/features/profile/create-profile-form'

/**
 * Страница создания профиля студии/аниматора
 */
export default function CreateProfilePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Создание профиля</h1>
        <p className="text-muted-foreground mt-2">
          Расскажите о себе или своей студии, чтобы родители могли вас найти
        </p>
      </div>

      <CreateProfileForm />
    </div>
  )
}

