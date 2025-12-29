/**
 * JSON-LD Schema для отзывов
 * Schema.org Review
 */

interface ReviewSchemaProps {
  review: {
    id: string
    author_name: string
    rating: number
    comment: string
    created_at: string
  }
  itemReviewed: {
    name: string
    type?: string
  }
}

export function ReviewSchema({ review, itemReviewed }: ReviewSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Review",
    "itemReviewed": {
      "@type": itemReviewed.type || "LocalBusiness",
      "name": itemReviewed.name
    },
    "author": {
      "@type": "Person",
      "name": review.author_name
    },
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": review.rating,
      "bestRating": "5",
      "worstRating": "1"
    },
    "datePublished": review.created_at,
    "reviewBody": review.comment
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

