import type { SchoolLevel } from './neis'

export function getGradeMax(level: SchoolLevel): number {
  return level === 'elementary' ? 6 : 3
}

export function validateGrade(value: string, level: SchoolLevel): string | null {
  const n = Number(value)
  if (!value || isNaN(n)) return '학년을 입력해 주세요'
  const max = getGradeMax(level)
  if (n < 1 || n > max) return `학년은 1~${max}학년으로 입력해 주세요`
  return null
}

export function validateClassNum(value: string): string | null {
  const n = Number(value)
  if (!value || isNaN(n)) return '반을 입력해 주세요'
  if (n < 1) return '반은 1 이상으로 입력해 주세요'
  return null
}
