import { NextRequest, NextResponse } from 'next/server'
import { parseSchoolFromNeis } from '@/lib/neis'

const BASE = 'https://open.neis.go.kr/hub'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json({ schools: [] })
  }

  const params = new URLSearchParams({
    KEY: process.env.NEIS_API_KEY ?? '',
    Type: 'json',
    pIndex: '1',
    pSize: '20',
    SCHUL_NM: q,
  })

  const res = await fetch(`${BASE}/schoolInfo?${params}`)
  const body = await res.json()

  const rows: Record<string, string>[] = body?.schoolInfo?.[1]?.row ?? []
  const schools = rows
    .map(parseSchoolFromNeis)
    .filter((s) => s.code)

  return NextResponse.json({ schools })
}
