import { PackageIcon } from 'lucide-react'

export default function POSInventoryPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground p-8">
      <PackageIcon className="size-12 opacity-30" />
      <p className="font-medium text-foreground">Inventory</p>
      <p className="text-sm text-center max-w-xs">
        Quick inventory lookup for the POS terminal. Coming in a future prompt.
      </p>
    </div>
  )
}
