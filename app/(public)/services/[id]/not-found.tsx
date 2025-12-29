import Link from 'next/link'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ServiceNotFound() {
  return (
    <div className="min-h-[calc(100dvh-120px)] bg-[#F7F8FA] px-2 py-6 sm:py-10">
      <div className="max-w-xl mx-auto bg-white border border-gray-100 shadow-sm rounded-[24px] p-6 sm:p-8 text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-orange-500 flex items-center justify-center">
          <Search className="h-7 w-7 text-white" />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-gray-900">Услуга не найдена</h2>
        <p className="mt-1 text-gray-600 max-w-md mx-auto">
        К сожалению, запрошенная услуга не существует или была удалена.
        </p>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link href="/services">
            <Button className="w-full rounded-full bg-orange-500 hover:bg-orange-600">Все услуги</Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full rounded-full">На главную</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}


