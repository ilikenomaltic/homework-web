'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadSettings, loadMemos, saveMemo } from '@/lib/storage'
import { formatNeisDate, PERIOD_TIMES } from '@/lib/neis'
import type { DayTimetable } from '@/lib/neis'
import WeekdayTabs from '@/components/WeekdayTabs'
import PeriodCard from '@/components/PeriodCard'

function getWeekOfMonth(monday: Date): { month: number; week: number } {
  return {
    month: monday.getMonth() + 1,
    week: Math.ceil(monday.getDate() / 7),
  }
}

function isLunchTime(): boolean {
  const now = new Date()
  const hm = now.getHours() * 100 + now.getMinutes()
  return hm >= 1250 && hm < 1350
}

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
  const [fetchError, setFetchError] = useState(false)
  const [memos, setMemos] = useState<Record<string, string>>({})
  const [memoModal, setMemoModal] = useState<string | null>(null) // subject name
  const [memoText, setMemoText] = useState('')

  useEffect(() => { setMemos(loadMemos()) }, [])

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
      .catch(() => { setFetchError(true); setLoading(false) })
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const monday = getMonday(new Date())
  const { month: weekMonth, week: weekNum } = getWeekOfMonth(monday)

  const dayEntries = timetable.find((d) => d.weekday === selectedDay)?.entries ?? []
  // getDay() returns 0-6; selectedDay is 1-5 (sat/sun mapped to 5). On weekends getDay() won't match → no period highlighting.
  const isToday = new Date().getDay() === selectedDay
  const currentPeriod = isToday ? getCurrentPeriod() : null
  const pastPeriods = isToday ? getPastPeriods() : []
  const lunchNow = isToday && isLunchTime()

  function openMemo(subject: string) {
    setMemoText(memos[subject] ?? '')
    setMemoModal(subject)
  }

  function handleSaveMemo() {
    if (!memoModal) return
    saveMemo(memoModal, memoText)
    setMemos((prev) => {
      const next = { ...prev }
      if (memoText.trim()) next[memoModal] = memoText.trim()
      else delete next[memoModal]
      return next
    })
    setMemoModal(null)
  }

  if (!settings) return null

  return (
    <div className="max-w-md mx-auto">
      {/* 헤더 */}
      <div className="bg-white px-4 py-3 border-b border-gray-100">
        <div className="flex items-baseline justify-between">
          <p className="text-lg font-bold text-gray-900">{settings.school.name}</p>
          <p className="text-xs text-blue-500 font-medium">{weekMonth}월 {weekNum}주차</p>
        </div>
        <p className="text-xs text-gray-400">{settings.grade}학년 {settings.classNum}반</p>
      </div>

      {/* 요일 탭 */}
      <WeekdayTabs selected={selectedDay} onChange={setSelectedDay} />

      {/* 교시 목록 */}
      <div className="p-3 flex flex-col gap-2">
        {loading && <p className="text-center text-sm text-gray-400 py-10">불러오는 중...</p>}
        {fetchError && (
          <p className="text-center text-sm text-red-400 py-10">불러오기 실패. 네트워크를 확인해 주세요</p>
        )}
        {!loading && !fetchError && dayEntries.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-10">시간표 정보가 없습니다</p>
        )}
        {dayEntries.map((entry) => (
          <div key={entry.period}>
            <PeriodCard
              period={entry.period}
              subject={entry.subject}
              memo={memos[entry.subject]}
              onClick={() => openMemo(entry.subject)}
              status={
                entry.period === currentPeriod
                  ? 'current'
                  : pastPeriods.includes(entry.period)
                  ? 'past'
                  : 'future'
              }
            />
            {entry.period === 4 && (
              <div className={`mt-2 bg-white rounded-xl px-4 py-3 flex items-center gap-3 ${lunchNow ? 'ring-2 ring-green-400' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-green-400 flex items-center justify-center shrink-0">
                  <span className="text-white text-sm">🍚</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">점심시간</p>
                  <p className={`text-xs ${lunchNow ? 'text-green-500 font-medium' : 'text-gray-400'}`}>
                    {lunchNow ? '진행 중 · ' : ''}12:50 – 13:50
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 메모 모달 */}
      {memoModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMemoModal(null)} />
          <div className="relative w-full max-w-md bg-white rounded-t-2xl p-5 flex flex-col gap-3">
            <h3 className="text-base font-bold text-gray-900">{memoModal}</h3>
            <textarea
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 resize-none h-28 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="강의실, 선생님, 준비물 등 메모..."
              value={memoText}
              onChange={(e) => setMemoText(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={() => setMemoModal(null)} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-500">취소</button>
              <button onClick={handleSaveMemo} className="flex-1 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold">저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
