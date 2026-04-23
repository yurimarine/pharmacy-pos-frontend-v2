'use client'

import { useState } from 'react'
import { usePOS } from '@/context/POSContext'
import { POSLayout } from '@/components/pos/POSLayout'
import { OpenTillModal } from '@/components/pos/OpenTillModal'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LockKeyholeIcon } from 'lucide-react'

export default function POSTerminalPage() {
  const { tillSession, pharmacyId, inventory } = usePOS()
  const [openTillModalOpen, setOpenTillModalOpen] = useState(false)

  if (!pharmacyId) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground p-8">
        <p className="text-center text-sm">
          Your account is not linked to a pharmacy.
          <br />
          Contact your administrator.
        </p>
      </div>
    )
  }

  if (!tillSession) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="items-center text-center">
            <LockKeyholeIcon className="size-12 text-muted-foreground mb-2" />
            <CardTitle>Till is Not Open</CardTitle>
            <CardDescription>
              Open the till to start processing sales for your shift.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button
              className="w-full"
              onClick={() => setOpenTillModalOpen(true)}
            >
              Open Till
            </Button>
          </CardFooter>
        </Card>
        <OpenTillModal
          open={openTillModalOpen}
          onOpenChange={setOpenTillModalOpen}
        />
      </div>
    )
  }

  return <POSLayout inventory={inventory} pharmacyId={pharmacyId} />
}
