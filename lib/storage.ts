import type { School } from './neis'

const KEY = 'classroom-notifier-settings'

export interface Settings {
  school: School
  grade: number
  classNum: number
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(KEY, JSON.stringify(settings))
}

export function loadSettings(): Settings | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as Settings
  } catch {
    return null
  }
}

export function clearSettings(): void {
  localStorage.removeItem(KEY)
}
