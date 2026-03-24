'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadSettings, clearSettings, loadAllergies, saveAllergies } from '@/lib/storage'
import { formatNeisDate } from '@/lib/neis'
import JsonViewer from '@/components/JsonViewer'
import AllergyChips from '@/components/AllergyChips'

export default function SettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<ReturnType<typeof loadSettings>>(null)
  const [timetableRaw, setTimetableRaw] = useState(null)
  const [scheduleRaw, setScheduleRaw] = useState(null)
  const [allergies, setAllergies] = useState<number[]>([])

  useEffect(() => {
    const s = loadSettings()
    if (!s) { router.replace('/'); return }
    setSettings(s)
    fetchRaw(s)
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setAllergies(loadAllergies())
  }, [])

  async function fetchRaw(s = settings) {
    if (!s) return
    try {
      const { school, grade, classNum } = s
      const today = new Date()
      const monday = new Date(today)
      const diff = today.getDay() === 0 ? -6 : 1 - today.getDay()
      monday.setDate(today.getDate() + diff)
      const friday = new Date(monday)
      friday.setDate(monday.getDate() + 4)

      const tp = new URLSearchParams({
        region: school.region, code: school.code,
        grade: String(grade), class: String(classNum),
        from: formatNeisDate(monday), to: formatNeisDate(friday),
        level: school.level,
      })
      const m = today.getMonth()
      const lastDay = new Date(today.getFullYear(), m + 1, 0).getDate()
      const sp = new URLSearchParams({
        region: school.region, code: school.code,
        from: `${today.getFullYear()}${String(m + 1).padStart(2, '0')}01`,
        to: `${today.getFullYear()}${String(m + 1).padStart(2, '0')}${String(lastDay).padStart(2, '0')}`,
      })

      const [tt, sc] = await Promise.all([
        fetch(`/api/neis/timetable?${tp}`).then(r => r.json()),
        fetch(`/api/neis/schedule?${sp}`).then(r => r.json()),
      ])
      setTimetableRaw(tt.raw)
      setScheduleRaw(sc.raw)
    } catch (error) {
      console.error('Failed to fetch NEIS data:', error)
    }
  }

  function handleAllergyChange(codes: number[]) {
    setAllergies(codes)
    saveAllergies(codes)
  }

  if (!settings) return null

  return (
    <div className="max-w-md mx-auto p-4 pt-6">
      <h1 className="text-lg font-bold text-gray-900 mb-4">설정</h1>

      {/* 현재 설정 */}
      <div className="bg-white rounded-xl px-4 py-4 mb-4">
        <p className="text-xs text-gray-400 mb-1">학교</p>
        <p className="text-sm font-semibold text-gray-900">{settings.school.name}</p>
        <p className="text-xs text-gray-500 mt-2">{settings.grade}학년 {settings.classNum}반</p>
      </div>

      {/* 학교 변경 */}
      <button
        onClick={() => { clearSettings(); router.push('/') }}
        className="w-full bg-white text-blue-500 rounded-xl py-3 text-sm font-medium mb-6"
      >
        학교 변경
      </button>

      {/* 알레르기 설정 */}
      <section className="mb-6">
        <h2 className="text-xs font-medium text-gray-400 mb-2 px-1">알레르기 설정</h2>
        <p className="text-sm text-gray-400 mb-3 px-1">급식 메뉴에서 해당 식품을 경고해드려요</p>
        <AllergyChips selected={allergies} onChange={handleAllergyChange} />
      </section>

      {/* NEIS API JSON 뷰어 */}
      <p className="text-xs text-gray-400 font-medium mb-2 px-1">NEIS API 응답 확인</p>
      <div className="flex flex-col gap-2">
        <JsonViewer label="시간표 API 원본 (hisTimetable)" data={timetableRaw} />
        <JsonViewer label="학사일정 API 원본 (SchoolSchedule)" data={scheduleRaw} />
      </div>
    </div>
  )
}
