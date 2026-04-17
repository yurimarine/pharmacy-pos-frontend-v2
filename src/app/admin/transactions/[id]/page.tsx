import TransactionDetail from '@/components/pos/TransactionDetail'

export default function AdminTransactionDetailPage() {
  return (
    <TransactionDetail
      canVoid={true}
      backHref="/admin/transactions"
    />
  )
}
