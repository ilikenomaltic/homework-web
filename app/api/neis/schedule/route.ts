import { NextRequest, NextResponse } from 'next/server'
import { parseScheduleRows } from '@/lib/neis'

const BASE = 'https://open.neis.go.kr/hub'

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  const region = p.get('region') ?? ''
  const code = p.get('code') ?? ''
  const from = p.get('from') ?? ''
  const to = p.get('to') ?? ''

  if (!region || !code || !from || !to) {
    return NextResponse.json({ error: 'missing params' }, { status: 400 })
  }

  // Validate date format (YYYYMMDD)
  if (!/^\d{8}$/.test(from) || !/^\d{8}$/.test(to)) {
    return NextResponse.json({ error: 'invalid date format' }, { status: 400 })
  }

  const params = new URLSearchParams({
    KEY: process.env.NEIS_API_KEY ?? '',
    Type: 'json',
    pIndex: '1',
    pSize: '100',
    ATPT_OFCDC_SC_CODE: region,
    SD_SCHUL_CODE: code,
    AA_YMD_FROM: from,
    AA_YMD_TO: to,
  })

  try {
    const res = await fetch(`${BASE}/SchoolSchedule?${params}`)

    if (!res.ok) {
      return NextResponse.json({ error: 'upstream error' }, { status: 502 })
    }

    const body = await res.json()

    if (body?.RESULT?.CODE === 'INFO-200') {
      return NextResponse.json({ events: [], raw: body })
    }

    const rows: Record<string, unknown>[] = body?.SchoolSchedule?.[1]?.row ?? []
    const events = parseScheduleRows(rows)

    return NextResponse.json({ events, raw: body })
  } catch (error) {
    return NextResponse.json({ error: 'upstream error' }, { status: 502 })
  }
}
