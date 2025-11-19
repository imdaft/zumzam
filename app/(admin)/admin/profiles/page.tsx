'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'
import { useUser } from '@/lib/hooks/useUser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import Image from 'next/image'

/**
 * Модерация профилей
 */
export default function AdminProfilesPage() {
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const [profiles, setProfiles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login')
    }
  }, [user, userLoading, router])

  useEffect(() => {
    if (user) {
      loadProfiles()
    }
  }, [user])

  const loadProfiles = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/profiles')
      const data = await response.json()
      setProfiles(data.profiles || [])
    } catch (error) {
      console.error('Load profiles error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async (profileId: string, verified: boolean) => {
    try {
      const response = await fetch(`/api/profiles/${profileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified }),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      toast.success(verified ? 'Профиль верифицирован! ✓' : 'Верификация снята')
      loadProfiles()
    } catch (error: any) {
      toast.error('Ошибка', { description: error.message })
    }
  }

  if (userLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const verifiedProfiles = profiles.filter(p => p.verified)
  const unverifiedProfiles = profiles.filter(p => !p.verified)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Модерация профилей</h1>
        <p className="text-muted-foreground mt-2">
          Верификация студий и аниматоров
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Всего
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profiles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Верифицировано
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {verifiedProfiles.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ожидают
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {unverifiedProfiles.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="unverified">
        <TabsList>
          <TabsTrigger value="unverified">
            Ожидают ({unverifiedProfiles.length})
          </TabsTrigger>
          <TabsTrigger value="verified">
            Верифицированы ({verifiedProfiles.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            Все ({profiles.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unverified" className="space-y-4 mt-6">
          {unverifiedProfiles.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Нет профилей ожидающих верификации
                </p>
              </CardContent>
            </Card>
          ) : (
            unverifiedProfiles.map((profile) => (
              <ProfileCard 
                key={profile.id} 
                profile={profile} 
                onVerify={handleVerify}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="verified" className="space-y-4 mt-6">
          {verifiedProfiles.map((profile) => (
            <ProfileCard 
              key={profile.id} 
              profile={profile} 
              onVerify={handleVerify}
            />
          ))}
        </TabsContent>

        <TabsContent value="all" className="space-y-4 mt-6">
          {profiles.map((profile) => (
            <ProfileCard 
              key={profile.id} 
              profile={profile} 
              onVerify={handleVerify}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ProfileCard({ 
  profile, 
  onVerify 
}: { 
  profile: any
  onVerify: (id: string, verified: boolean) => void
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            {profile.avatar_url && (
              <Image
                src={profile.avatar_url}
                alt={profile.display_name}
                width={64}
                height={64}
                className="rounded-lg"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg">
                  {profile.display_name}
                </h3>
                {profile.verified && (
                  <Badge className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Верифицирован
                  </Badge>
                )}
              </div>
              
              {profile.bio && (
                <p className="text-sm text-muted-foreground mb-2">
                  {profile.bio}
                </p>
              )}

              <div className="flex flex-wrap gap-2 text-sm">
                {profile.city && (
                  <Badge variant="outline">{profile.city}</Badge>
                )}
                {profile.email && (
                  <Badge variant="outline">{profile.email}</Badge>
                )}
                {profile.phone && (
                  <Badge variant="outline">{profile.phone}</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {profile.verified ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onVerify(profile.id, false)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Снять верификацию
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => onVerify(profile.id, true)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Верифицировать
              </Button>
            )}
            
            <Button variant="outline" size="sm" asChild>
              <a href={`/profiles/${profile.slug}`} target="_blank">
                Просмотр
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


