import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/get-current-user'
import { getTransactions } from '@/app/admin/transactions/actions'
import { TransactionsTable } from '@/components/transactions/TransactionsTable'

export default async function POSTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string
    status?: string
    page?: string
    dateFrom?: string
    dateTo?: string
  }>
}) {
  const params = await searchParams

  let currentUser
  try {
    currentUser = await getCurrentUser()
  } catch {
    redirect('/auth/login')
  }

  if (!currentUser.pharmacy_id) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Account not linked to a pharmacy. Contact your administrator.</p>
      </div>
    )
  }

  const page = Math.max(1, Number(params.page ?? 1))
  const pageSize = 20

  const { data: transactions, count } = await getTransactions({
    pharmacyId: currentUser.pharmacy_id,
    search: params.search,
    status: params.status,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    page,
    pageSize,
  })

  return (
    <div className="flex flex-col gap-6 p-6 overflow-y-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
        <p className="text-sm text-muted-foreground">
          Sales history for your pharmacy
        </p>
      </div>

      <TransactionsTable
        transactions={transactions}
        pharmacies={[]}
        totalCount={count}
        currentPage={page}
        pageSize={pageSize}
        currentSearch={params.search ?? ''}
        currentStatus={params.status ?? 'all'}
        currentPharmacyId={currentUser.pharmacy_id}
        currentDateFrom={params.dateFrom ?? ''}
        currentDateTo={params.dateTo ?? ''}
        isAdmin={false}
        currentUserId={currentUser.id}
        basePath="/pos-terminal/transactions"
      />
    </div>
  )
}
