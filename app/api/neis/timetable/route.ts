import { NextRequest, NextResponse } from 'next/server'
import { getTimetableEndpoint, parseTimetableRows } from '@/lib/neis'
import type { SchoolLevel } from '@/lib/neis'

const BASE = 'https://open.neis.go.kr/hub'

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  const region = p.get('region') ?? ''
  const code = p.get('code') ?? ''
  const grade = p.get('grade') ?? ''
  const classNum = p.get('class') ?? ''
  const from = p.get('from') ?? ''
  const to = p.get('to') ?? ''
  const level = (p.get('level') ?? 'high') as SchoolLevel

  if (!region || !code || !grade || !classNum || !from || !to) {
    return NextResponse.json({ error: 'missing params' }, { status: 400 })
  }

  const VALID_LEVELS = new Set<string>(['elementary', 'middle', 'high'])
  if (!VALID_LEVELS.has(level)) {
    return NextResponse.json({ error: 'invalid level' }, { status: 400 })
  }

  if (!/^\d{8}$/.test(from) || !/^\d{8}$/.test(to)) {
    return NextResponse.json({ error: 'from/to must be YYYYMMDD' }, { status: 400 })
  }

  const endpoint = getTimetableEndpoint(level)
  const params = new URLSearchParams({
    KEY: process.env.NEIS_API_KEY ?? '',
    Type: 'json',
    pIndex: '1',
    pSize: '100',
    ATPT_OFCDC_SC_CODE: region,
    SD_SCHUL_CODE: code,
    AY: from.slice(0, 4),
    SEM: Number(from.slice(4, 6)) <= 7 ? '1' : '2',
    ALL_TI_YMD_FROM: from,
    ALL_TI_YMD_TO: to,
    GRADE: grade,
    CLASS_NM: classNum,
  })

  try {
    const res = await fetch(`${BASE}/${endpoint}?${params}`)

    if (!res.ok) {
      return NextResponse.json({ error: 'upstream error' }, { status: 502 })
    }

    const body = await res.json()

    // INFO-200 = 데이터 없음
    if (body?.RESULT?.CODE === 'INFO-200') {
      return NextResponse.json({
        timetable: Array.from({ length: 5 }, (_, i) => ({ weekday: i + 1, entries: [] })),
      })
    }

    const rows: Record<string, unknown>[] = body?.[endpoint]?.[1]?.row ?? []
    const weekStart = new Date(
      Number(from.slice(0, 4)),
      Number(from.slice(4, 6)) - 1,
      Number(from.slice(6, 8)),
    )
    const timetable = parseTimetableRows(rows, weekStart)

    return NextResponse.json({ timetable, raw: body })
  } catch (error) {
    return NextResponse.json({ error: 'upstream error' }, { status: 502 })
  }
}
