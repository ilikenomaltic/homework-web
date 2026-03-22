import type { Metadata } from 'next'
import './globals.css'
import BottomNav from '@/components/BottomNav'

export const metadata: Metadata = {
  title: '교실 알리미',
  description: '학교 시간표 + 학사일정 알리미',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-[#f2f2f7] min-h-screen pb-16">
        {children}
        <BottomNav />
      </body>
    </html>
  )
}

