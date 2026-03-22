# 교실 알리미 웹 버전 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Flutter 교실 알리미 앱과 동일한 기능(학교 검색, 주간 시간표, 학사일정)을 Next.js 웹사이트로 구현해 Vercel에 배포한다.

**Architecture:** Next.js 14 App Router 기반. `/api/neis/*` API Routes가 NEIS API를 서버사이드에서 호출해 CORS를 우회한다. 학교/학년/반 설정은 localStorage에 저장한다.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Jest (유틸 테스트), Vercel 배포

---

## 파일 구조 (전체)

```
homework-web/
├── app/
│   ├── layout.tsx                    # 루트 레이아웃 + 하단 탭바 포함
│   ├── page.tsx                      # 온보딩 (학교 검색 → 학년/반 → 시작)
│   ├── timetable/page.tsx            # 주간 시간표
│   ├── calendar/page.tsx             # 월별 캘린더 + 학사일정
│   ├── settings/page.tsx             # 설정 + JSON 뷰어
│   └── api/neis/
│       ├── school/route.ts           # GET /api/neis/school?q=
│       ├── timetable/route.ts        # GET /api/neis/timetable?...
│       └── schedule/route.ts         # GET /api/neis/schedule?...
├── components/
│   ├── BottomNav.tsx                 # 하단 탭바 (시간표|캘린더|설정)
│   ├── PeriodCard.tsx                # 교시 카드 (과목명 + 시간 + 상태)
│   ├── WeekdayTabs.tsx               # 요일 탭 (월~금)
│   ├── MonthCalendar.tsx             # 월별 캘린더 그리드
│   └── JsonViewer.tsx                # JSON 원본 보기 토글 패널
├── lib/
│   ├── neis.ts                       # NEIS API 타입 정의 + 파싱 유틸
│   └── storage.ts                    # localStorage 헬퍼
├── __tests__/
│   ├── neis.test.ts                  # lib/neis.ts 유닛 테스트
│   └── storage.test.ts               # lib/storage.ts 유닛 테스트
├── .env.local                        # NEIS_API_KEY (gitignore)
├── jest.config.ts
└── jest.setup.ts
```

---

## Task 1: Next.js 프로젝트 초기화

**Files:**
- Create: `homework-web/` 전체 Next.js 프로젝트 스캐폴드
- Create: `.env.local`
- Create: `.gitignore` 에 `.env.local` 추가

- [ ] **Step 1: Next.js 프로젝트 생성**

```bash
cd /home/hyeonjae/homework-web
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --src-dir=no \
  --import-alias="@/*" \
  --no-eslint
```

프롬프트가 뜨면 전부 기본값(Enter)으로 진행.

- [ ] **Step 2: Jest 설치**

```bash
cd /home/hyeonjae/homework-web
npm install -D jest @types/jest ts-jest jest-environment-jsdom
```

- [ ] **Step 3: jest.config.ts 생성**

`homework-web/jest.config.ts`:
```typescript
import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

export default config
```

- [ ] **Step 4: jest.setup.ts 생성**

`homework-web/jest.setup.ts`:
```typescript
// localStorage mock은 jsdom이 자동 제공
```

- [ ] **Step 5: .env.local 생성**

`homework-web/.env.local`:
```
NEIS_API_KEY=여기에_나이스_API_키_입력
```

> NEIS API 키: https://open.neis.go.kr/portal/guide/apiRegisterGuide.do 에서 발급

- [ ] **Step 6: .gitignore에 .env.local 추가 확인**

```bash
grep ".env.local" /home/hyeonjae/homework-web/.gitignore || echo ".env.local" >> /home/hyeonjae/homework-web/.gitignore
```

- [ ] **Step 7: 개발 서버 동작 확인**

```bash
cd /home/hyeonjae/homework-web
npm run dev
```

브라우저에서 `http://localhost:3000` 접속 → Next.js 기본 페이지 확인

- [ ] **Step 8: 커밋**

```bash
cd /home/hyeonjae/homework-web
git add -A
git commit -m "feat: init Next.js 14 project with TypeScript + Tailwind + Jest"
```

---

## Task 2: NEIS 타입 + 파싱 유틸 (lib/neis.ts)

**Files:**
- Create: `lib/neis.ts`
- Create: `__tests__/neis.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`homework-web/__tests__/neis.test.ts`:
```typescript
import {
  parseSchoolLevel,
  parseSchoolFromNeis,
  parseTimetableRows,
  parseScheduleRows,
  getTimetableEndpoint,
  formatNeisDate,
  PERIOD_TIMES,
} from '@/lib/neis'

describe('parseSchoolLevel', () => {
  it('초등학교 → elementary', () => {
    expect(parseSchoolLevel('초등학교')).toBe('elementary')
  })
  it('중학교 → middle', () => {
    expect(parseSchoolLevel('중학교')).toBe('middle')
  })
  it('고등학교 → high', () => {
    expect(parseSchoolLevel('고등학교')).toBe('high')
  })
})

