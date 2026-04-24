import { getCurrentUser } from '@/lib/get-current-user'
import { createClient } from '@/lib/supabase/server'
import { getTimeLogs } from './actions'
import { TimeLogsTable } from '@/components/time-logs/TimeLogsTable'

export default async function TimeLogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    pharmacy?: string
    role?: string
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

  const { data, count } = await getTimeLogs({
    pharmacyId: params.pharmacy,
    role: params.role,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    search: params.search,
    page,
    pageSize,
  })

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Time Logs</h1>
        <p className="text-sm text-muted-foreground">
          View attendance records for all staff across pharmacies.
        </p>
      </div>

      <TimeLogsTable
        data={data}
        count={count}
        pharmacies={pharmacies}
        currentPharmacyId={params.pharmacy ?? ''}
        currentRole={params.role ?? ''}
        currentDateFrom={params.dateFrom ?? ''}
        currentDateTo={params.dateTo ?? ''}
        currentSearch={params.search ?? ''}
        currentPage={page}
        pageSize={pageSize}
      />
    </div>
  )
}
