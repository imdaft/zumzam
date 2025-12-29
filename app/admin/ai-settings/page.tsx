'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Bot, 
  Plus, 
  Settings, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Loader2,
  Server,
  Cloud,
  Cpu,
  Zap,
  AlertTriangle,
  RefreshCw,
  Mic
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

// Типы
interface AIProvider {
  id: string
  provider: 'google' | 'openai' | 'anthropic' | 'ollama' | 'other'
  model_name: string
  api_key?: string
  base_url?: string
  model_type: 'chat' | 'embedding'
  is_active: boolean
  description?: string
  settings?: Record<string, unknown>
}

interface AITask {
  id: string
  task_key: string
  task_name: string
  task_description?: string
  ai_setting_id?: string
  fallback_ai_setting_id?: string
  is_enabled: boolean
}

interface STTSetting {
  id: string
  name: string
  provider: 'whisper' | 'gemini'
  is_active: boolean
  settings: Record<string, any>
}

const providerIcons = {
  google: Cloud,
  openai: Cloud,
  anthropic: Cloud,
  ollama: Server,
  other: Cpu,
}

const providerLabels = {
  google: 'Google Gemini',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  ollama: 'Ollama (локальный)',
  other: 'Другой',
}

export default function AISettingsPage() {
  const [providers, setProviders] = useState<AIProvider[]>([])
  const [tasks, setTasks] = useState<AITask[]>([])
  const [sttSettings, setSTTSettings] = useState<STTSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editProviderDraft, setEditProviderDraft] = useState<Partial<AIProvider>>({})
  const [testingProvider, setTestingProvider] = useState<string | null>(null)
  const [activatingSTT, setActivatingSTT] = useState<string | null>(null)

  // Форма нового провайдера
  const [newProvider, setNewProvider] = useState<Partial<AIProvider>>({
    provider: 'google',
    model_name: '',
    model_type: 'chat',
    is_active: false,
  })

  // Загрузка данных
  const loadData = useCallback(async () => {
    try {
      const [providersRes, tasksRes, sttRes] = await Promise.all([
        fetch('/api/admin/ai-settings/providers'),
        fetch('/api/admin/ai-settings/tasks'),
        fetch('/api/admin/stt-settings'),
      ])

      if (providersRes.ok) {
        const data = await providersRes.json()
        setProviders(data.providers || [])
      }

      if (tasksRes.ok) {
        const data = await tasksRes.json()
        setTasks(data.tasks || [])
      }

      if (sttRes.ok) {
        const data = await sttRes.json()
        setSTTSettings(data.settings || [])
      }
    } catch (error) {
      console.error('Error loading AI settings:', error)
      toast.error('Ошибка загрузки настроек')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Добавление провайдера
  const handleAddProvider = async () => {
    try {
      const res = await fetch('/api/admin/ai-settings/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProvider),
      })

      if (res.ok) {
        toast.success('Провайдер добавлен')
        setIsAddDialogOpen(false)
        setNewProvider({
          provider: 'google',
          model_name: '',
          model_type: 'chat',
          is_active: false,
        })
        loadData()
      } else {
        const error = await res.json()
        toast.error(error.message || error.error || 'Ошибка добавления')
      }
    } catch (error) {
      toast.error('Ошибка сети')
    }
  }

  const handleStartEditProvider = (provider: AIProvider) => {
    setEditingProvider(provider)
    // Не показываем текущий ключ в UI — оставляем поле пустым, чтобы при сохранении не перезатирать
    setEditProviderDraft({
      ...provider,
      api_key: '',
    })
    setIsEditDialogOpen(true)
  }

  const handleSaveProvider = async () => {
    if (!editingProvider) return

    try {
      const payload: Record<string, unknown> = {
        provider: editProviderDraft.provider,
        model_name: editProviderDraft.model_name,
        model_type: editProviderDraft.model_type,
        base_url: editProviderDraft.base_url,
        description: editProviderDraft.description,
        is_active: editProviderDraft.is_active,
        settings: editProviderDraft.settings,
      }

      // Если ключ не задан — не обновляем api_key, чтобы не затереть существующий
      const apiKey = (editProviderDraft.api_key || '').trim()
      if (apiKey.length > 0) payload.api_key = apiKey

      // Убираем undefined, чтобы не затирать поля
      Object.keys(payload).forEach((k) => {
        if (payload[k] === undefined) delete payload[k]
      })

      const res = await fetch(`/api/admin/ai-settings/providers/${editingProvider.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        toast.success('Провайдер обновлён')
        setIsEditDialogOpen(false)
        setEditingProvider(null)
        setEditProviderDraft({})
        loadData()
      } else {
        toast.error(data.message || data.error || 'Ошибка сохранения')
      }
    } catch (error) {
      toast.error('Ошибка сети')
    }
  }

  const handleCloseEdit = (open: boolean) => {
    setIsEditDialogOpen(open)
    if (!open) {
      setEditingProvider(null)
      setEditProviderDraft({})
    }
  }

  // Удаление провайдера
  const handleDeleteProvider = async (id: string) => {
    if (!confirm('Удалить провайдера?')) return

    try {
      const res = await fetch(`/api/admin/ai-settings/providers/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Провайдер удалён')
        loadData()
      }
    } catch (error) {
      toast.error('Ошибка удаления')
    }
  }

  // Тест провайдера
  const handleTestProvider = async (provider: AIProvider) => {
    setTestingProvider(provider.id)
    try {
      const res = await fetch('/api/admin/ai-settings/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: provider.id }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        toast.success(`✅ ${provider.model_name} работает! (${data.latency}ms)`)
      } else {
        toast.error(`❌ Ошибка: ${data.error}`)
      }
    } catch (error) {
      toast.error('Ошибка тестирования')
    } finally {
      setTestingProvider(null)
    }
  }

  // Активация STT провайдера
  const handleActivateSTT = async (id: string) => {
    try {
      setActivatingSTT(id)
      const res = await fetch('/api/admin/stt-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (!res.ok) {
        throw new Error('Failed to activate STT provider')
      }

      const data = await res.json()
      toast.success(`Активирован: ${data.setting.name}`)
      await loadData()
    } catch (error) {
      console.error('Error activating STT:', error)
      toast.error('Ошибка активации STT провайдера')
    } finally {
      setActivatingSTT(null)
    }
  }

  // Обновление задачи
  const handleUpdateTask = async (taskId: string, updates: Partial<AITask>) => {
    try {
      const res = await fetch(`/api/admin/ai-settings/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (res.ok) {
        toast.success('Настройки сохранены')
        loadData()
      }
    } catch (error) {
      toast.error('Ошибка сохранения')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Bot className="w-8 h-8 text-purple-600" />
            Настройки AI
          </h1>
          <p className="text-slate-600 mt-1">
            Управление провайдерами и моделями нейросетей
          </p>
        </div>
        <Button onClick={() => loadData()} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Обновить
        </Button>
      </div>

      {/* Провайдеры */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Провайдеры AI
            </CardTitle>
            <CardDescription>
              Подключённые API и локальные модели
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Добавить
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Добавить провайдера AI</DialogTitle>
                <DialogDescription>
                  Подключите новый API или локальную модель Ollama
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Провайдер</Label>
                  <Select
                    value={newProvider.provider}
                    onValueChange={(v) => setNewProvider({ ...newProvider, provider: v as AIProvider['provider'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ollama">🖥️ Ollama (локальный)</SelectItem>
                      <SelectItem value="google">☁️ Google Gemini</SelectItem>
                      <SelectItem value="openai">☁️ OpenAI</SelectItem>
                      <SelectItem value="anthropic">☁️ Anthropic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Название модели</Label>
                  <Input
                    placeholder={newProvider.provider === 'ollama' ? 'phi3:mini' : 'gemini-2.0-flash'}
                    value={newProvider.model_name || ''}
                    onChange={(e) => setNewProvider({ ...newProvider, model_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Тип модели</Label>
                  <Select
                    value={newProvider.model_type}
                    onValueChange={(v) => setNewProvider({ ...newProvider, model_type: v as 'chat' | 'embedding' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chat">💬 Генерация текста (Chat)</SelectItem>
                      <SelectItem value="embedding">🔢 Векторизация (Embedding)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newProvider.provider === 'ollama' ? (
                  <div className="space-y-2">
                    <Label>URL Ollama</Label>
                    <Input
                      placeholder="http://localhost:11434"
                      value={newProvider.base_url || ''}
                      onChange={(e) => setNewProvider({ ...newProvider, base_url: e.target.value })}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <Input
                      type="password"
                      placeholder="sk-..."
                      value={newProvider.api_key || ''}
                      onChange={(e) => setNewProvider({ ...newProvider, api_key: e.target.value })}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Описание (опционально)</Label>
                  <Input
                    placeholder="Для генерации FAQ ответов"
                    value={newProvider.description || ''}
                    onChange={(e) => setNewProvider({ ...newProvider, description: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-between gap-4 pt-2">
                  <div className="space-y-1">
                    <Label>Сделать активным</Label>
                    <p className="text-xs text-slate-500">
                      Активной может быть только одна модель одновременно
                    </p>
                  </div>
                  <Switch
                    checked={Boolean(newProvider.is_active)}
                    onCheckedChange={(checked) => setNewProvider({ ...newProvider, is_active: checked })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Отмена
                </Button>
                <Button onClick={handleAddProvider} disabled={!newProvider.model_name}>
                  Добавить
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {/* Диалог редактирования */}
          <Dialog open={isEditDialogOpen} onOpenChange={handleCloseEdit}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Редактировать провайдера</DialogTitle>
                <DialogDescription>
                  Измените параметры модели. API ключ можно оставить пустым — тогда он не изменится.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Провайдер</Label>
                  <Select
                    value={editProviderDraft.provider}
                    onValueChange={(v) =>
                      setEditProviderDraft((prev) => ({
                        ...prev,
                        provider: v as AIProvider['provider'],
                        // Если переключили на ollama — чистим API key, если на облако — чистим base_url
                        ...(v === 'ollama' ? { api_key: '', base_url: prev.base_url || '' } : { base_url: '', api_key: '' }),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ollama">🖥️ Ollama (локальный)</SelectItem>
                      <SelectItem value="google">☁️ Google Gemini</SelectItem>
                      <SelectItem value="openai">☁️ OpenAI</SelectItem>
                      <SelectItem value="anthropic">☁️ Anthropic</SelectItem>
                      <SelectItem value="other">⚙️ Другой</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Название модели</Label>
                  <Input
                    placeholder={editProviderDraft.provider === 'ollama' ? 'phi3:mini' : 'gemini-2.0-flash'}
                    value={editProviderDraft.model_name || ''}
                    onChange={(e) => setEditProviderDraft({ ...editProviderDraft, model_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Тип модели</Label>
                  <Select
                    value={editProviderDraft.model_type}
                    onValueChange={(v) =>
                      setEditProviderDraft({ ...editProviderDraft, model_type: v as 'chat' | 'embedding' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chat">💬 Генерация текста (Chat)</SelectItem>
                      <SelectItem value="embedding">🔢 Векторизация (Embedding)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {editProviderDraft.provider === 'ollama' ? (
                  <div className="space-y-2">
                    <Label>URL Ollama</Label>
                    <Input
                      placeholder="http://localhost:11434"
                      value={editProviderDraft.base_url || ''}
                      onChange={(e) => setEditProviderDraft({ ...editProviderDraft, base_url: e.target.value })}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>API Key (заменить)</Label>
                    <Input
                      type="password"
                      placeholder="Оставьте пустым, чтобы не менять"
                      value={editProviderDraft.api_key || ''}
                      onChange={(e) => setEditProviderDraft({ ...editProviderDraft, api_key: e.target.value })}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Описание (опционально)</Label>
                  <Input
                    placeholder="Для генерации FAQ ответов"
                    value={editProviderDraft.description || ''}
                    onChange={(e) => setEditProviderDraft({ ...editProviderDraft, description: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-between gap-4 pt-2">
                  <div className="space-y-1">
                    <Label>Активный</Label>
                    <p className="text-xs text-slate-500">
                      При включении активной эта модель заменит текущую активную
                    </p>
                  </div>
                  <Switch
                    checked={Boolean(editProviderDraft.is_active)}
                    onCheckedChange={(checked) => setEditProviderDraft({ ...editProviderDraft, is_active: checked })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => handleCloseEdit(false)}>
                  Отмена
                </Button>
                <Button onClick={handleSaveProvider} disabled={!editProviderDraft.model_name}>
                  Сохранить
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="space-y-3">
            {providers.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                Нет подключённых провайдеров
              </div>
            ) : (
              providers.map((provider) => {
                const Icon = providerIcons[provider.provider] || Cpu
                return (
                  <div
                    key={provider.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        provider.provider === 'ollama' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">
                            {provider.model_name}
                          </span>
                          <Badge variant={provider.is_active ? 'default' : 'secondary'}>
                            {provider.is_active ? 'Активен' : 'Отключён'}
                          </Badge>
                          <Badge variant="outline">
                            {(provider.model_type || 'chat') === 'chat' ? '💬 Chat' : '🔢 Embedding'}
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-500">
                          {providerLabels[provider.provider]}
                          {provider.base_url && ` • ${provider.base_url}`}
                          {provider.description && ` • ${provider.description}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStartEditProvider(provider)}
                        title="Редактировать"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestProvider(provider)}
                        disabled={testingProvider === provider.id}
                      >
                        {testingProvider === provider.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Zap className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteProvider(provider.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Маппинг задач */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="w-5 h-5" />
            Настройка задач
          </CardTitle>
          <CardDescription>
            Выберите какую модель использовать для каждой задачи
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-4 border rounded-xl"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{task.task_name}</span>
                    <Switch
                      checked={task.is_enabled}
                      onCheckedChange={(checked) => 
                        handleUpdateTask(task.id, { is_enabled: checked })
                      }
                    />
                  </div>
                  {task.task_description && (
                    <p className="text-sm text-slate-500 mt-1">{task.task_description}</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-48">
                    <Label className="text-xs text-slate-500">Основная модель</Label>
                    <Select
                      value={task.ai_setting_id || 'none'}
                      onValueChange={(v) => 
                        handleUpdateTask(task.id, { ai_setting_id: v === 'none' ? null : v } as Partial<AITask>)
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Не выбрано" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Не выбрано</SelectItem>
                        {providers.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.provider === 'ollama' ? '🖥️' : '☁️'} {p.model_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-48">
                    <Label className="text-xs text-slate-500">Fallback</Label>
                    <Select
                      value={task.fallback_ai_setting_id || 'none'}
                      onValueChange={(v) => 
                        handleUpdateTask(task.id, { fallback_ai_setting_id: v === 'none' ? null : v } as Partial<AITask>)
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Нет" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Нет</SelectItem>
                        {providers.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.provider === 'ollama' ? '🖥️' : '☁️'} {p.model_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Распознавание речи (STT) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-orange-500" />
            Распознавание речи (STT)
          </CardTitle>
          <CardDescription>
            Выберите провайдер для распознавания голосовых сообщений
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {sttSettings.map((setting) => {
              const isActive = setting.is_active
              const isActivating = activatingSTT === setting.id
              const Icon = setting.provider === 'whisper' ? Server : Cloud

              return (
                <div
                  key={setting.id}
                  className={`
                    relative p-4 border rounded-xl transition-all
                    ${isActive ? 'ring-2 ring-orange-500 bg-orange-50/50' : 'hover:bg-slate-50'}
                  `}
                >
                  {isActive && (
                    <Badge className="absolute top-2 right-2 bg-orange-500">
                      <Check className="w-3 h-3 mr-1" />
                      Активен
                    </Badge>
                  )}

                  <div className="flex items-start gap-4">
                    <div className={`
                      p-3 rounded-full shrink-0
                      ${isActive ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'}
                    `}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-slate-900">{setting.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {setting.provider === 'whisper' ? 'Локальный' : 'Облачный'}
                        </Badge>
                      </div>

                      <p className="text-sm text-slate-600 mb-3">
                        {setting.provider === 'whisper' 
                          ? 'Бесплатный. Работает без интернета. Медленнее (~10-15 сек).'
                          : 'Быстрый и точный (~2-3 сек). Требует API ключ.'}
                      </p>

                      <div className="flex items-center gap-6 text-xs text-slate-500">
                        {setting.provider === 'whisper' && (
                          <>
                            <div>
                              <span className="font-medium">Модель:</span> {setting.settings?.model || 'whisper-small'}
                            </div>
                            <div>
                              <span className="font-medium">Язык:</span> {setting.settings?.language || 'ru'}
                            </div>
                          </>
                        )}
                        {setting.provider === 'gemini' && (
                          <>
                            <div>
                              <span className="font-medium">Модель:</span> {setting.settings?.model || 'gemini-2.0-flash-exp'}
                            </div>
                            <div>
                              <span className="font-medium">Формат:</span> {setting.settings?.mimeType || 'audio/webm'}
                            </div>
                          </>
                        )}
                      </div>

                      {!isActive && (
                        <Button
                          size="sm"
                          onClick={() => handleActivateSTT(setting.id)}
                          disabled={isActivating}
                          className="mt-3"
                        >
                          {isActivating ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                              Активация...
                            </>
                          ) : (
                            <>
                              <Check className="w-3 h-3 mr-2" />
                              Использовать
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Совет:</strong> Для production рекомендуется Gemini (быстрее и точнее). Для разработки подойдет Whisper (бесплатно).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Подсказка */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">Рекомендации</p>
            <ul className="text-sm text-amber-700 mt-1 space-y-1">
              <li>• <strong>FAQ и поиск</strong> — используйте Ollama (phi3:mini) для экономии</li>
              <li>• <strong>Юридические документы</strong> — лучше API (Gemini) для качества</li>
              <li>• <strong>Fallback</strong> — настройте резервную модель на случай недоступности основной</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
