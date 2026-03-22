'use client'

import { useMemo } from 'react'
import type { CalendarEvent, EventCategory } from '@/lib/neis'

interface Props {
  year: number
  month: number           // 0-indexed
  events: CalendarEvent[]
  selectedDate: string    // YYYY-MM-DD
  onSelect: (date: string) => void
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

const CATEGORY_COLOR: Record<EventCategory, string> = {
  exam:    'bg-red-400',
  vacation: 'bg-blue-400',
  holiday: 'bg-purple-400',
  event:   'bg-orange-400',
}

export default function MonthCalendar({ year, month, events, selectedDate, onSelect }: Props) {
  const today = useMemo(() => new Date(), [])
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // 날짜별 이벤트 인덱스 (최대 2개 표시)
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {}
    for (const e of events) {
      if (!map[e.startDate]) map[e.startDate] = []
      if (map[e.startDate].length < 2) map[e.startDate].push(e)
    }
    return map
  }, [events])

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  function fmt(day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  return (
    <div className="bg-white px-2 pb-2">
      <div className="grid grid-cols-7 text-center mb-1">
        {DAY_LABELS.map((d, i) => (
          <div key={d} className={`text-xs py-1 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}>
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />
          const dateStr = fmt(day)
          const isToday =
            today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === day
          const isSelected = selectedDate === dateStr
          const dayEvents = eventsByDate[dateStr] ?? []
          const col = idx % 7

          return (
            <button
              key={dateStr}
              onClick={() => onSelect(dateStr)}
              className="flex flex-col items-center pb-0.5"
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
              {/* 이벤트 컬러 바 (최대 2개) */}
              <div className="flex flex-col gap-px w-full px-0.5 mt-0.5">
                {dayEvents.map((e) => (
                  <span
                    key={e.id}
                    className={`block w-full h-1 rounded-full ${CATEGORY_COLOR[e.category]}`}
                  />
                ))}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