describe('parseSchoolFromNeis', () => {
  it('NEIS schoolInfo row → School 객체', () => {
    const row = {
      SD_SCHUL_CODE: '7430310',
      SCHUL_NM: '경기북과학고등학교',
      ATPT_OFCDC_SC_CODE: 'J10',
      SCHUL_KND_SC_NM: '고등학교',
    }
    const school = parseSchoolFromNeis(row)
    expect(school.code).toBe('7430310')
    expect(school.name).toBe('경기북과학고등학교')
    expect(school.region).toBe('J10')
    expect(school.level).toBe('high')
  })
})

describe('getTimetableEndpoint', () => {
  it('high → hisTimetable', () => {
    expect(getTimetableEndpoint('high')).toBe('hisTimetable')
  })
  it('middle → misTimetable', () => {
    expect(getTimetableEndpoint('middle')).toBe('misTimetable')
  })
  it('elementary → elsTimetable', () => {
    expect(getTimetableEndpoint('elementary')).toBe('elsTimetable')
  })
})

describe('formatNeisDate', () => {
  it('Date → YYYYMMDD 문자열', () => {
    expect(formatNeisDate(new Date('2026-03-23'))).toBe('20260323')
  })
})

describe('parseTimetableRows', () => {
  it('NEIS rows → DayTimetable 배열 (5일)', () => {
    const rows = [
      { ALL_TI_YMD: '20260323', PERIO: '1', ITRT_CNTNT: '국어' },
      { ALL_TI_YMD: '20260323', PERIO: '2', ITRT_CNTNT: '수학' },
      { ALL_TI_YMD: '20260324', PERIO: '1', ITRT_CNTNT: '영어' },
    ]
    const weekStart = new Date('2026-03-23') // 월요일
    const result = parseTimetableRows(rows, weekStart)
    expect(result).toHaveLength(5)
    expect(result[0].weekday).toBe(1)
    expect(result[0].entries).toHaveLength(2)
    expect(result[0].entries[0].subject).toBe('국어')
    expect(result[1].entries[0].subject).toBe('영어')
  })
})

describe('parseScheduleRows', () => {
  it('NEIS rows → CalendarEvent 배열', () => {
    const rows = [
      { AA_YMD: '20260325', EVENT_NM: '중간고사' },
    ]
    const result = parseScheduleRows(rows)
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('중간고사')
    expect(result[0].startDate).toBe('2026-03-25')
  })
})

