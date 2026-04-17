import { POSLayout } from '@/components/pos/POSLayout'
import { POSSearchPanel } from '@/components/pos/POSSearchPanel'
import { POSCartPanel } from '@/components/pos/POSCartPanel'

export default function POSTerminalPage() {
  return (
    <POSLayout
      searchPanel={<POSSearchPanel />}
      cartPanel={<POSCartPanel />}
    />
  )
}
