import { getCurrentUser } from '@/lib/get-current-user'
import { createClient } from '@/lib/supabase/server'
import { getTillSessions } from './actions'
import { TillSessionsTable } from '@/components/till-sessions/TillSessionsTable'

export default async function TillSessionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    pharmacy?: string
    status?: string
    dateFrom?: string
    dateTo?: string
    search?: string
    page?: string
  }>
}) {
  const params = await searchParams
  await getCurrentUser()

  const page = Math.max(1, Number(params.page ?? 1))
  const pageSize = 20

  const supabase = await createClient()
  const { data: pharmaciesData } = await supabase
    .from('pharmacies')
    .select('id, name')
    .order('name', { ascending: true })

  const pharmacies = pharmaciesData ?? []

  const { data, count } = await getTillSessions({
    pharmacyId: params.pharmacy,
    status: params.status,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    search: params.search,
    page,
    pageSize,
  })

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Till Sessions</h1>
        <p className="text-sm text-muted-foreground">
          View and manage all till sessions across pharmacies.
        </p>
      </div>

      <TillSessionsTable
        data={data}
        count={count}
        pharmacies={pharmacies}
        currentPharmacyId={params.pharmacy ?? ''}
        currentStatus={params.status ?? 'all'}
        currentDateFrom={params.dateFrom ?? ''}
        currentDateTo={params.dateTo ?? ''}
        currentSearch={params.search ?? ''}
        currentPage={page}
        pageSize={pageSize}
      />
    </div>
  )
}
