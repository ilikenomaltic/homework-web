import {
  parseSchoolLevel,
  parseSchoolFromNeis,
  parseTimetableRows,
  parseScheduleRows,
  getTimetableEndpoint,
  formatNeisDate,
  PERIOD_TIMES,
  parseMealRows,
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

  it('다른 주 데이터는 필터링됨', () => {
    const rows = [
      { ALL_TI_YMD: '20260323', PERIO: '1', ITRT_CNTNT: '국어' },  // 해당 주
      { ALL_TI_YMD: '20260316', PERIO: '1', ITRT_CNTNT: '체육' },  // 이전 주 — 제외되어야 함
    ]
    const weekStart = new Date('2026-03-23')
    const result = parseTimetableRows(rows, weekStart)
    expect(result[0].entries).toHaveLength(1)  // 국어만
    expect(result[0].entries[0].subject).toBe('국어')
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

describe('parseMealRows', () => {
  it('NEIS rows → MealInfo 배열', () => {
    const rows = [
      { MLSV_YMD: '20260324', DDISH_NM: '쌀밥(5.) <br/> 계란후라이(1.2.) <br/> 깍두기(9.)', CAL_INFO: '850 Kcal', MMEAL_SC_CODE: '2' },
    ]
    const result = parseMealRows(rows)
    expect(result).toHaveLength(1)
    expect(result[0].date).toBe('2026-03-24')
    expect(result[0].calories).toBe('850 Kcal')
    expect(result[0].items).toHaveLength(3)
    expect(result[0].items[0].name).toBe('쌀밥')
    expect(result[0].items[0].allergens).toEqual([5])
    expect(result[0].items[1].name).toBe('계란후라이')
    expect(result[0].items[1].allergens).toEqual([1, 2])
  })

  it('날짜 없는 row 무시', () => {
    expect(parseMealRows([{ DDISH_NM: '쌀밥', CAL_INFO: '' }])).toHaveLength(0)
  })

  it('bare digit 포함 메뉴명 보존 — "100% 현미밥"', () => {
    const rows = [
      { MLSV_YMD: '20260324', DDISH_NM: '100% 현미밥(5.)', CAL_INFO: '' },
    ]
    expect(parseMealRows(rows)[0].items[0].name).toBe('100% 현미밥')
  })

  it('알레르기 없는 항목 allergens 빈 배열', () => {
    const rows = [
      { MLSV_YMD: '20260324', DDISH_NM: '깍두기', CAL_INFO: '' },
    ]
    expect(parseMealRows(rows)[0].items[0].allergens).toEqual([])
  })
})
