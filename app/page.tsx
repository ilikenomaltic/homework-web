'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { loadSettings, saveSettings } from '@/lib/storage'
import type { School } from '@/lib/neis'
import { validateGrade, validateClassNum } from '@/lib/validation'

export default function OnboardingPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [schools, setSchools] = useState<School[]>([])
  const [selected, setSelected] = useState<School | null>(null)
  const [grade, setGrade] = useState('')
  const [classNum, setClassNum] = useState('')
  const [gradeError, setGradeError] = useState<string | null>(null)
  const [classNumError, setClassNumError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // 이미 설정된 경우 바로 시간표로
  useEffect(() => {
    if (loadSettings()) router.replace('/timetable')
  }, [router])

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setSchools([]); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/neis/school?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setSchools(data.schools ?? [])
    } catch {
      setSchools([])
    } finally {
      setLoading(false)
    }
  }, [])

  // 디바운스 300ms
  useEffect(() => {
    const t = setTimeout(() => search(query), 300)
    return () => clearTimeout(t)
  }, [query, search])

  function handleStart() {
    if (!selected || !grade || !classNum) return
    const gErr = validateGrade(grade, selected.level)
    const cErr = validateClassNum(classNum)
    if (gErr || cErr) {
      setGradeError(gErr)
      setClassNumError(cErr)
      return
    }
    saveSettings({ school: selected, grade: Number(grade), classNum: Number(classNum) })
    router.push('/timetable')
  }

  return (
    <div className="max-w-md mx-auto p-4 pt-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">교실 알리미</h1>
      <p className="text-sm text-gray-500 mb-6">학교를 검색해서 시작하세요</p>

      {/* 학교 검색 */}
      <div className="mb-4">
        <input
          className="w-full bg-white rounded-xl px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 ring-blue-400"
          placeholder="학교 이름 검색 (2글자 이상)"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelected(null); if (e.target.value.length < 2) setSchools([]) }}
        />
        {loading && <p className="text-xs text-gray-400 mt-1 px-1">검색 중...</p>}
      </div>

      {/* 검색 결과 */}
      {!selected && schools.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
          {schools.map((s) => (
            <button
              key={s.code}
              className="w-full text-left px-4 py-3 text-sm border-b border-gray-100 last:border-0 hover:bg-gray-50"
              onClick={() => { setSelected(s); setSchools([]); setQuery(s.name) }}
            >
              <span className="font-medium text-gray-900">{s.name}</span>
              <span className="ml-2 text-xs text-gray-400">
                {s.level === 'elementary' ? '초등' : s.level === 'middle' ? '중학교' : '고등학교'}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 학년/반 입력 */}
      {selected && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <p className="text-xs text-blue-500 font-medium mb-3">선택됨: {selected.name}</p>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">학년</label>
              <input
                type="number"
                min={1} max={6}
                className="w-full bg-gray-50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-blue-400"
                placeholder="예: 2"
                value={grade}
                onChange={(e) => {
                  setGrade(e.target.value)
                  setGradeError(selected ? validateGrade(e.target.value, selected.level) : null)
                }}
              />
              {gradeError && <p className="text-xs text-red-400 mt-1">{gradeError}</p>}
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">반</label>
              <input
                type="number"
                min={1}
                className="w-full bg-gray-50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-blue-400"
                placeholder="예: 2"
                value={classNum}
                onChange={(e) => {
                  setClassNum(e.target.value)
                  setClassNumError(validateClassNum(e.target.value))
                }}
              />
              {classNumError && <p className="text-xs text-red-400 mt-1">{classNumError}</p>}
            </div>
          </div>
        </div>
      )}

      {/* 시작 버튼 */}
      <button
        disabled={!selected || !grade || !classNum || !!gradeError || !!classNumError}
        onClick={handleStart}
        className="w-full bg-blue-500 disabled:bg-gray-200 text-white disabled:text-gray-400 rounded-xl py-3 text-sm font-semibold"
      >
        시작하기
      </button>
    </div>
  )
}
