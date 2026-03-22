'use client'

import { useState } from 'react'

interface Props {
  label: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
}

export default function JsonViewer({ label, data }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-white rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-4 py-3 text-left flex justify-between items-center text-sm"
      >
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-400 text-xs">{open ? '닫기 ▲' : '보기 ▼'}</span>
      </button>
      {open && (
        <pre className="bg-gray-50 px-4 py-3 text-xs text-gray-600 overflow-auto max-h-80 border-t border-gray-100">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  )
}
