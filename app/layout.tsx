import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Homework Web',
  description: '학교 시간표 & 학사일정 앱',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
