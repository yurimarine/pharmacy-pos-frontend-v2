import { getCurrentUser } from '@/lib/get-current-user'
import { getTransactions, getPharmaciesForTransactionFilter } from './actions'
import { TransactionsTable } from '@/components/transactions/TransactionsTable'

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string
    status?: string
    pharmacy?: string
    page?: string
    dateFrom?: string
    dateTo?: string
  }>
}) {
  const params = await searchParams
  const currentUser = await getCurrentUser()
  const isAdminUser = currentUser.role === 'admin'

  const page = Math.max(1, Number(params.page ?? 1))
  const pageSize = 20

  const pharmacyId = isAdminUser
    ? params.pharmacy
    : (currentUser.pharmacy_id ?? undefined)

  const [{ data: transactions, count }, pharmacies] = await Promise.all([
    getTransactions({
      pharmacyId,
      search: params.search,
      status: params.status,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      page,
      pageSize,
    }),
    isAdminUser ? getPharmaciesForTransactionFilter() : Promise.resolve([]),
  ])

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
        <p className="text-sm text-muted-foreground">
          View and manage sales transactions
        </p>
      </div>

      <TransactionsTable
        transactions={transactions}
        pharmacies={pharmacies}
        totalCount={count}
        currentPage={page}
        pageSize={pageSize}
        currentSearch={params.search ?? ''}
        currentStatus={params.status ?? 'all'}
        currentPharmacyId={params.pharmacy ?? ''}
        currentDateFrom={params.dateFrom ?? ''}
        currentDateTo={params.dateTo ?? ''}
        isAdmin={isAdminUser}
        currentUserId={currentUser.id}
        basePath="/admin/transactions"
      />
    </div>
  )
}
