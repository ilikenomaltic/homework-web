import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import MealBottomSheet from '@/components/MealBottomSheet'
import { MealInfo } from '@/lib/neis'

const meal: MealInfo = {
  date: '2026-03-24',
  items: [
    { name: '쌀밥', allergens: [5] },         // user has [5] — should be red
    { name: '제육볶음', allergens: [10] },     // user doesn't have 10 — green
    { name: '계란후라이', allergens: [1, 2] }, // user has [1] — should be red
  ],
  calories: '850 Kcal',
}

const userAllergies = [1, 5]

describe('MealBottomSheet', () => {
  it('renders all menu item names', () => {
    render(
      <MealBottomSheet
        meal={meal}
        allergies={userAllergies}
        date="3월 24일 (화)"
        onClose={() => {}}
      />
    )
    expect(screen.getByText('쌀밥')).toBeInTheDocument()
    expect(screen.getByText('제육볶음')).toBeInTheDocument()
    expect(screen.getByText('계란후라이')).toBeInTheDocument()
  })

  it('renders calories text', () => {
    render(
      <MealBottomSheet
        meal={meal}
        allergies={userAllergies}
        date="3월 24일 (화)"
        onClose={() => {}}
      />
    )
    expect(screen.getByText('850 Kcal')).toBeInTheDocument()
  })

  it('allergen item (user has code) shows red dot (bg-red-500)', () => {
    const { container } = render(
      <MealBottomSheet
        meal={meal}
        allergies={userAllergies}
        date="3월 24일 (화)"
        onClose={() => {}}
      />
    )
    // 쌀밥 has allergen 5, user has 5 — should show red dot
    const redDots = container.querySelectorAll('.bg-red-500')
    expect(redDots.length).toBeGreaterThan(0)
  })

  it('safe item (user does not have code) shows green dot (bg-green-400)', () => {
    const { container } = render(
      <MealBottomSheet
        meal={meal}
        allergies={userAllergies}
        date="3월 24일 (화)"
        onClose={() => {}}
      />
    )
    // 제육볶음 has allergen 10, user doesn't have 10 — should show green dot
    const greenDots = container.querySelectorAll('.bg-green-400')
    expect(greenDots.length).toBeGreaterThan(0)
  })

  it('allergy item shows allergy tag with emoji', () => {
    render(
      <MealBottomSheet
        meal={meal}
        allergies={userAllergies}
        date="3월 24일 (화)"
        onClose={() => {}}
      />
    )
    // 쌀밥 has allergen 5 (대두/콩) which user has — expect tag with emoji 🫘
    expect(screen.getByText('🫘 대두(콩)')).toBeInTheDocument()
    // 계란후라이 has allergen 1 (난류) which user has — expect tag with emoji 🥚
    expect(screen.getByText('🥚 난류')).toBeInTheDocument()
  })

  it('clicking background calls onClose', () => {
    const onClose = jest.fn()
    const { container } = render(
      <MealBottomSheet
        meal={meal}
        allergies={userAllergies}
        date="3월 24일 (화)"
        onClose={onClose}
      />
    )
    // The outermost fixed overlay div (not the sheet) should call onClose
    const overlay = container.firstChild as HTMLElement
    fireEvent.click(overlay)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('sheet div does NOT call onClose (click does not bubble)', () => {
    const onClose = jest.fn()
    const { container } = render(
      <MealBottomSheet
        meal={meal}
        allergies={userAllergies}
        date="3월 24일 (화)"
        onClose={onClose}
      />
    )
    // Find the sheet div (second child of the overlay, or the absolute positioned div)
    const overlay = container.firstChild as HTMLElement
    const sheet = overlay.querySelector('[data-testid="meal-sheet"]') as HTMLElement
    fireEvent.click(sheet)
    expect(onClose).not.toHaveBeenCalled()
  })
})
