import { ALLERGY_LABELS } from '@/lib/neis'

interface Props {
  selected: number[]
  onChange: (codes: number[]) => void
}

export default function AllergyChips({ selected, onChange }: Props) {
  const codes = Object.keys(ALLERGY_LABELS).map(Number)

  function handleClick(code: number) {
    if (selected.includes(code)) {
      onChange(selected.filter((c) => c !== code))
    } else {
      onChange([...selected, code])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {codes.map((code) => {
        const { name, emoji } = ALLERGY_LABELS[code]
        const isSelected = selected.includes(code)
        return (
          <button
            key={code}
            type="button"
            onClick={() => handleClick(code)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer ${
              isSelected
                ? 'bg-red-50 border border-red-300 text-red-600'
                : 'bg-gray-100 border border-gray-200 text-gray-500'
            }`}
          >
            {emoji} {name}
          </button>
        )
      })}
    </div>
  )
}
