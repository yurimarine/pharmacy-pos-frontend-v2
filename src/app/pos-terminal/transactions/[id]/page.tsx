import Link from 'next/link'
import { getTransactionById } from '@/app/admin/transactions/actions'
import { Button } from '@/components/ui/button'
import TransactionDetail from '@/components/pos/TransactionDetail'

export default async function POSTransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const transaction = await getTransactionById(id)

  if (!transaction) {
    return (
      <div className="p-8 text-center flex flex-col items-center gap-4">
        <p className="text-muted-foreground">Transaction not found.</p>
        <Button
          render={<Link href="/pos-terminal/transactions" />}
          nativeButton={false}
        >
          Back to Transactions
        </Button>
      </div>
    )
  }

  return (
    <TransactionDetail
      transaction={transaction}
      canVoid={false}
      backHref="/pos-terminal/transactions"
    />
  )
}
