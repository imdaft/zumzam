/**
 * SEO-безопасные ссылки
 * Автоматически добавляет nofollow, noopener, noreferrer для внешних ссылок
 */

import Link from 'next/link'

interface SafeLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
  children: React.ReactNode
  external?: boolean
  nofollow?: boolean
}

/**
 * Проверяет, является ли ссылка внешней
 */
function isExternalLink(href: string): boolean {
  if (!href) return false
  if (href.startsWith('/')) return false
  if (href.startsWith('#')) return false
  if (href.startsWith('mailto:')) return false
  if (href.startsWith('tel:')) return false
  
  // Проверяем домен
  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : ''
  
  try {
    const url = new URL(href)
    return url.hostname !== currentDomain && url.hostname !== 'zumzam.ru'
  } catch {
    return false
  }
}

/**
 * Безопасная ссылка с автоматическим nofollow для внешних
 */
export function SafeLink({ 
  href, 
  children, 
  external, 
  nofollow,
  rel,
  ...props 
}: SafeLinkProps) {
  const isExternal = external ?? isExternalLink(href)
  
  // Формируем rel атрибут
  let relValue = rel || ''
  
  if (isExternal) {
    const relParts = new Set(relValue.split(' ').filter(Boolean))
    relParts.add('noopener')
    relParts.add('noreferrer')
    
    // Добавляем nofollow для внешних ссылок (кроме доверенных)
    if (nofollow !== false && !isTrustedDomain(href)) {
      relParts.add('nofollow')
    }
    
    relValue = Array.from(relParts).join(' ')
  }
  
  // Для внутренних ссылок используем Next.js Link
  if (!isExternal) {
    return (
      <Link href={href} {...props}>
        {children}
      </Link>
    )
  }
  
  // Для внешних ссылок используем обычный <a>
  return (
    <a
      href={href}
      rel={relValue}
      target={isExternal ? '_blank' : undefined}
      {...props}
    >
      {children}
    </a>
  )
}

/**
 * Доверенные домены (не добавляем nofollow)
 */
const TRUSTED_DOMAINS = [
  'vk.com',
  'instagram.com',
  'facebook.com',
  't.me',
  'telegram.me',
  'wa.me',
  'whatsapp.com',
  'youtube.com',
  'youtu.be',
  'yandex.ru',
  'google.com',
]

function isTrustedDomain(href: string): boolean {
  try {
    const url = new URL(href)
    return TRUSTED_DOMAINS.some(domain => url.hostname.includes(domain))
  } catch {
    return false
  }
}

/**
 * Компонент для соцсетей (без nofollow)
 */
export function SocialLink({ href, children, ...props }: Omit<SafeLinkProps, 'nofollow'>) {
  return (
    <SafeLink href={href} nofollow={false} {...props}>
      {children}
    </SafeLink>
  )
}

