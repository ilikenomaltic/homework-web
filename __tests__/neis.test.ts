import {
  parseSchoolLevel,
  parseSchoolFromNeis,
  parseTimetableRows,
  parseScheduleRows,
  getTimetableEndpoint,
  formatNeisDate,
  PERIOD_TIMES,
} from '@/lib/neis'

describe('parseSchoolLevel', () => {
  it('초등학교 → elementary', () => {
    expect(parseSchoolLevel('초등학교')).toBe('elementary')
  })
  it('중학교 → middle', () => {
    expect(parseSchoolLevel('중학교')).toBe('middle')
  })
  it('고등학교 → high', () => {
    expect(parseSchoolLevel('고등학교')).toBe('high')
  })
})

describe('parseSchoolFromNeis', () => {
  it('NEIS schoolInfo row → School 객체', () => {
    const row = {
      SD_SCHUL_CODE: '7430310',
      SCHUL_NM: '경기북과학고등학교',
      ATPT_OFCDC_SC_CODE: 'J10',
      SCHUL_KND_SC_NM: '고등학교',
    }
    const school = parseSchoolFromNeis(row)
    expect(school.code).toBe('7430310')
    expect(school.name).toBe('경기북과학고등학교')
    expect(school.region).toBe('J10')
    expect(school.level).toBe('high')
  })
})

describe('getTimetableEndpoint', () => {
  it('high → hisTimetable', () => {
    expect(getTimetableEndpoint('high')).toBe('hisTimetable')
  })
  it('middle → misTimetable', () => {
    expect(getTimetableEndpoint('middle')).toBe('misTimetable')
  })
  it('elementary → elsTimetable', () => {
    expect(getTimetableEndpoint('elementary')).toBe('elsTimetable')
  })
})

describe('formatNeisDate', () => {
  it('Date → YYYYMMDD 문자열', () => {
    expect(formatNeisDate(new Date('2026-03-23'))).toBe('20260323')
  })
})

describe('parseTimetableRows', () => {
  it('NEIS rows → DayTimetable 배열 (5일)', () => {
    const rows = [
      { ALL_TI_YMD: '20260323', PERIO: '1', ITRT_CNTNT: '국어' },
      { ALL_TI_YMD: '20260323', PERIO: '2', ITRT_CNTNT: '수학' },
      { ALL_TI_YMD: '20260324', PERIO: '1', ITRT_CNTNT: '영어' },
    ]
    const weekStart = new Date('2026-03-23') // 월요일
    const result = parseTimetableRows(rows, weekStart)
    expect(result).toHaveLength(5)
    expect(result[0].weekday).toBe(1)
    expect(result[0].entries).toHaveLength(2)
    expect(result[0].entries[0].subject).toBe('국어')
    expect(result[1].entries[0].subject).toBe('영어')
  })
})

describe('parseScheduleRows', () => {
  it('NEIS rows → CalendarEvent 배열', () => {
    const rows = [
      { AA_YMD: '20260325', EVENT_NM: '중간고사' },
    ]
    const result = parseScheduleRows(rows)
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('중간고사')
    expect(result[0].startDate).toBe('2026-03-25')
  })
})

describe('PERIOD_TIMES', () => {
  it('1교시 시작 09:00', () => {
    expect(PERIOD_TIMES[1].start).toBe('09:00')
    expect(PERIOD_TIMES[1].end).toBe('09:50')
  })
  it('5교시 시작 13:50 (점심 이후)', () => {
    expect(PERIOD_TIMES[5].start).toBe('13:50')
  })
})
