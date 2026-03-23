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

// ── 과목 메모 ─────────────────────────────────────────────────
const MEMO_KEY = 'classroom-notifier-memos'

export function loadMemos(): Record<string, string> {
  try {
    const raw = localStorage.getItem(MEMO_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

export function saveMemo(subject: string, text: string): void {
  try {
    const memos = loadMemos()
    if (text.trim()) memos[subject] = text.trim()
    else delete memos[subject]
    localStorage.setItem(MEMO_KEY, JSON.stringify(memos))
  } catch {}
}

// ── 개인 일정 ─────────────────────────────────────────────────
const PERSONAL_KEY = 'classroom-notifier-personal-events'

export interface PersonalEvent {
  id: string
  title: string
  date: string   // YYYY-MM-DD
  note: string
}

export function loadPersonalEvents(): PersonalEvent[] {
  try {
    const raw = localStorage.getItem(PERSONAL_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function savePersonalEvents(events: PersonalEvent[]): void {
  try {
    localStorage.setItem(PERSONAL_KEY, JSON.stringify(events))
  } catch {}
}

// ── 교시별 상세 정보 ──────────────────────────────────────────
const PERIOD_INFO_KEY = 'classroom-notifier-period-info'

export interface PeriodInfo {
  teacher?: string
  classroom?: string
  memo?: string
  timestamp?: number
}

function getPeriodKey(weekday: number, period: number): string {
  return `${weekday}-${period}`
}

export function loadPeriodInfos(): Record<string, PeriodInfo> {
  try {
    const raw = localStorage.getItem(PERIOD_INFO_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

export function savePeriodInfo(weekday: number, period: number, info: PeriodInfo): void {
  try {
    const all = loadPeriodInfos()
    const key = getPeriodKey(weekday, period)
    const isEmpty = !info.teacher?.trim() && !info.classroom?.trim() && !info.memo?.trim()
    if (isEmpty) {
      delete all[key]
    } else {
      all[key] = { ...info, timestamp: Date.now() }
    }
    localStorage.setItem(PERIOD_INFO_KEY, JSON.stringify(all))
  } catch {}
}

export function deletePeriodInfo(weekday: number, period: number): void {
  try {
    const all = loadPeriodInfos()
    delete all[getPeriodKey(weekday, period)]
    localStorage.setItem(PERIOD_INFO_KEY, JSON.stringify(all))
  } catch {}
}
