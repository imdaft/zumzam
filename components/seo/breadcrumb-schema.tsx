/**
 * JSON-LD Schema для хлебных крошек (навигация)
 * Schema.org BreadcrumbList
 */

interface BreadcrumbItem {
  label: string
  href: string
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[]
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zumzam.ru'
  
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      "item": `${baseUrl}${item.href}`
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

/**
 * Визуальный компонент хлебных крошек
 */
export function Breadcrumbs({ items }: BreadcrumbSchemaProps) {
  return (
    <>
      <BreadcrumbSchema items={items} />
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex items-center gap-2 text-sm text-slate-600">
          {items.map((item, index) => (
            <li key={index} className="flex items-center gap-2">
              {index > 0 && <span className="text-slate-400">/</span>}
              {index === items.length - 1 ? (
                <span className="font-medium text-slate-900">{item.label}</span>
              ) : (
                <a 
                  href={item.href}
                  className="hover:text-primary transition-colors"
                >
                  {item.label}
                </a>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  )
}

