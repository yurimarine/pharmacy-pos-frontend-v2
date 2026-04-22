import Link from 'next/link'
import { getCurrentUser } from '@/lib/get-current-user'
import { getTransactionById } from '../actions'
import { Button } from '@/components/ui/button'
import TransactionDetail from '@/components/pos/TransactionDetail'

export default async function AdminTransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [currentUser, transaction] = await Promise.all([
    getCurrentUser(),
    getTransactionById(id),
  ])

  if (!transaction) {
    return (
      <div className="p-8 text-center flex flex-col items-center gap-4">
        <p className="text-muted-foreground">Transaction not found.</p>
        <Button render={<Link href="/admin/transactions" />} nativeButton={false}>
          Back to Transactions
        </Button>
      </div>
    )
  }

  return (
    <TransactionDetail
      transaction={transaction}
      canVoid={currentUser.role === 'admin'}
      backHref="/admin/transactions"
    />
  )
}
