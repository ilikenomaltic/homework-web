// ── 타입 ────────────────────────────────────────────────────────
export type SchoolLevel = 'elementary' | 'middle' | 'high'

export interface School {
  code: string      // SD_SCHUL_CODE
  name: string      // SCHUL_NM
  region: string    // ATPT_OFCDC_SC_CODE
  level: SchoolLevel
}

export interface TimetableEntry {
  period: number
  subject: string
}

export interface DayTimetable {
  weekday: number   // 1 = 월, 5 = 금
  entries: TimetableEntry[]
}

export interface CalendarEvent {
  id: string
  title: string
  startDate: string  // YYYY-MM-DD
  endDate: string    // YYYY-MM-DD
}

// ── 교시 시간표 ────────────────────────────────────────────────
export const PERIOD_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: '09:00', end: '09:50' },
  2: { start: '10:00', end: '10:50' },
  3: { start: '11:00', end: '11:50' },
  4: { start: '12:00', end: '12:50' },
  5: { start: '13:50', end: '14:40' },
  6: { start: '14:50', end: '15:40' },
  7: { start: '15:50', end: '16:40' },
  8: { start: '16:50', end: '17:30' },
}

// ── 유틸 함수 ──────────────────────────────────────────────────
export function parseSchoolLevel(kindName: string): SchoolLevel {
  if (kindName.includes('초등')) return 'elementary'
  if (kindName.includes('중학')) return 'middle'
  return 'high'
}

export function getTimetableEndpoint(level: SchoolLevel): string {
  const map: Record<SchoolLevel, string> = {
    elementary: 'elsTimetable',
    middle: 'misTimetable',
    high: 'hisTimetable',
  }
  return map[level]
}

export function formatNeisDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseSchoolFromNeis(row: Record<string, any>): School {
  return {
    code: row['SD_SCHUL_CODE'] ?? '',
    name: row['SCHUL_NM'] ?? '',
    region: row['ATPT_OFCDC_SC_CODE'] ?? '',
    level: parseSchoolLevel(row['SCHUL_KND_SC_NM'] ?? ''),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseTimetableRows(rows: Record<string, any>[], weekStart: Date): DayTimetable[] {
  const map: Record<number, TimetableEntry[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] }

  for (const row of rows) {
    const dateStr = row['ALL_TI_YMD']?.toString() ?? ''
    if (dateStr.length !== 8) continue
    const date = new Date(
      Number(dateStr.slice(0, 4)),
      Number(dateStr.slice(4, 6)) - 1,
      Number(dateStr.slice(6, 8)),
    )
    const weekday = date.getDay() // 0=일, 1=월 ... 6=토
    if (weekday < 1 || weekday > 5) continue

    const period = Number(row['PERIO'])
    const subject = row['ITRT_CNTNT']?.toString() ?? ''
    if (!period || !subject || subject === '0') continue

    map[weekday].push({ period, subject })
  }

  return Array.from({ length: 5 }, (_, i) => {
    const weekday = i + 1
    return {
      weekday,
      entries: (map[weekday] ?? []).sort((a, b) => a.period - b.period),
    }
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseScheduleRows(rows: Record<string, any>[]): CalendarEvent[] {
  return rows.map((row) => {
    const dateStr = row['AA_YMD']?.toString() ?? ''
    const date = dateStr.length === 8
      ? `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
      : ''
    return {
      id: `school_${dateStr}_${row['EVENT_NM']}`,
      title: row['EVENT_NM']?.toString() ?? '',
      startDate: date,
      endDate: date,
    }
  })
}
