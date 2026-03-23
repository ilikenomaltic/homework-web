import {
  saveSettings, loadSettings, clearSettings,
  savePeriodInfo, loadPeriodInfos, deletePeriodInfo,
  saveCustomClass, loadCustomClasses, deleteCustomClass,
} from '@/lib/storage'
import type { School } from '@/lib/neis'

const mockSchool: School = {
  code: '7430310',
  name: '경기북과학고등학교',
  region: 'J10',
  level: 'high',
}

beforeEach(() => {
  localStorage.clear()
})

describe('saveSettings / loadSettings', () => {
  it('설정 저장 후 불러오기', () => {
    saveSettings({ school: mockSchool, grade: 2, classNum: 2 })
    const loaded = loadSettings()
    expect(loaded?.school.code).toBe('7430310')
    expect(loaded?.grade).toBe(2)
    expect(loaded?.classNum).toBe(2)
  })

  it('저장값 없으면 null 반환', () => {
    expect(loadSettings()).toBeNull()
  })

  it('손상된 JSON이면 null 반환', () => {
    localStorage.setItem('classroom-notifier-settings', 'not-json')
    expect(loadSettings()).toBeNull()
  })

  it('스키마가 다른 객체면 null 반환', () => {
    localStorage.setItem('classroom-notifier-settings', JSON.stringify({ invalid: true }))
    expect(loadSettings()).toBeNull()
  })
})

describe('clearSettings', () => {
  it('삭제 후 null 반환', () => {
    saveSettings({ school: mockSchool, grade: 1, classNum: 1 })
    clearSettings()
    expect(loadSettings()).toBeNull()
  })
})

describe('PeriodInfo CRUD', () => {
  beforeEach(() => { localStorage.clear() })

  it('교시 정보 저장 후 불러오기', () => {
    savePeriodInfo(1, 3, { teacher: '김선생님', classroom: '203호', memo: '교과서 챙기기' })
    const infos = loadPeriodInfos()
    expect(infos['1-3']?.teacher).toBe('김선생님')
    expect(infos['1-3']?.classroom).toBe('203호')
    expect(infos['1-3']?.memo).toBe('교과서 챙기기')
    expect(typeof infos['1-3']?.timestamp).toBe('number')
  })

  it('모든 필드가 비면 해당 키 삭제', () => {
    savePeriodInfo(1, 3, { teacher: '김선생님' })
    savePeriodInfo(1, 3, { teacher: '', classroom: '', memo: '' })
    const infos = loadPeriodInfos()
    expect(infos['1-3']).toBeUndefined()
  })

  it('deletePeriodInfo로 키 삭제', () => {
    savePeriodInfo(2, 5, { classroom: '101호' })
    deletePeriodInfo(2, 5)
    expect(loadPeriodInfos()['2-5']).toBeUndefined()
  })

  it('저장 없으면 빈 객체 반환', () => {
    expect(loadPeriodInfos()).toEqual({})
  })
})

describe('CustomClass CRUD', () => {
  beforeEach(() => { localStorage.clear() })

  it('커스텀 수업 저장 후 불러오기', () => {
    saveCustomClass(1, 7, { subject: '자율학습', teacher: '담임', classroom: '본교실' })
    const classes = loadCustomClasses()
    expect(classes['1-7']?.subject).toBe('자율학습')
    expect(classes['1-7']?.teacher).toBe('담임')
  })

  it('deleteCustomClass는 CustomClass와 PeriodInfo 함께 삭제', () => {
    saveCustomClass(3, 6, { subject: '동아리' })
    savePeriodInfo(3, 6, { memo: '준비물 있음' })
    deleteCustomClass(3, 6)
    expect(loadCustomClasses()['3-6']).toBeUndefined()
    expect(loadPeriodInfos()['3-6']).toBeUndefined()
  })

  it('저장 없으면 빈 객체 반환', () => {
    expect(loadCustomClasses()).toEqual({})
  })
})
