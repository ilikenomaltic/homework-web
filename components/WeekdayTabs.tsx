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
