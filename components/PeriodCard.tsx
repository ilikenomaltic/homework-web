import { PERIOD_TIMES } from '@/lib/neis'

type Status = 'past' | 'current' | 'future'

interface Props {
  period: number
  subject: string
  status: Status
  memo?: string
  teacher?: string
  classroom?: string
  onClick?: () => void
}

const PERIOD_COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
  'bg-pink-500', 'bg-teal-500', 'bg-red-500', 'bg-yellow-500',
]

export default function PeriodCard({ period, subject, status, memo, teacher, classroom, onClick }: Props) {
  const times = PERIOD_TIMES[period]
  const color = PERIOD_COLORS[(period - 1) % PERIOD_COLORS.length]

  return (
    <button
      onClick={onClick}
      className={`w-full bg-white rounded-xl px-4 py-3 flex items-center gap-3 transition-opacity text-left ${
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
        {(classroom || teacher) && (
          <p className="text-xs text-gray-400 truncate mt-0.5">
            {[classroom, teacher].filter(Boolean).join(' · ')}
          </p>
        )}
        {memo && (
          <p className="text-xs text-gray-500 truncate mt-0.5">{memo}</p>
        )}
      </div>
      {/* 오른쪽 아이콘 */}
      {(memo || teacher || classroom) ? (
        <svg className="w-4 h-4 text-orange-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.25 2.25 0 113.182 3.182L7.5 19.213l-4.5 1.125 1.125-4.5L16.862 3.487z" />
        </svg>
      ) : (
        <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
          <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
      )}
    </button>
  )
}
