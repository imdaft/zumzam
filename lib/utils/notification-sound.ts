'use client'

/**
 * Простой звук уведомления (WebAudio) без внешних зависимостей.
 *
 * Важно: большинство браузеров блокируют звук, пока пользователь не сделает
 * жест (клик/тап/клавиша). Поэтому:
 * - initNotificationSound() ставит "разблокировку" на первый жест
 * - playNotificationSound() молча ничего не делает, пока звук не разблокирован
 */

let audioCtx: AudioContext | null = null
let unlocked = false

function ensureContext() {
  if (audioCtx) return audioCtx
  const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined
  if (!Ctx) return null
  audioCtx = new Ctx()
  return audioCtx
}

function unlockOnce() {
  if (unlocked) return
  const ctx = ensureContext()
  if (!ctx) return

  // Попытка resume() обязательна на некоторых браузерах
  ctx.resume().catch(() => {})
  unlocked = true
}

export function initNotificationSound() {
  if (typeof window === 'undefined') return

  // Уже настроено/разблокировано
  if (unlocked) return

  const onFirstGesture = () => {
    unlockOnce()
    window.removeEventListener('pointerdown', onFirstGesture)
    window.removeEventListener('keydown', onFirstGesture)
    window.removeEventListener('touchstart', onFirstGesture)
  }

  window.addEventListener('pointerdown', onFirstGesture, { once: true })
  window.addEventListener('keydown', onFirstGesture, { once: true })
  window.addEventListener('touchstart', onFirstGesture, { once: true })
}

type SoundKind = 'notification' | 'message'

export function playNotificationSound(kind: SoundKind = 'notification') {
  if (typeof window === 'undefined') return
  if (!unlocked) return

  const ctx = ensureContext()
  if (!ctx) return

  // Небольшой "дзынь": разные частоты для сообщений/уведомлений
  const baseFreq = kind === 'message' ? 740 : 880

  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'sine'
  osc.frequency.setValueAtTime(baseFreq, now)

  // Envelope: быстро вверх/вниз, чтобы не раздражало
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.06, now + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18)

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.start(now)
  osc.stop(now + 0.2)
}







