'use client'
import React, { useEffect, useState } from 'react'

export type Season = 'autumn' | 'winter'

interface Props {
  value?: Season
  onChange?: (s: Season) => void
}

export default function SeasonToggle({ value, onChange }: Props) {
  const [season, setSeason] = useState<Season>('autumn')

  // مقدار ذخیره‌شده رو از localStorage بخون
  useEffect(() => {
    if (!value) {
      const saved = (localStorage.getItem('season') as Season) || 'autumn'
      setSeason(saved)
      onChange?.(saved)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // اگه مقدار از props بیاد
  useEffect(() => {
    if (value) setSeason(value)
  }, [value])

  const handle = (s: Season) => {
    setSeason(s)
    localStorage.setItem('season', s)
    onChange?.(s)
  }

  const btnBase =
    'px-3 py-1.5 rounded-2xl text-sm font-medium transition-all border'

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className={`${btnBase} ${
          season === 'autumn'
            ? 'bg-amber-200 border-amber-300'
            : 'bg-white border-slate-200'
        }`}
        onClick={() => handle('autumn')}
        aria-pressed={season === 'autumn'}
      >
        🍁 پاییز
      </button>
      <button
        type="button"
        className={`${btnBase} ${
          season === 'winter'
            ? 'bg-blue-200 border-blue-300'
            : 'bg-white border-slate-200'
        }`}
        onClick={() => handle('winter')}
        aria-pressed={season === 'winter'}
      >
        ❄ زمستان
      </button>
    </div>
  )
}
