'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadSettings, loadPeriodInfos, savePeriodInfo, loadCustomClasses, saveCustomClass } from '@/lib/storage'
import type { PeriodInfo, CustomClass } from '@/lib/storage'
import { formatNeisDate, PERIOD_TIMES } from '@/lib/neis'
import type { DayTimetable } from '@/lib/neis'
import WeekdayTabs from '@/components/WeekdayTabs'
import PeriodCard from '@/components/PeriodCard'

function getWeekOfMonth(monday: Date): { month: number; week: number } {
  return {
    month: monday.getMonth() + 1,
    week: Math.ceil(monday.getDate() / 7),
  }
}

function isLunchTime(): boolean {
  const now = new Date()
  const hm = now.getHours() * 100 + now.getMinutes()
  return hm >= 1250 && hm < 1350
}

function isLunchPast(): boolean {
  const now = new Date()
  const hm = now.getHours() * 100 + now.getMinutes()
  return hm >= 1350
}

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getCurrentPeriod(): number | null {
  const now = new Date()
  const hm = now.getHours() * 100 + now.getMinutes()
  for (const [p, t] of Object.entries(PERIOD_TIMES)) {
    const [sh, sm] = t.start.split(':').map(Number)
    const [eh, em] = t.end.split(':').map(Number)
    if (hm >= sh * 100 + sm && hm <= eh * 100 + em) return Number(p)
  }
  return null
}

function getPastPeriods(): number[] {
  const now = new Date()
  const hm = now.getHours() * 100 + now.getMinutes()
  return Object.entries(PERIOD_TIMES)
    .filter(([, t]) => {
      const [eh, em] = t.end.split(':').map(Number)
      return hm > eh * 100 + em
    })
    .map(([p]) => Number(p))
}

