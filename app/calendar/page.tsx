'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadSettings } from '@/lib/storage'
import type { CalendarEvent, EventCategory } from '@/lib/neis'
import MonthCalendar from '@/components/MonthCalendar'

export default function CalendarPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<ReturnType<typeof loadSettings>>(null)

  const [year, setYear] = useState(() => new Date().getFullYear())
  const [month, setMonth] = useState(() => new Date().getMonth())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

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
    setLoading(true)
    setEvents([])
    setFetchError(null)
    try {
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
      if (!res.ok) {
        throw new Error(`Failed to fetch events: ${res.status}`)
      }
      const data = await res.json()
      const monthPrefix = `${y}-${String(m + 1).padStart(2, '0')}`
      const filtered = (data.events ?? []).filter((e: CalendarEvent) => e.startDate.startsWith(monthPrefix))
      setEvents(filtered)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load events'
      setFetchError(message)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  function prevMonth() {
    if (month === 0) { setYear(year - 1); setMonth(11) }
    else setMonth(month - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(year + 1); setMonth(0) }
    else setMonth(month + 1)
  }

  const selectedEvents = events.filter((e) => e.startDate <= selectedDate && e.endDate >= selectedDate)

  const CATEGORY_LABEL: Record<EventCategory, string> = {
    exam: '시험',
    vacation: '방학/휴업',
    holiday: '공휴일',
    event: '행사',
  }
  const CATEGORY_BAR: Record<EventCategory, string> = {
    exam: 'bg-red-400',
    vacation: 'bg-blue-400',
    holiday: 'bg-purple-400',
    event: 'bg-orange-400',
  }

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
        events={events}
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
      />

      {/* 선택한 날 일정 */}
      <div className="p-3 flex flex-col gap-2">
        <p className="text-xs text-gray-400 font-medium px-1">
          {selectedDate.slice(5).replace('-', '월 ')}일 일정
        </p>

        {fetchError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">
            {fetchError}
          </div>
        )}

        {loading ? (
          <p className="text-xs text-gray-300 px-1">로딩 중...</p>
        ) : selectedEvents.length === 0 ? (
          <p className="text-xs text-gray-300 px-1">일정 없음</p>
        ) : (
          selectedEvents.map((e) => (
            <div key={e.id} className="bg-white rounded-xl px-4 py-3 flex gap-3 items-center">
              <div className={`w-1 h-10 ${CATEGORY_BAR[e.category]} rounded-full shrink-0`} />
              <div>
                <p className="text-sm font-semibold text-gray-900">{e.title}</p>
                <p className="text-xs text-gray-400">{CATEGORY_LABEL[e.category]}</p>
              </div>
            </div>
          ))
        )}

        {/* 이번 달 전체 일정 */}
        {!loading && events.length > 0 && (
          <>
            <p className="text-xs text-gray-400 font-medium px-1 mt-2">{month + 1}월 전체 일정</p>
            {events.map((e) => (
              <div key={e.id} className="bg-white rounded-xl px-4 py-3 flex gap-3 items-center">
                <div className={`w-1 h-10 ${CATEGORY_BAR[e.category]} rounded-full shrink-0`} />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{e.title}</p>
                  <p className="text-xs text-gray-400">
                    {e.startDate.slice(5).replace('-', '월 ')}일 · {CATEGORY_LABEL[e.category]}
                  </p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
