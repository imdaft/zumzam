'use client'

/**
 * Админка: Пользователи
 */

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface User {
  id: string
  email: string
  role: 'client' | 'provider' | 'admin'
  first_name?: string | null
  last_name?: string | null
  created_at: string
  profiles?: Array<{ id: string; display_name: string | null }>
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editRole, setEditRole] = useState<'client' | 'provider' | 'admin'>('client')

  useEffect(() => {
    fetchUsers()
  }, [page, roleFilter])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' })
      if (roleFilter !== 'all') params.append('role', roleFilter)
      if (search.trim()) params.append('search', search.trim())

      const response = await fetch(`/api/admin/users?${params}`)
      if (!response.ok) throw new Error('Failed')

      const data = await response.json()
      setUsers(data.users)
      setTotalPages(data.pagination.totalPages)
    } catch (error) {
      toast.error('Ошибка загрузки')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchUsers()
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setEditRole(user.role)
    setIsEditDialogOpen(true)
  }

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  const saveUserRole = async () => {
    if (!selectedUser) return
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editRole }),
      })
      if (!response.ok) throw new Error('Failed')
      toast.success('Роль обновлена')
      setIsEditDialogOpen(false)
      fetchUsers()
    } catch {
      toast.error('Ошибка')
    }
  }

  const deleteUser = async () => {
    if (!selectedUser) return
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed')
      toast.success('Удалён')
      setIsDeleteDialogOpen(false)
      fetchUsers()
    } catch {
      toast.error('Ошибка')
    }
  }

  const roleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'админ'
      case 'provider': return 'исполнитель'
      default: return 'клиент'
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4">Пользователи</h1>

      {/* Фильтры */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Input
          placeholder="Поиск по email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1"
        />
        <Button onClick={handleSearch} variant="outline" className="w-full sm:w-auto">
          Найти
        </Button>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все роли</SelectItem>
            <SelectItem value="client">Клиенты</SelectItem>
            <SelectItem value="provider">Исполнители</SelectItem>
            <SelectItem value="admin">Админы</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Таблица - десктоп */}
      <div className="hidden md:block bg-white border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
            Загрузка...
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-gray-500">Пользователи не найдены</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-sm text-gray-600">
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium w-32">Роль</th>
                <th className="px-4 py-3 font-medium w-24 text-center">Профили</th>
                <th className="px-4 py-3 font-medium w-32">Дата</th>
                <th className="px-4 py-3 font-medium w-28 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{user.email}</div>
                    {(user.first_name || user.last_name) && (
                      <div className="text-sm text-gray-500">{[user.first_name, user.last_name].filter(Boolean).join(' ')}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded text-sm ${
                      user.role === 'admin' ? 'bg-red-100 text-red-700' :
                      user.role === 'provider' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {roleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {user.profiles?.length || 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/users/${user.id}`} className="text-blue-600 hover:underline mr-3">
                      Открыть
                    </Link>
                    <button onClick={() => handleEditUser(user)} className="text-gray-500 hover:text-gray-700 mr-2">
                      ✎
                    </button>
                    <button onClick={() => handleDeleteUser(user)} className="text-red-500 hover:text-red-700">
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Карточки - мобайл */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
            Загрузка...
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-gray-500">Пользователи не найдены</div>
        ) : (
          users.map((user) => (
            <div key={user.id} className="bg-white border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{user.email}</div>
                  {(user.first_name || user.last_name) && (
                    <div className="text-sm text-gray-500 mt-0.5">{[user.first_name, user.last_name].filter(Boolean).join(' ')}</div>
                  )}
                </div>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ml-2 ${
                  user.role === 'admin' ? 'bg-red-100 text-red-700' :
                  user.role === 'provider' ? 'bg-purple-100 text-purple-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {roleLabel(user.role)}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <span>Профили: {user.profiles?.length || 0}</span>
                <span>·</span>
                <span>{formatDate(user.created_at)}</span>
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/users/${user.id}`} className="flex-1">
                  <Button variant="outline" className="w-full" size="sm">
                    Открыть
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                  ✎
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user)} className="text-red-500 hover:text-red-700">
                  ×
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            ← Назад
          </Button>
          <span className="text-sm text-gray-500">Страница {page} из {totalPages}</span>
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Вперёд →
          </Button>
        </div>
      )}

      {/* Диалог изменения роли */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Изменить роль</DialogTitle>
            <DialogDescription>{selectedUser?.email}</DialogDescription>
          </DialogHeader>
          <Select value={editRole} onValueChange={(v: any) => setEditRole(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="client">Клиент</SelectItem>
              <SelectItem value="provider">Исполнитель</SelectItem>
              <SelectItem value="admin">Администратор</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Отмена</Button>
            <Button onClick={saveUserRole}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог удаления */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить пользователя?</DialogTitle>
            <DialogDescription>Это действие необратимо. Пользователь: {selectedUser?.email}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Отмена</Button>
            <Button variant="destructive" onClick={deleteUser}>Удалить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
