'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

interface ReportsTabsProps {
  activeTab: string
}

const TABS = [
  { id: 'analytics', label: 'Analytics' },
  { id: 'financial', label: 'Financial Summary' },
]

export function ReportsTabs({ activeTab }: ReportsTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const switchTab = useCallback(
    (tab: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('tab', tab)
      router.push(`/admin/reports?${params.toString()}`)
    },
    [router, searchParams],
  )

  return (
    <div className="flex border-b">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => switchTab(tab.id)}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === tab.id
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
