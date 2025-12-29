/**
 * JSON-LD Schema для FAQ (часто задаваемые вопросы)
 * Schema.org FAQPage
 */

interface FAQItem {
  question: string
  answer: string
}

interface FAQSchemaProps {
  faq: FAQItem[]
}

export function FAQSchema({ faq }: FAQSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faq.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

