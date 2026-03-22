import type { School } from './neis'

const KEY = 'classroom-notifier-settings'

export interface Settings {
  school: School
  grade: number
  classNum: number
}

function isValidSettings(obj: unknown): obj is Settings {
  if (!obj || typeof obj !== 'object') return false
  const s = obj as Record<string, unknown>
  return (
    typeof s.grade === 'number' &&
    typeof s.classNum === 'number' &&
    typeof s.school === 'object' &&
    s.school !== null &&
    typeof (s.school as Record<string, unknown>).code === 'string' &&
    typeof (s.school as Record<string, unknown>).name === 'string' &&
    typeof (s.school as Record<string, unknown>).region === 'string' &&
    typeof (s.school as Record<string, unknown>).level === 'string'
  )
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings))
  } catch {
    // QuotaExceededError 등 무시
  }
}

export function loadSettings(): Settings | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return isValidSettings(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function clearSettings(): void {
  localStorage.removeItem(KEY)
}
