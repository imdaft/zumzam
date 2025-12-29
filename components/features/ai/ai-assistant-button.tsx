'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AIAssistantModal } from './ai-assistant-modal'

interface AIAssistantButtonProps {
  type: 'short' | 'long'
  currentText: string
  profileType: string
  profileName: string
  category: string
  existingData?: {
    shortDescription?: string
    longDescription?: string
    services?: string[]
    address?: string
    features?: string[]
  }
  onGenerated: (description: string) => void
  className?: string
}

export function AIAssistantButton({
  type,
  currentText,
  profileType,
  profileName,
  category,
  existingData,
  onGenerated,
  className = ''
}: AIAssistantButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        className={`gap-2 rounded-xl border-purple-200 hover:border-purple-300 hover:bg-purple-50 text-purple-600 hover:text-purple-700 ${className}`}
      >
        <Sparkles className="h-4 w-4" />
        AI
      </Button>

      <AIAssistantModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        type={type}
        currentText={currentText}
        profileName={profileName}
        category={category}
        profileType={profileType}
        existingData={existingData}
        onGenerated={onGenerated}
      />
    </>
  )
}




