import { NextRequest, NextResponse } from 'next/server'
import { parseMealRows } from '@/lib/neis'

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

  if (!/^\d{8}$/.test(from) || !/^\d{8}$/.test(to)) {
    return NextResponse.json({ error: 'from/to must be YYYYMMDD' }, { status: 400 })
  }

  const params = new URLSearchParams({
    KEY: process.env.NEIS_API_KEY ?? '',
    Type: 'json',
    pIndex: '1',
    pSize: '100',
    ATPT_OFCDC_SC_CODE: region,
    SD_SCHUL_CODE: code,
    MLSV_FROM_YMD: from,
    MLSV_TO_YMD: to,
    MMEAL_SC_CODE: '2', // 중식
  })

  try {
    const res = await fetch(`${BASE}/mealServiceDietInfo?${params}`)
    if (!res.ok) {
      return NextResponse.json({ error: 'upstream error' }, { status: 502 })
    }

    const body = await res.json()

    if (body?.RESULT?.CODE === 'INFO-200') {
      return NextResponse.json({ meals: [] })
    }

    const rows: Record<string, unknown>[] = body?.mealServiceDietInfo?.[1]?.row ?? []
    const meals = parseMealRows(rows)

    return NextResponse.json({ meals })
  } catch {
    return NextResponse.json({ error: 'upstream error' }, { status: 502 })
  }
}
