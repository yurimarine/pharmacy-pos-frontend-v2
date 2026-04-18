import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/get-current-user'
import { getPOSInventory } from './actions'
import { POSLayout } from '@/components/pos/POSLayout'

export default async function POSTerminalPage() {
  let currentUser
  try {
    currentUser = await getCurrentUser()
  } catch {
    redirect('/auth/login')
  }

  if (!currentUser.pharmacy_id) {
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

  const inventory = await getPOSInventory(currentUser.pharmacy_id)

  return (
    <POSLayout
      inventory={inventory}
      pharmacyId={currentUser.pharmacy_id}
    />
  )
}