describe('PERIOD_TIMES', () => {
  it('1교시 시작 09:00', () => {
    expect(PERIOD_TIMES[1].start).toBe('09:00')
    expect(PERIOD_TIMES[1].end).toBe('09:50')
  })
  it('5교시 시작 13:50 (점심 이후)', () => {
    expect(PERIOD_TIMES[5].start).toBe('13:50')
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd /home/hyeonjae/homework-web
npx jest __tests__/neis.test.ts 2>&1 | head -20
```

Expected: FAIL (모듈 없음)

- [ ] **Step 3: lib/neis.ts 구현**

`homework-web/lib/neis.ts`:
```typescript
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
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd /home/hyeonjae/homework-web
npx jest __tests__/neis.test.ts
```

Expected: PASS (7 suites)

- [ ] **Step 5: 커밋**

```bash
cd /home/hyeonjae/homework-web
git add lib/neis.ts __tests__/neis.test.ts
git commit -m "feat: add NEIS types and parsing utilities with tests"
```

---

## Task 3: localStorage 헬퍼 (lib/storage.ts)

**Files:**
- Create: `lib/storage.ts`
- Create: `__tests__/storage.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`homework-web/__tests__/storage.test.ts`:
```typescript
import { saveSettings, loadSettings, clearSettings } from '@/lib/storage'
import type { School } from '@/lib/neis'

const mockSchool: School = {
  code: '7430310',
  name: '경기북과학고등학교',
  region: 'J10',
  level: 'high',
}

beforeEach(() => {
  localStorage.clear()
})

describe('saveSettings / loadSettings', () => {
  it('설정 저장 후 불러오기', () => {
    saveSettings({ school: mockSchool, grade: 2, classNum: 2 })
    const loaded = loadSettings()
    expect(loaded?.school.code).toBe('7430310')
    expect(loaded?.grade).toBe(2)
    expect(loaded?.classNum).toBe(2)
  })

  it('저장값 없으면 null 반환', () => {
    expect(loadSettings()).toBeNull()
  })
})

describe('clearSettings', () => {
  it('삭제 후 null 반환', () => {
    saveSettings({ school: mockSchool, grade: 1, classNum: 1 })
    clearSettings()
    expect(loadSettings()).toBeNull()
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npx jest __tests__/storage.test.ts 2>&1 | head -10
```

Expected: FAIL

- [ ] **Step 3: lib/storage.ts 구현**

`homework-web/lib/storage.ts`:
```typescript
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
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx jest __tests__/storage.test.ts
```

Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add lib/storage.ts __tests__/storage.test.ts
git commit -m "feat: add localStorage settings helper with tests"
```

---

## Task 4: API Route — 학교 검색

**Files:**
- Create: `app/api/neis/school/route.ts`

- [ ] **Step 1: route.ts 작성**

`homework-web/app/api/neis/school/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { parseSchoolFromNeis } from '@/lib/neis'

const BASE = 'https://open.neis.go.kr/hub'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json({ schools: [] })
  }

  const params = new URLSearchParams({
    KEY: process.env.NEIS_API_KEY ?? '',
    Type: 'json',
    pIndex: '1',
    pSize: '20',
    SCHUL_NM: q,
  })

  const res = await fetch(`${BASE}/schoolInfo?${params}`)
  const body = await res.json()

  const rows: Record<string, string>[] = body?.schoolInfo?.[1]?.row ?? []
  const schools = rows
    .map(parseSchoolFromNeis)
    .filter((s) => s.code)

  return NextResponse.json({ schools })
}
```

- [ ] **Step 2: 동작 확인 (curl)**

개발 서버 실행 중인 상태에서:
```bash
curl "http://localhost:3000/api/neis/school?q=경기북과학" | python3 -m json.tool
```

Expected: `{"schools": [{"code": "7430310", "name": "경기북과학고등학교", ...}]}`

- [ ] **Step 3: 커밋**

```bash
git add app/api/neis/school/route.ts
git commit -m "feat: add NEIS school search API route"
```

---

## Task 5: API Route — 시간표

**Files:**
- Create: `app/api/neis/timetable/route.ts`

- [ ] **Step 1: route.ts 작성**

`homework-web/app/api/neis/timetable/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getTimetableEndpoint, parseTimetableRows, formatNeisDate } from '@/lib/neis'
import type { SchoolLevel } from '@/lib/neis'

const BASE = 'https://open.neis.go.kr/hub'

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  const region = p.get('region') ?? ''
  const code = p.get('code') ?? ''
  const grade = p.get('grade') ?? ''
  const classNum = p.get('class') ?? ''
  const from = p.get('from') ?? ''
  const to = p.get('to') ?? ''
  const level = (p.get('level') ?? 'high') as SchoolLevel

  if (!region || !code || !grade || !classNum || !from || !to) {
    return NextResponse.json({ error: 'missing params' }, { status: 400 })
  }

  const endpoint = getTimetableEndpoint(level)
  const params = new URLSearchParams({
    KEY: process.env.NEIS_API_KEY ?? '',
    Type: 'json',
    pIndex: '1',
    pSize: '100',
    ATPT_OFCDC_SC_CODE: region,
    SD_SCHUL_CODE: code,
    AY: from.slice(0, 4),
    SEM: Number(from.slice(4, 6)) <= 7 ? '1' : '2',
    ALL_TI_YMD_FROM: from,
    ALL_TI_YMD_TO: to,
    GRADE: grade,
    CLASS_NM: classNum,
  })

  const res = await fetch(`${BASE}/${endpoint}?${params}`)
  const body = await res.json()

  // INFO-200 = 데이터 없음
  if (body?.RESULT?.CODE === 'INFO-200') {
    return NextResponse.json({ timetable: Array.from({ length: 5 }, (_, i) => ({ weekday: i + 1, entries: [] })) })
  }

  const rows: Record<string, string>[] = body?.[endpoint]?.[1]?.row ?? []
  const weekStart = new Date(
    Number(from.slice(0, 4)),
    Number(from.slice(4, 6)) - 1,
    Number(from.slice(6, 8)),
  )
  const timetable = parseTimetableRows(rows, weekStart)

  return NextResponse.json({ timetable, raw: body })
}
```

- [ ] **Step 2: 동작 확인 (curl)**

```bash
# 이번 주 월요일 날짜로 조정해서 실행
curl "http://localhost:3000/api/neis/timetable?region=J10&code=7430310&grade=2&class=2&from=20260323&to=20260327&level=high" | python3 -m json.tool
```

Expected: `{"timetable": [...], "raw": {...}}`

- [ ] **Step 3: 커밋**

```bash
git add app/api/neis/timetable/route.ts
git commit -m "feat: add NEIS timetable API route with school level branching"
```

---

## Task 6: API Route — 학사일정

**Files:**
- Create: `app/api/neis/schedule/route.ts`

- [ ] **Step 1: route.ts 작성**

`homework-web/app/api/neis/schedule/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { parseScheduleRows } from '@/lib/neis'

