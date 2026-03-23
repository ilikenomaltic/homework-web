import { getGradeMax, validateGrade, validateClassNum } from '@/lib/validation'
import type { SchoolLevel } from '@/lib/neis'

describe('getGradeMax', () => {
  it('초등학교는 6', () => { expect(getGradeMax('elementary')).toBe(6) })
  it('중학교는 3', () => { expect(getGradeMax('middle')).toBe(3) })
  it('고등학교는 3', () => { expect(getGradeMax('high')).toBe(3) })
})

describe('validateGrade', () => {
  it('초등 1~6 유효', () => {
    expect(validateGrade('1', 'elementary')).toBeNull()
    expect(validateGrade('6', 'elementary')).toBeNull()
  })
  it('초등 7은 에러', () => {
    expect(validateGrade('7', 'elementary')).toMatch(/1~6/)
  })
  it('중학교 4는 에러', () => {
    expect(validateGrade('4', 'middle')).toMatch(/1~3/)
  })
  it('0 이하는 에러', () => {
    expect(validateGrade('0', 'high')).not.toBeNull()
  })
  it('빈 문자열은 에러', () => {
    expect(validateGrade('', 'elementary')).not.toBeNull()
  })
})

describe('validateClassNum', () => {
  it('1 이상 유효', () => {
    expect(validateClassNum('1')).toBeNull()
    expect(validateClassNum('10')).toBeNull()
  })
  it('0은 에러', () => {
    expect(validateClassNum('0')).not.toBeNull()
  })
  it('빈 문자열은 에러', () => {
    expect(validateClassNum('')).not.toBeNull()
  })
})
