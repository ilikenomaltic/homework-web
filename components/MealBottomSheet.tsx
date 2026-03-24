import { MealInfo, ALLERGY_LABELS } from '@/lib/neis'

interface Props {
  meal: MealInfo
  allergies: number[]
  date: string
  onClose: () => void
}

export default function MealBottomSheet({ meal, allergies, date, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        data-testid="meal-sheet"
        className="absolute bottom-0 w-full rounded-t-2xl bg-white px-4 pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="w-9 h-1 bg-gray-200 rounded mx-auto mt-3 mb-4" />

        {/* Header row */}
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold">오늘 급식</span>
          <span className="text-sm text-gray-400">{meal.calories}</span>
        </div>

        {/* Date */}
        <p className="text-sm text-gray-400 mb-4">{date}</p>

        {/* Menu list */}
        <div className="max-h-[70vh] overflow-y-auto">
          {meal.items.map((item, idx) => {
            const hasAllergy = item.allergens.some((code) => allergies.includes(code))
            const userAllergenCodes = item.allergens.filter((code) => allergies.includes(code))

            return (
              <div
                key={idx}
                className={`flex items-center gap-3 py-3 border-b border-gray-100 last:border-0 ${
                  hasAllergy ? 'bg-red-50/50 -mx-4 px-4 rounded' : ''
                }`}
              >
                {/* Dot */}
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    hasAllergy ? 'bg-red-500' : 'bg-green-400'
                  }`}
                />

                {/* Item name */}
                <span className={`flex-1 ${hasAllergy ? 'text-red-600' : ''}`}>
                  {item.name}
                </span>

                {/* Allergy tags */}
                {hasAllergy && userAllergenCodes.length > 0 && (
                  <div className="flex flex-wrap gap-1 ml-auto">
                    {userAllergenCodes.map((code) => {
                      const label = ALLERGY_LABELS[code]
                      if (!label) return null
                      return (
                        <span
                          key={code}
                          className="bg-red-50 text-red-500 text-xs px-1.5 py-0.5 rounded-full"
                        >
                          {label.emoji} {label.name}
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
