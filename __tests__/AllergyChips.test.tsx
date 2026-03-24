import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import AllergyChips from '@/components/AllergyChips'
import { ALLERGY_LABELS } from '@/lib/neis'

describe('AllergyChips', () => {
  it('renders all 18 chips', () => {
    render(<AllergyChips selected={[]} onChange={() => {}} />)
    const codes = Object.keys(ALLERGY_LABELS).map(Number)
    expect(codes).toHaveLength(18)
    for (const code of codes) {
      const label = ALLERGY_LABELS[code]
      expect(screen.getByText(`${label.emoji} ${label.name}`)).toBeInTheDocument()
    }
  })

  it('selected chip has red styling (text-red-600)', () => {
    render(<AllergyChips selected={[1]} onChange={() => {}} />)
    const chip = screen.getByText(`${ALLERGY_LABELS[1].emoji} ${ALLERGY_LABELS[1].name}`)
    expect(chip).toHaveClass('text-red-600')
  })

  it('clicking unselected chip calls onChange with code added', () => {
    const onChange = jest.fn()
    render(<AllergyChips selected={[]} onChange={onChange} />)
    const chip = screen.getByText(`${ALLERGY_LABELS[2].emoji} ${ALLERGY_LABELS[2].name}`)
    fireEvent.click(chip)
    expect(onChange).toHaveBeenCalledWith([2])
  })

  it('clicking selected chip calls onChange with code removed', () => {
    const onChange = jest.fn()
    render(<AllergyChips selected={[2, 3]} onChange={onChange} />)
    const chip = screen.getByText(`${ALLERGY_LABELS[2].emoji} ${ALLERGY_LABELS[2].name}`)
    fireEvent.click(chip)
    expect(onChange).toHaveBeenCalledWith([3])
  })
})
