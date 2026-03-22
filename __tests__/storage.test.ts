import { saveSettings, loadSettings, clearSettings } from '@/lib/storage'
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
