import Link from 'next/link'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ServiceNotFound() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center px-4 text-center">
      <Search className="h-16 w-16 text-muted-foreground mb-4" />
      <h2 className="text-2xl font-bold mb-2">Услуга не найдена</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        К сожалению, запрошенная услуга не существует или была удалена.
      </p>
      <div className="flex gap-4">
        <Link href="/services">
          <Button>Все услуги</Button>
        </Link>
        <Link href="/">
          <Button variant="outline">На главную</Button>
        </Link>
      </div>
    </div>
  )
}


