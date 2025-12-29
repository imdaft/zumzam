import { ReactNode } from 'react'

interface SectionConfig {
  id: string
  component: ReactNode
}

interface ProfileSectionsRendererProps {
  sectionOrder: string[]
  sections: SectionConfig[]
}

/**
 * Рендерит секции профиля в соответствии с заданным порядком
 */
export function ProfileSectionsRenderer({ sectionOrder, sections }: ProfileSectionsRendererProps) {
  // Создаем маппинг id -> component для быстрого доступа
  const sectionMap = new Map(sections.map(s => [s.id, s.component]))
  
  // Рендерим секции в порядке, указанном в sectionOrder
  return (
    <>
      {sectionOrder.map(id => {
        const component = sectionMap.get(id)
        return component ? <div key={id}>{component}</div> : null
      })}
    </>
  )
}


