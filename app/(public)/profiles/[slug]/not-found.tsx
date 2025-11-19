import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SearchX } from 'lucide-react'

/**
 * Страница "Профиль не найден"
 */
export default function ProfileNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-slate-100 p-6 dark:bg-slate-800">
            <SearchX className="h-16 w-16 text-slate-400" />
          </div>
        </div>
        <h1 className="mb-2 text-4xl font-bold">Профиль не найден</h1>
        <p className="mb-8 text-lg text-muted-foreground">
          К сожалению, такой профиль не существует или был удалён
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link href="/search">Найти студии</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/">На главную</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}


