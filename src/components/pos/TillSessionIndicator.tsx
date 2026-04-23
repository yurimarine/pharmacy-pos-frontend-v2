'use client'

import { useState, useEffect } from 'react'
import { LogOutIcon, ClockIcon } from 'lucide-react'
import { usePOS } from '@/context/POSContext'
import { CloseTillModal } from '@/components/pos/CloseTillModal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function TillSessionIndicator() {
  const { tillSession } = usePOS()
  const [closeTillModalOpen, setCloseTillModalOpen] = useState(false)
  // Incrementing key forces CloseTillModal to remount with fresh state on each open
  const [modalKey, setModalKey] = useState(0)
  const [elapsedTime, setElapsedTime] = useState('')

  useEffect(() => {
    if (!tillSession) return

    function updateElapsed() {
      const startDate = new Date(tillSession!.opened_at)
      const diffMins = Math.floor(
        (new Date().getTime() - startDate.getTime()) / 60000
      )
      const hours = Math.floor(diffMins / 60)
      const mins = diffMins % 60
      setElapsedTime(hours > 0 ? `${hours}h ${mins}m` : `${mins}m`)
    }

    updateElapsed()
    const id = setInterval(updateElapsed, 60000)
    return () => clearInterval(id)
  }, [tillSession])

  if (!tillSession) return null

  function handleOpenModal() {
    setModalKey((k) => k + 1)
    setCloseTillModalOpen(true)
  }

  return (
    <div className="flex items-center gap-2">
      <div className="size-2 rounded-full bg-green-500 shrink-0" />
      <span className="text-sm font-medium text-muted-foreground">
        Till Open
      </span>
      <Badge variant="outline" className="gap-1 text-xs">
        <ClockIcon className="size-3" />
        {elapsedTime}
      </Badge>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={handleOpenModal}
      >
        <LogOutIcon className="size-3.5" />
        End Shift
      </Button>
      <CloseTillModal
        key={modalKey}
        open={closeTillModalOpen}
        onOpenChange={setCloseTillModalOpen}
      />
    </div>
  )
}