export default function TimetablePage() {
  const router = useRouter()
  const [settings, setSettings] = useState<ReturnType<typeof loadSettings>>(null)
  const today = new Date().getDay() // 0=일
  const todayWeekday = today === 0 ? 5 : today === 6 ? 5 : today

  const [selectedDay, setSelectedDay] = useState(todayWeekday)
  const [timetable, setTimetable] = useState<DayTimetable[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [periodInfos, setPeriodInfos] = useState<Record<string, PeriodInfo>>({})
  const [customClasses, setCustomClasses] = useState<Record<string, CustomClass>>({})
  const [infoModal, setInfoModal] = useState<{ period: number; subject: string } | null>(null)
  const [infoTeacher, setInfoTeacher] = useState('')
  const [infoClassroom, setInfoClassroom] = useState('')
  const [infoMemo, setInfoMemo] = useState('')
  const [addClassModal, setAddClassModal] = useState(false)
  const [addPeriod, setAddPeriod] = useState<number | ''>('')
  const [addSubject, setAddSubject] = useState('')
  const [addTeacher, setAddTeacher] = useState('')
  const [addClassroom, setAddClassroom] = useState('')

  useEffect(() => {
    setPeriodInfos(loadPeriodInfos())
    setCustomClasses(loadCustomClasses())
  }, [])

  useEffect(() => {
    const s = loadSettings()
    if (!s) { router.replace('/'); return }
    setSettings(s)

    const monday = getMonday(new Date())
    const friday = new Date(monday)
    friday.setDate(monday.getDate() + 4)

    const { school, grade, classNum } = s
    const params = new URLSearchParams({
      region: school.region,
      code: school.code,
      grade: String(grade),
      class: String(classNum),
      from: formatNeisDate(monday),
      to: formatNeisDate(friday),
      level: school.level,
    })

    fetch(`/api/neis/timetable?${params}`)
      .then((r) => r.json())
      .then((data) => { setTimetable(data.timetable ?? []); setLoading(false) })
      .catch(() => { setFetchError(true); setLoading(false) })
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const monday = getMonday(new Date())
  const { month: weekMonth, week: weekNum } = getWeekOfMonth(monday)

  const dayEntries = timetable.find((d) => d.weekday === selectedDay)?.entries ?? []
  // getDay() returns 0-6; selectedDay is 1-5 (sat/sun mapped to 5). On weekends getDay() won't match → no period highlighting.
  const isToday = new Date().getDay() === selectedDay
  const currentPeriod = isToday ? getCurrentPeriod() : null
  const pastPeriods = isToday ? getPastPeriods() : []
  const lunchNow = isToday && isLunchTime()
  const lunchPast = isToday && isLunchPast()

  function openInfo(period: number, subject: string) {
    const key = `${selectedDay}-${period}`
    const existing = periodInfos[key]
    setInfoTeacher(existing?.teacher ?? '')
    setInfoClassroom(existing?.classroom ?? '')
    setInfoMemo(existing?.memo ?? '')
    setInfoModal({ period, subject })
  }

  function getLastSavedInfoForSubject(subject: string): PeriodInfo | null {
    if (!infoModal) return null
    const currentKey = `${selectedDay}-${infoModal.period}`
    const allEntries = [
      ...timetable.flatMap(d => d.entries.map(e => ({ weekday: d.weekday, period: e.period, subject: e.subject }))),
      ...Object.entries(customClasses).map(([k, v]) => {
        const [wd, p] = k.split('-').map(Number)
        return { weekday: wd, period: p, subject: v.subject }
      })
    ]
    const candidates = allEntries
      .filter(e => e.subject === subject && `${e.weekday}-${e.period}` !== currentKey)
      .map(e => ({ key: `${e.weekday}-${e.period}`, info: periodInfos[`${e.weekday}-${e.period}`] }))
      .filter(({ info }) => info?.teacher || info?.classroom)
      .sort((a, b) => ((b.info as { timestamp?: number })?.timestamp ?? 0) - ((a.info as { timestamp?: number })?.timestamp ?? 0))
    return candidates[0]?.info ?? null
  }

  function handleSaveInfo() {
    if (!infoModal) return
    savePeriodInfo(selectedDay, infoModal.period, {
      teacher: infoTeacher,
      classroom: infoClassroom,
      memo: infoMemo,
    })
    setPeriodInfos(loadPeriodInfos())
    setInfoModal(null)
  }

  function getEmptyPeriods(): number[] {
    const usedPeriods = new Set([
      ...dayEntries.map(e => e.period),
      ...Object.entries(customClasses)
        .filter(([k]) => k.startsWith(`${selectedDay}-`))
        .map(([k]) => Number(k.split('-')[1])),
    ])
    return Object.keys(PERIOD_TIMES).map(Number).filter(p => !usedPeriods.has(p))
  }

  function handleAddClass() {
    if (!addSubject.trim() || addPeriod === '') return
    saveCustomClass(selectedDay, Number(addPeriod), {
      subject: addSubject.trim(),
      teacher: addTeacher.trim() || undefined,
      classroom: addClassroom.trim() || undefined,
    })
    setCustomClasses(loadCustomClasses())
    setAddClassModal(false)
    setAddPeriod('')
    setAddSubject('')
    setAddTeacher('')
    setAddClassroom('')
  }

  if (!settings) return null

  return (
    <div className="max-w-md mx-auto">
      {/* 헤더 */}
      <div className="bg-white px-4 py-3 border-b border-gray-100">
        <div className="flex items-baseline justify-between">
          <p className="text-lg font-bold text-gray-900">{settings.school.name}</p>
          <p className="text-xs text-blue-500 font-medium">{weekMonth}월 {weekNum}주차</p>
        </div>
        <p className="text-xs text-gray-400">{settings.grade}학년 {settings.classNum}반</p>
      </div>

      {/* 요일 탭 */}
      <WeekdayTabs selected={selectedDay} onChange={setSelectedDay} />

      {/* 교시 목록 */}
      <div className="p-3 flex flex-col gap-2">
        {loading && <p className="text-center text-sm text-gray-400 py-10">불러오는 중...</p>}
        {fetchError && (
          <p className="text-center text-sm text-red-400 py-10">불러오기 실패. 네트워크를 확인해 주세요</p>
        )}
        {!loading && !fetchError && (() => {
          const neisKeys = new Set(dayEntries.map(e => e.period))
          const customEntries = Object.entries(customClasses)
            .filter(([k]) => k.startsWith(`${selectedDay}-`) && !neisKeys.has(Number(k.split('-')[1])))
            .map(([k, v]) => ({ period: Number(k.split('-')[1]), subject: v.subject, isCustom: true as const }))

          const allEntries = [
            ...dayEntries.map(e => ({ ...e, isCustom: false as const })),
            ...customEntries,
          ].sort((a, b) => a.period - b.period)

          const emptyPeriods = getEmptyPeriods()

          return (
            <>
              {allEntries.length === 0 && emptyPeriods.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-10">시간표 정보가 없습니다</p>
              )}
              {allEntries.map((entry) => (
                <div key={entry.period}>
                  <PeriodCard
                    period={entry.period}
                    subject={entry.subject}
                    memo={periodInfos[`${selectedDay}-${entry.period}`]?.memo}
                    teacher={periodInfos[`${selectedDay}-${entry.period}`]?.teacher ?? (entry.isCustom ? customClasses[`${selectedDay}-${entry.period}`]?.teacher : undefined)}
                    classroom={periodInfos[`${selectedDay}-${entry.period}`]?.classroom ?? (entry.isCustom ? customClasses[`${selectedDay}-${entry.period}`]?.classroom : undefined)}
                    onClick={() => openInfo(entry.period, entry.subject)}
                    status={
                      entry.period === currentPeriod
                        ? 'current'
                        : pastPeriods.includes(entry.period)
                        ? 'past'
                        : 'future'
                    }
                  />
                  {entry.period === 4 && (
                    <div className={`mt-2 bg-white rounded-xl px-4 py-3 flex items-center gap-3 transition-opacity ${lunchNow ? 'ring-2 ring-green-400' : ''} ${lunchPast ? 'opacity-40' : ''}`}>
                      <div className="w-8 h-8 rounded-full bg-green-400 flex items-center justify-center shrink-0">
                        <span className="text-white text-sm">🍚</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">점심시간</p>
                        <p className={`text-xs ${lunchNow ? 'text-green-500 font-medium' : 'text-gray-400'}`}>
                          {lunchNow ? '진행 중 · ' : ''}12:50 – 13:50
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {emptyPeriods.length > 0 && (
                <button
                  onClick={() => { setAddPeriod(emptyPeriods[0]); setAddClassModal(true) }}
                  className="w-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm text-gray-400 font-medium"
                >
                  + 수업 추가
                </button>
              )}
            </>
          )
        })()}
      </div>

      {/* 정보 모달 */}
      {/* 수업 추가 모달 */}
      {addClassModal && (() => {
        const emptyPeriods = getEmptyPeriods()
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <div className="absolute inset-0 bg-black/40" onClick={() => setAddClassModal(false)} />
            <div className="relative w-full max-w-md bg-white rounded-2xl p-5 flex flex-col gap-3 shadow-xl">
              <h3 className="text-base font-bold text-gray-900">수업 추가</h3>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">교시</label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={addPeriod}
                  onChange={(e) => setAddPeriod(e.target.value === '' ? '' : Number(e.target.value))}
                >
                  <option value="">교시 선택</option>
                  {emptyPeriods.map(p => (
                    <option key={p} value={p}>{p}교시</option>
                  ))}
                </select>
              </div>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="과목명 (필수)"
                value={addSubject}
                onChange={(e) => setAddSubject(e.target.value)}
                autoFocus
              />
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="선생님 (선택)"
                value={addTeacher}
                onChange={(e) => setAddTeacher(e.target.value)}
              />
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="강의실 (선택)"
                value={addClassroom}
                onChange={(e) => setAddClassroom(e.target.value)}
              />
              <div className="flex gap-2">
                <button onClick={() => setAddClassModal(false)} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-500">취소</button>
                <button
                  onClick={handleAddClass}
                  disabled={!addSubject.trim() || addPeriod === ''}
                  className="flex-1 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold disabled:opacity-40"
                >추가</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* 정보 모달 */}
      {infoModal && (() => {
        const suggestion = getLastSavedInfoForSubject(infoModal.subject)
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <div className="absolute inset-0 bg-black/40" onClick={() => setInfoModal(null)} />
            <div className="relative w-full max-w-md bg-white rounded-2xl p-5 flex flex-col gap-3 shadow-xl">
              <h3 className="text-base font-bold text-gray-900">{infoModal.period}교시 {infoModal.subject}</h3>
              {suggestion && (
                <button
                  onClick={() => {
                    setInfoTeacher(suggestion.teacher ?? '')
                    setInfoClassroom(suggestion.classroom ?? '')
                  }}
                  className="text-xs text-blue-500 text-left px-3 py-2 bg-blue-50 rounded-xl"
                >
                  이전 {infoModal.subject} 불러오기 ({[suggestion.teacher, suggestion.classroom].filter(Boolean).join(' · ')})
                </button>
              )}
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="강의실 (예: 203호)"
                value={infoClassroom}
                onChange={(e) => setInfoClassroom(e.target.value)}
                autoFocus
              />
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="선생님 (예: 김철수 선생님)"
                value={infoTeacher}
                onChange={(e) => setInfoTeacher(e.target.value)}
              />
              <textarea
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-base text-gray-800 resize-none h-24 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="메모 (준비물, 공지 등)"
                value={infoMemo}
                onChange={(e) => setInfoMemo(e.target.value)}
              />
              <div className="flex gap-2">
                <button onClick={() => setInfoModal(null)} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-500">취소</button>
                <button onClick={handleSaveInfo} className="flex-1 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold">저장</button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
