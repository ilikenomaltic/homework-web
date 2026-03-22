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
