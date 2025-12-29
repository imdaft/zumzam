'use client'

import { useSiteFont } from '@/lib/hooks/use-site-font'

export function FontProvider({ children }: { children: React.ReactNode }) {
  useSiteFont()
  return <>{children}</>
}