const BASE = 'https://open.neis.go.kr/hub'

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  const region = p.get('region') ?? ''
  const code = p.get('code') ?? ''
  const from = p.get('from') ?? ''
  const to = p.get('to') ?? ''

  if (!region || !code || !from || !to) {
    return NextResponse.json({ error: 'missing params' }, { status: 400 })
  }

  const params = new URLSearchParams({
    KEY: process.env.NEIS_API_KEY ?? '',
    Type: 'json',
    pIndex: '1',
    pSize: '100',
    ATPT_OFCDC_SC_CODE: region,
    SD_SCHUL_CODE: code,
    AA_YMD_FROM: from,
    AA_YMD_TO: to,
  })

  const res = await fetch(`${BASE}/SchoolSchedule?${params}`)
  const body = await res.json()

  if (body?.RESULT?.CODE === 'INFO-200') {
    return NextResponse.json({ events: [], raw: body })
  }

  const rows: Record<string, string>[] = body?.SchoolSchedule?.[1]?.row ?? []
  const events = parseScheduleRows(rows)

  return NextResponse.json({ events, raw: body })
}
```

- [ ] **Step 2: 동작 확인**

```bash
curl "http://localhost:3000/api/neis/schedule?region=J10&code=7430310&from=20260301&to=20260331" | python3 -m json.tool
```

- [ ] **Step 3: 커밋**

```bash
git add app/api/neis/schedule/route.ts
git commit -m "feat: add NEIS school schedule API route"
```

---

## Task 7: 글로벌 레이아웃 + 하단 탭바

**Files:**
- Modify: `app/layout.tsx`
- Create: `components/BottomNav.tsx`

- [ ] **Step 1: BottomNav 컴포넌트 작성**

`homework-web/components/BottomNav.tsx`:
```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/timetable', label: '시간표', icon: '📅' },
  { href: '/calendar', label: '캘린더', icon: '🗓' },
  { href: '/settings', label: '설정', icon: '⚙️' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur border-t border-gray-200 flex z-50">
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 flex flex-col items-center py-2 text-xs gap-0.5 ${
              active ? 'text-blue-500' : 'text-gray-400'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 2: app/layout.tsx 수정**

`homework-web/app/layout.tsx`:
```tsx
import type { Metadata } from 'next'
import './globals.css'
import BottomNav from '@/components/BottomNav'

export const metadata: Metadata = {
  title: '교실 알리미',
  description: '학교 시간표 + 학사일정 알리미',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-[#f2f2f7] min-h-screen pb-16">
        {children}
        <BottomNav />
      </body>
    </html>
  )
}
```

- [ ] **Step 3: 브라우저 확인**

`http://localhost:3000/timetable` 접속 → 하단에 탭바 3개 표시 확인

- [ ] **Step 4: 커밋**

```bash
git add app/layout.tsx components/BottomNav.tsx
git commit -m "feat: add root layout with iOS-style bottom tab bar"
```

---

## Task 8: 온보딩 페이지 (/)

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: app/page.tsx 작성**

`homework-web/app/page.tsx`:
```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { loadSettings, saveSettings } from '@/lib/storage'
import type { School } from '@/lib/neis'

export default function OnboardingPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [schools, setSchools] = useState<School[]>([])
  const [selected, setSelected] = useState<School | null>(null)
  const [grade, setGrade] = useState('')
  const [classNum, setClassNum] = useState('')
  const [loading, setLoading] = useState(false)

  // 이미 설정된 경우 바로 시간표로
  useEffect(() => {
    if (loadSettings()) router.replace('/timetable')
  }, [router])

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setSchools([]); return }
    setLoading(true)
    const res = await fetch(`/api/neis/school?q=${encodeURIComponent(q)}`)
    const data = await res.json()
    setSchools(data.schools ?? [])
    setLoading(false)
  }, [])

  // 디바운스 300ms
  useEffect(() => {
    const t = setTimeout(() => search(query), 300)
    return () => clearTimeout(t)
  }, [query, search])

  function handleStart() {
    if (!selected || !grade || !classNum) return
    saveSettings({ school: selected, grade: Number(grade), classNum: Number(classNum) })
    router.push('/timetable')
  }

  return (
    <div className="max-w-md mx-auto p-4 pt-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">교실 알리미</h1>
      <p className="text-sm text-gray-500 mb-6">학교를 검색해서 시작하세요</p>

      {/* 학교 검색 */}
      <div className="mb-4">
        <input
          className="w-full bg-white rounded-xl px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 ring-blue-400"
          placeholder="학교 이름 검색 (2글자 이상)"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelected(null) }}
        />
        {loading && <p className="text-xs text-gray-400 mt-1 px-1">검색 중...</p>}
      </div>

      {/* 검색 결과 */}
      {!selected && schools.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
          {schools.map((s) => (
            <button
              key={s.code}
              className="w-full text-left px-4 py-3 text-sm border-b border-gray-100 last:border-0 hover:bg-gray-50"
              onClick={() => { setSelected(s); setSchools([]); setQuery(s.name) }}
            >
              <span className="font-medium text-gray-900">{s.name}</span>
              <span className="ml-2 text-xs text-gray-400">
                {s.level === 'elementary' ? '초등' : s.level === 'middle' ? '중학교' : '고등학교'}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 학년/반 입력 */}
      {selected && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <p className="text-xs text-blue-500 font-medium mb-3">선택됨: {selected.name}</p>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">학년</label>
              <input
                type="number"
                min={1} max={6}
                className="w-full bg-gray-50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-blue-400"
                placeholder="예: 2"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">반</label>
              <input
                type="number"
                min={1}
                className="w-full bg-gray-50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-blue-400"
                placeholder="예: 2"
                value={classNum}
                onChange={(e) => setClassNum(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* 시작 버튼 */}
      <button
        disabled={!selected || !grade || !classNum}
        onClick={handleStart}
        className="w-full bg-blue-500 disabled:bg-gray-200 text-white disabled:text-gray-400 rounded-xl py-3 text-sm font-semibold"
      >
        시작하기
      </button>
    </div>
  )
}
```

- [ ] **Step 2: 브라우저 확인**

`http://localhost:3000` 접속 →
1. 학교 검색 입력 → 결과 목록 표시
2. 학교 선택 → 학년/반 입력
3. "시작하기" → `/timetable`로 이동 확인

- [ ] **Step 3: 커밋**

```bash
git add app/page.tsx
git commit -m "feat: add onboarding page with school search and grade/class input"
```

---

## Task 9: 시간표 페이지

**Files:**
- Create: `components/WeekdayTabs.tsx`
- Create: `components/PeriodCard.tsx`
- Create: `app/timetable/page.tsx`

- [ ] **Step 1: WeekdayTabs 컴포넌트**

`homework-web/components/WeekdayTabs.tsx`:
```tsx
'use client'

const DAYS = ['월', '화', '수', '목', '금']

interface Props {
  selected: number  // 1~5
  dots?: number[]   // 학사일정 있는 요일 (1~5)
  onChange: (day: number) => void
}

export default function WeekdayTabs({ selected, dots = [], onChange }: Props) {
  return (
    <div className="flex bg-white border-b border-gray-100">
      {DAYS.map((day, i) => {
        const weekday = i + 1
        const active = selected === weekday
        return (
          <button
            key={weekday}
            onClick={() => onChange(weekday)}
            className={`flex-1 py-2 flex flex-col items-center text-xs font-medium relative ${
              active ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'
            }`}
          >
            {day}
            {dots.includes(weekday) && (
              <span className="w-1 h-1 rounded-full bg-orange-400 mt-0.5" />
            )}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: PeriodCard 컴포넌트**

`homework-web/components/PeriodCard.tsx`:
```tsx
import { PERIOD_TIMES } from '@/lib/neis'

type Status = 'past' | 'current' | 'future'

interface Props {
  period: number
  subject: string
  status: Status
}

const PERIOD_COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
  'bg-pink-500', 'bg-teal-500', 'bg-red-500', 'bg-yellow-500',
]

export default function PeriodCard({ period, subject, status }: Props) {
  const times = PERIOD_TIMES[period]
  const color = PERIOD_COLORS[(period - 1) % PERIOD_COLORS.length]

  return (
    <div
      className={`bg-white rounded-xl px-4 py-3 flex items-center gap-3 transition-opacity ${
        status === 'past' ? 'opacity-40' : ''
      } ${status === 'current' ? 'ring-2 ring-blue-400' : ''}`}
    >
      <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
        {period}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{subject}</p>
        {times && (
          <p className={`text-xs ${status === 'current' ? 'text-blue-500 font-medium' : 'text-gray-400'}`}>
            {status === 'current' ? '진행 중 · ' : ''}{times.start} – {times.end}
          </p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: app/timetable/page.tsx 작성**

`homework-web/app/timetable/page.tsx`:
```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadSettings } from '@/lib/storage'
import { formatNeisDate, PERIOD_TIMES } from '@/lib/neis'
import type { DayTimetable } from '@/lib/neis'
import WeekdayTabs from '@/components/WeekdayTabs'
import PeriodCard from '@/components/PeriodCard'

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getCurrentPeriod(): number | null {
  const now = new Date()
  const hm = now.getHours() * 100 + now.getMinutes()
  for (const [p, t] of Object.entries(PERIOD_TIMES)) {
    const [sh, sm] = t.start.split(':').map(Number)
    const [eh, em] = t.end.split(':').map(Number)
    if (hm >= sh * 100 + sm && hm <= eh * 100 + em) return Number(p)
  }
  return null
}

function getPastPeriods(): number[] {
  const now = new Date()
  const hm = now.getHours() * 100 + now.getMinutes()
  return Object.entries(PERIOD_TIMES)
    .filter(([, t]) => {
      const [eh, em] = t.end.split(':').map(Number)
      return hm > eh * 100 + em
    })
    .map(([p]) => Number(p))
}

export default function TimetablePage() {
  const router = useRouter()
  const [settings, setSettings] = useState<ReturnType<typeof loadSettings>>(null)
  const today = new Date().getDay() // 0=일
  const todayWeekday = today === 0 ? 5 : today === 6 ? 5 : today

  const [selectedDay, setSelectedDay] = useState(todayWeekday)
  const [timetable, setTimetable] = useState<DayTimetable[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const s = loadSettings()
    if (!s) { router.replace('/'); return }
    setSettings(s)

    const monday = getMonday(new Date())
    const friday = new Date(monday)
    friday.setDate(monday.getDate() + 4)

    const { school, grade, classNum } = s
    const params = new URLSearchParams({
      region: school.region,
      code: school.code,
      grade: String(grade),
      class: String(classNum),
      from: formatNeisDate(monday),
      to: formatNeisDate(friday),
      level: school.level,
    })

    fetch(`/api/neis/timetable?${params}`)
      .then((r) => r.json())
      .then((data) => { setTimetable(data.timetable ?? []); setLoading(false) })
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const dayEntries = timetable.find((d) => d.weekday === selectedDay)?.entries ?? []
  const currentPeriod = new Date().getDay() === selectedDay ? getCurrentPeriod() : null
  const pastPeriods = new Date().getDay() === selectedDay ? getPastPeriods() : []

  if (!settings) return null

  return (
    <div className="max-w-md mx-auto">
      {/* 헤더 */}
      <div className="bg-white px-4 py-3 border-b border-gray-100">
        <p className="text-lg font-bold text-gray-900">{settings.school.name}</p>
        <p className="text-xs text-gray-400">{settings.grade}학년 {settings.classNum}반</p>
      </div>

      {/* 요일 탭 */}
      <WeekdayTabs selected={selectedDay} onChange={setSelectedDay} />

      {/* 교시 목록 */}
      <div className="p-3 flex flex-col gap-2">
        {loading && <p className="text-center text-sm text-gray-400 py-10">불러오는 중...</p>}
        {!loading && dayEntries.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-10">시간표 정보가 없습니다</p>
        )}
        {dayEntries.map((entry) => (
          <PeriodCard
            key={entry.period}
            period={entry.period}
            subject={entry.subject}
            status={
              entry.period === currentPeriod
                ? 'current'
                : pastPeriods.includes(entry.period)
                ? 'past'
                : 'future'
            }
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 브라우저 확인**

`http://localhost:3000/timetable` →
1. 학교명 + 학년/반 표시
2. 요일 탭 — 오늘 자동 선택
3. 교시 카드 목록 표시 (API 호출)
4. 진행 중 교시 파란 테두리, 지난 교시 흐릿

- [ ] **Step 5: 커밋**

```bash
git add components/WeekdayTabs.tsx components/PeriodCard.tsx app/timetable/page.tsx
git commit -m "feat: add timetable page with weekday tabs and period cards"
```

---

## Task 10: 캘린더 페이지

**Files:**
- Create: `components/MonthCalendar.tsx`
- Create: `app/calendar/page.tsx`

- [ ] **Step 1: MonthCalendar 컴포넌트**

`homework-web/components/MonthCalendar.tsx`:
```tsx
'use client'

interface Props {
  year: number
  month: number           // 0-indexed
  eventDates: string[]    // YYYY-MM-DD
  selectedDate: string    // YYYY-MM-DD
  onSelect: (date: string) => void
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

export default function MonthCalendar({ year, month, eventDates, selectedDate, onSelect }: Props) {
  const today = new Date()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  function fmt(day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  return (
    <div className="bg-white px-4 pb-2">
      <div className="grid grid-cols-7 text-center mb-1">
        {DAY_LABELS.map((d, i) => (
          <div key={d} className={`text-xs py-1 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}>
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 text-center gap-y-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />
          const dateStr = fmt(day)
          const isToday =
            today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === day
          const isSelected = selectedDate === dateStr
          const hasEvent = eventDates.includes(dateStr)
          const col = idx % 7

          return (
            <button
              key={dateStr}
              onClick={() => onSelect(dateStr)}
              className="flex flex-col items-center"
            >
              <span
                className={`w-7 h-7 flex items-center justify-center rounded-full text-xs
                  ${isSelected ? 'bg-blue-500 text-white font-semibold' : ''}
                  ${isToday && !isSelected ? 'border border-blue-400 font-semibold' : ''}
                  ${!isSelected && col === 0 ? 'text-red-400' : ''}
                  ${!isSelected && col === 6 ? 'text-blue-400' : ''}
                  ${!isSelected && col !== 0 && col !== 6 ? 'text-gray-800' : ''}
                `}
              >
                {day}
              </span>
              {hasEvent && <span className="w-1 h-1 rounded-full bg-orange-400 mt-0.5" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: app/calendar/page.tsx 작성**

`homework-web/app/calendar/page.tsx`:
```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadSettings } from '@/lib/storage'
import type { CalendarEvent } from '@/lib/neis'
import MonthCalendar from '@/components/MonthCalendar'

export default function CalendarPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<ReturnType<typeof loadSettings>>(null)
  const today = new Date()

  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedDate, setSelectedDate] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  )

  useEffect(() => {
    const s = loadSettings()
    if (!s) { router.replace('/'); return }
    setSettings(s)
    fetchEvents(year, month, s)
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (settings) fetchEvents(year, month, settings)
  }, [year, month])  // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchEvents(y: number, m: number, s = settings) {
    if (!s) return
    const from = `${y}${String(m + 1).padStart(2, '0')}01`
    const lastDay = new Date(y, m + 1, 0).getDate()
    const to = `${y}${String(m + 1).padStart(2, '0')}${String(lastDay).padStart(2, '0')}`
    const params = new URLSearchParams({
      region: s.school.region,
      code: s.school.code,
      from,
      to,
    })
    const res = await fetch(`/api/neis/schedule?${params}`)
    const data = await res.json()
    setEvents(data.events ?? [])
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const eventDates = events.map((e) => e.startDate)
  const selectedEvents = events.filter((e) => e.startDate <= selectedDate && e.endDate >= selectedDate)

  if (!settings) return null

  return (
    <div className="max-w-md mx-auto">
      {/* 월 네비게이션 */}
      <div className="bg-white px-4 pt-4 pb-2 flex items-center justify-between border-b border-gray-100">
        <button onClick={prevMonth} className="text-gray-400 px-2 py-1">‹</button>
        <h2 className="text-lg font-bold text-gray-900">
          {year}년 {month + 1}월
        </h2>
        <button onClick={nextMonth} className="text-gray-400 px-2 py-1">›</button>
      </div>

      {/* 캘린더 그리드 */}
      <MonthCalendar
        year={year}
        month={month}
        eventDates={eventDates}
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
      />

      {/* 선택한 날 일정 */}
      <div className="p-3 flex flex-col gap-2">
        <p className="text-xs text-gray-400 font-medium px-1">
          {selectedDate.slice(5).replace('-', '월 ')}일 일정
        </p>
        {selectedEvents.length === 0 ? (
          <p className="text-xs text-gray-300 px-1">일정 없음</p>
        ) : (
          selectedEvents.map((e) => (
            <div key={e.id} className="bg-white rounded-xl px-4 py-3 flex gap-3 items-center">
              <div className="w-1 h-10 bg-orange-400 rounded-full shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900">{e.title}</p>
                <p className="text-xs text-gray-400">{e.startDate}</p>
              </div>
            </div>
          ))
        )}

        {/* 이번 달 전체 일정 */}
        {events.length > 0 && (
          <>
            <p className="text-xs text-gray-400 font-medium px-1 mt-2">{month + 1}월 전체 일정</p>
            {events.map((e) => (
              <div key={e.id} className="bg-white rounded-xl px-4 py-3 flex gap-3 items-center">
                <div className="w-1 h-10 bg-blue-400 rounded-full shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{e.title}</p>
                  <p className="text-xs text-gray-400">{e.startDate}</p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 브라우저 확인**

`http://localhost:3000/calendar` →
1. 월별 캘린더 그리드 표시
2. 이전/다음 월 이동
3. 학사일정 있는 날짜에 주황 점
4. 날짜 클릭 → 해당 일 일정 표시

- [ ] **Step 4: 커밋**

```bash
git add components/MonthCalendar.tsx app/calendar/page.tsx
git commit -m "feat: add calendar page with monthly view and school schedule"
```

---

## Task 11: 설정 페이지 + JSON 뷰어

**Files:**
- Create: `components/JsonViewer.tsx`
- Create: `app/settings/page.tsx`

- [ ] **Step 1: JsonViewer 컴포넌트**

`homework-web/components/JsonViewer.tsx`:
```tsx
'use client'

import { useState } from 'react'

interface Props {
  label: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
}

export default function JsonViewer({ label, data }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-white rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-4 py-3 text-left flex justify-between items-center text-sm"
      >
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-400 text-xs">{open ? '닫기 ▲' : '보기 ▼'}</span>
      </button>
      {open && (
        <pre className="bg-gray-50 px-4 py-3 text-xs text-gray-600 overflow-auto max-h-80 border-t border-gray-100">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  )
}
```

- [ ] **Step 2: app/settings/page.tsx 작성**

`homework-web/app/settings/page.tsx`:
```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadSettings, clearSettings } from '@/lib/storage'
import { formatNeisDate } from '@/lib/neis'
import JsonViewer from '@/components/JsonViewer'

export default function SettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<ReturnType<typeof loadSettings>>(null)
  const [timetableRaw, setTimetableRaw] = useState(null)
  const [scheduleRaw, setScheduleRaw] = useState(null)

  useEffect(() => {
    const s = loadSettings()
    if (!s) { router.replace('/'); return }
    setSettings(s)
    fetchRaw(s)
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchRaw(s = settings) {
    if (!s) return
    const { school, grade, classNum } = s
    const today = new Date()
    const monday = new Date(today)
    const diff = today.getDay() === 0 ? -6 : 1 - today.getDay()
    monday.setDate(today.getDate() + diff)
    const friday = new Date(monday)
    friday.setDate(monday.getDate() + 4)

    const tp = new URLSearchParams({
      region: school.region, code: school.code,
      grade: String(grade), class: String(classNum),
      from: formatNeisDate(monday), to: formatNeisDate(friday),
      level: school.level,
    })
    const m = today.getMonth()
    const lastDay = new Date(today.getFullYear(), m + 1, 0).getDate()
    const sp = new URLSearchParams({
      region: school.region, code: school.code,
      from: `${today.getFullYear()}${String(m + 1).padStart(2, '0')}01`,
      to: `${today.getFullYear()}${String(m + 1).padStart(2, '0')}${String(lastDay).padStart(2, '0')}`,
    })

    const [tt, sc] = await Promise.all([
      fetch(`/api/neis/timetable?${tp}`).then(r => r.json()),
      fetch(`/api/neis/schedule?${sp}`).then(r => r.json()),
    ])
    setTimetableRaw(tt.raw)
    setScheduleRaw(sc.raw)
  }

  if (!settings) return null

  return (
    <div className="max-w-md mx-auto p-4 pt-6">
      <h1 className="text-lg font-bold text-gray-900 mb-4">설정</h1>

      {/* 현재 설정 */}
      <div className="bg-white rounded-xl px-4 py-4 mb-4">
        <p className="text-xs text-gray-400 mb-1">학교</p>
        <p className="text-sm font-semibold text-gray-900">{settings.school.name}</p>
        <p className="text-xs text-gray-500 mt-2">{settings.grade}학년 {settings.classNum}반</p>
      </div>

      {/* 학교 변경 */}
      <button
        onClick={() => { clearSettings(); router.push('/') }}
        className="w-full bg-white text-blue-500 rounded-xl py-3 text-sm font-medium mb-6"
      >
        학교 변경
      </button>

      {/* NEIS API JSON 뷰어 */}
      <p className="text-xs text-gray-400 font-medium mb-2 px-1">NEIS API 응답 확인</p>
      <div className="flex flex-col gap-2">
        <JsonViewer label="시간표 API 원본 (hisTimetable)" data={timetableRaw} />
        <JsonViewer label="학사일정 API 원본 (SchoolSchedule)" data={scheduleRaw} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 브라우저 확인**

`http://localhost:3000/settings` →
1. 학교/학년/반 표시
2. "학교 변경" 클릭 → 온보딩으로 이동
3. "시간표 API 원본 보기▼" 클릭 → JSON 펼침
4. JSON 데이터 내용으로 NEIS API 동작 확인

- [ ] **Step 4: 커밋**

```bash
git add components/JsonViewer.tsx app/settings/page.tsx
git commit -m "feat: add settings page with NEIS API JSON viewer"
```

---

## Task 12: Vercel 배포

**Files:**
- Modify: `next.config.ts` (필요 시)

- [ ] **Step 1: GitHub 레포 생성 + 푸시**

```bash
cd /home/hyeonjae/homework-web
gh repo create homework-web --public --source=. --push
```

- [ ] **Step 2: Vercel에 NEIS_API_KEY 환경변수 등록**

```bash
vercel env add NEIS_API_KEY
```

프롬프트에서 API 키 입력 → Environments: Production, Preview, Development 모두 선택

- [ ] **Step 3: 배포**

```bash
cd /home/hyeonjae/homework-web
vercel --prod
```

배포 완료 URL 메모 (예: `https://homework-web-xxx.vercel.app`)

- [ ] **Step 4: 배포 환경 동작 확인**

배포 URL에서:
1. 온보딩 → 학교 검색
2. 시간표 로드
3. 설정 → JSON 뷰어 → NEIS API 응답 확인

- [ ] **Step 5: 최종 커밋**

```bash
git add -A
git commit -m "chore: finalize for Vercel deployment"
git push
```

---

## 전체 테스트 실행 (언제든지)

```bash
cd /home/hyeonjae/homework-web
npx jest
```

Expected: PASS (neis.test.ts, storage.test.ts)
