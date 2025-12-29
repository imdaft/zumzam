import Link from 'next/link'
import Image from 'next/image'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      {/* Logo */}
      <Link href="/" className="mb-8 hover:opacity-90 transition-opacity">
        <div className="flex items-center gap-3 justify-center">
          {/* Мобильный логотип */}
          <Image 
            src="/zumzam_mob.svg" 
            alt="ZumZam" 
            width={48}
            height={32}
            className="h-8 w-auto md:hidden"
            unoptimized
            priority
          />
          {/* Десктопный логотип */}
          <Image 
            src="/zumzam.svg" 
            alt="ZumZam" 
            width={160}
            height={30}
            className="h-8 w-auto hidden md:block"
            quality={100}
            unoptimized
            priority
          />
        </div>
      </Link>
      
      <div className="w-full max-w-md p-8">
        {children}
      </div>
    </div>
  )
}

