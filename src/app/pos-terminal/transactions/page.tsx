import { ClockIcon } from 'lucide-react'

export default function POSTransactionsPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground p-8">
      <ClockIcon className="size-12 opacity-30" />
      <p className="font-medium text-foreground">Transaction History</p>
      <p className="text-sm text-center max-w-xs">
        Recent transactions and void management for this session. Coming in a future prompt.
      </p>
    </div>
  )
}
