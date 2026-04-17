import type { ReactNode } from 'react'

type POSLayoutProps = {
  searchPanel: ReactNode
  cartPanel: ReactNode
}

export function POSLayout({ searchPanel, cartPanel }: POSLayoutProps) {
  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left: product search + results */}
      <div className="flex flex-1 flex-col overflow-hidden border-r">
        {searchPanel}
      </div>

      {/* Right: cart */}
      <div className="flex w-[420px] shrink-0 flex-col overflow-hidden">
        {cartPanel}
      </div>
    </div>
  )
}
