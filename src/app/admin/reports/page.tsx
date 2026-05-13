import { getCurrentUser } from '@/lib/get-current-user'
import { getPharmaciesForTransactionFilter } from '@/app/admin/transactions/actions'
import {
  getSalesSummary,
  getSalesByDate,
  getBestSellingProducts,
  getSalesByCategory,
  getSalesByStaff,
} from './actions'
import { ReportsFilterBar } from '@/components/reports/ReportsFilterBar'
import { SalesSummaryCards } from '@/components/reports/SalesSummaryCards'
import { SalesByDateChart } from '@/components/reports/SalesByDateChart'
import { BestSellingProducts } from '@/components/reports/BestSellingProducts'
import { SalesByCategory } from '@/components/reports/SalesByCategory'
import { SalesByStaff } from '@/components/reports/SalesByStaff'

function defaultDateRange() {
  const to = new Date()
  const from = new Date()
  from.setDate(to.getDate() - 29)
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  return { dateFrom: fmt(from), dateTo: fmt(to) }
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ dateFrom?: string; dateTo?: string; pharmacyId?: string }>
}) {
  const params = await searchParams
  const defaults = defaultDateRange()

  const dateFrom = params.dateFrom ?? defaults.dateFrom
  const dateTo = params.dateTo ?? defaults.dateTo
  const pharmacyId = params.pharmacyId

  const currentUser = await getCurrentUser()
  const isAdmin = currentUser.role === 'admin'

  const filters = { dateFrom, dateTo, pharmacyId }

  const [pharmacies, summary, byDate, topProducts, byCategory, byStaff] = await Promise.all([
    isAdmin ? getPharmaciesForTransactionFilter() : Promise.resolve([]),
    getSalesSummary(filters),
    getSalesByDate(filters),
    getBestSellingProducts(filters),
    getSalesByCategory(filters),
    getSalesByStaff(filters),
  ])

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0 @container/main">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Sales Reports</h1>
        <p className="text-muted-foreground text-sm">
          Completed transactions only. Revenue figures exclude voided transactions.
        </p>
      </div>

      <ReportsFilterBar
        pharmacies={pharmacies}
        isAdmin={isAdmin}
        currentPharmacyId={pharmacyId ?? null}
        currentDateFrom={dateFrom}
        currentDateTo={dateTo}
      />

      <SalesSummaryCards summary={summary} />

      <SalesByDateChart data={byDate} />

      <div className="grid grid-cols-1 gap-6 @4xl/main:grid-cols-2">
        <BestSellingProducts data={topProducts} />
        <SalesByCategory data={byCategory} />
      </div>

      <SalesByStaff data={byStaff} />
    </div>
  )
}
