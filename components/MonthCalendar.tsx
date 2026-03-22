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
