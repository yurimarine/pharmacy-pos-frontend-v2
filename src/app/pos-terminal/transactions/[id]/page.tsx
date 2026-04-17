import TransactionDetail from '@/components/pos/TransactionDetail'

export default function POSTransactionDetailPage() {
  return (
    <TransactionDetail
      canVoid={false}
      backHref="/pos-terminal/transactions"
    />
  )
}
