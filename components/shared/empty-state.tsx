import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  actionHref?: string
}

/**
 * Компонент пустого состояния
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="py-12">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 rounded-full bg-slate-100 p-6 dark:bg-slate-800">
            <Icon className="h-12 w-12 text-slate-400" />
          </div>
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription className="text-base">
              {description}
            </CardDescription>
          </CardHeader>
          {(actionLabel && (onAction || actionHref)) && (
            <CardFooter className="px-0 pb-0">
              {actionHref ? (
                <Button asChild>
                  <a href={actionHref}>{actionLabel}</a>
                </Button>
              ) : (
                <Button onClick={onAction}>{actionLabel}</Button>
              )}
            </CardFooter>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


