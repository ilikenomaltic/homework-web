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
}

interface StoredPeriodInfo extends PeriodInfo {
  timestamp: number
}

function getPeriodKey(weekday: number, period: number): string {
  return `${weekday}-${period}`
}

function isValidPeriodInfoRecord(obj: unknown): obj is Record<string, StoredPeriodInfo> {
  return !!obj && typeof obj === 'object' && !Array.isArray(obj)
}

export function loadPeriodInfos(): Record<string, StoredPeriodInfo> {
  try {
    const raw = localStorage.getItem(PERIOD_INFO_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return isValidPeriodInfoRecord(parsed) ? parsed : {}
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

// ── 직접 추가 수업 ─────────────────────────────────────────────
const CUSTOM_CLASS_KEY = 'classroom-notifier-custom-classes'

export interface CustomClass {
  subject: string
  teacher?: string
  classroom?: string
}

export function loadCustomClasses(): Record<string, CustomClass> {
  try {
    const raw = localStorage.getItem(CUSTOM_CLASS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

export function saveCustomClass(weekday: number, period: number, cls: CustomClass): void {
  try {
    const all = loadCustomClasses()
    all[`${weekday}-${period}`] = cls
    localStorage.setItem(CUSTOM_CLASS_KEY, JSON.stringify(all))
  } catch {}
}

export function deleteCustomClass(weekday: number, period: number): void {
  try {
    const all = loadCustomClasses()
    delete all[`${weekday}-${period}`]
    localStorage.setItem(CUSTOM_CLASS_KEY, JSON.stringify(all))
    deletePeriodInfo(weekday, period)
  } catch {}
}

// ── 알레르기 설정 ──────────────────────────────────────────────
function isValidAllergyArray(obj: unknown): obj is number[] {
  return Array.isArray(obj) && obj.every(n => typeof n === 'number' && n >= 1 && n <= 18)
}

export function loadAllergies(): number[] {
  try {
    const raw = localStorage.getItem('allergies')
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return isValidAllergyArray(parsed) ? parsed : []
  } catch { return [] }
}

export function saveAllergies(codes: number[]): void {
  try {
    localStorage.setItem('allergies', JSON.stringify(codes))
  } catch {}
}
