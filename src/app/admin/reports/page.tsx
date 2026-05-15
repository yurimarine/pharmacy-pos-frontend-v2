import { getCurrentUser } from '@/lib/get-current-user'
import { getPharmaciesForTransactionFilter } from '@/app/admin/transactions/actions'
import {
  getSalesSummary,
  getSalesByDate,
  getBestSellingProducts,
  getSalesByCategory,
  getSalesByStaff,
  getFinancialSummary,
  getSalesReport,
  getDiscountReport,
  getTillReport,
  getInventoryValueReport,
  getDeadStockReport,
} from './actions'
import { ReportsFilterBar } from '@/components/reports/ReportsFilterBar'
import { ReportsTabs } from '@/components/reports/ReportsTabs'
import { SalesSummaryCards } from '@/components/reports/SalesSummaryCards'
import { SalesByDateChart } from '@/components/reports/SalesByDateChart'
import { BestSellingProducts } from '@/components/reports/BestSellingProducts'
import { SalesByCategory } from '@/components/reports/SalesByCategory'
import { SalesByStaff } from '@/components/reports/SalesByStaff'
import { FinancialSummaryReport } from '@/components/reports/FinancialSummaryReport'
import { SalesReportDocument } from '@/components/reports/SalesReportDocument'
import { DiscountReportDocument } from '@/components/reports/DiscountReportDocument'
import { TillReconciliationReport } from '@/components/reports/TillReconciliationReport'
import { InventoryValueDocument } from '@/components/reports/InventoryValueDocument'
import { DeadStockDocument } from '@/components/reports/DeadStockDocument'

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
  searchParams: Promise<{
    dateFrom?: string
    dateTo?: string
    pharmacyId?: string
    tab?: string
    lookback?: string
  }>
}) {
  const params = await searchParams
  const defaults = defaultDateRange()

  const dateFrom = params.dateFrom ?? defaults.dateFrom
  const dateTo = params.dateTo ?? defaults.dateTo
  const pharmacyId = params.pharmacyId
  const activeTab = params.tab ?? 'analytics'
  const lookbackDays = Math.max(1, Number(params.lookback ?? '30'))

  const currentUser = await getCurrentUser()
  const isAdmin = currentUser.role === 'admin'

  const filters = { dateFrom, dateTo, pharmacyId }

  const pharmacies = isAdmin ? await getPharmaciesForTransactionFilter() : []

  const [
    summary,
    byDate,
    topProducts,
    byCategory,
    byStaff,
    financialSummary,
    salesReport,
    discountReport,
    tillReport,
    inventoryReport,
    deadStockReport,
  ] = await Promise.all([
    activeTab === 'analytics' ? getSalesSummary(filters) : Promise.resolve(null),
    activeTab === 'analytics' ? getSalesByDate(filters) : Promise.resolve(null),
    activeTab === 'analytics' ? getBestSellingProducts(filters) : Promise.resolve(null),
    activeTab === 'analytics' ? getSalesByCategory(filters) : Promise.resolve(null),
    activeTab === 'analytics' ? getSalesByStaff(filters) : Promise.resolve(null),
    activeTab === 'financial' ? getFinancialSummary(filters) : Promise.resolve(null),
    activeTab === 'sales' ? getSalesReport(filters) : Promise.resolve(null),
    activeTab === 'discount' ? getDiscountReport(filters) : Promise.resolve(null),
    activeTab === 'till' ? getTillReport(filters) : Promise.resolve(null),
    activeTab === 'inventory' ? getInventoryValueReport(pharmacyId) : Promise.resolve(null),
    activeTab === 'deadstock' ? getDeadStockReport(pharmacyId, lookbackDays) : Promise.resolve(null),
  ])

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0 @container/main">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
      </div>

      <ReportsFilterBar
        pharmacies={pharmacies}
        isAdmin={isAdmin}
        currentPharmacyId={pharmacyId ?? null}
        currentDateFrom={dateFrom}
        currentDateTo={dateTo}
        showDateRange={activeTab !== 'inventory' && activeTab !== 'deadstock'}
      />

      <ReportsTabs activeTab={activeTab} />

      {activeTab === 'analytics' && summary && byDate && topProducts && byCategory && byStaff && (
        <>
          <p className="text-muted-foreground text-sm -mt-2">
            Completed transactions only. Revenue figures exclude voided transactions.
          </p>
          <SalesSummaryCards summary={summary} />
          <SalesByDateChart data={byDate} />
          <div className="grid grid-cols-1 gap-6 @4xl/main:grid-cols-2">
            <BestSellingProducts data={topProducts} />
            <SalesByCategory data={byCategory} />
          </div>
          <SalesByStaff data={byStaff} />
        </>
      )}

      {activeTab === 'financial' && financialSummary && (
        <FinancialSummaryReport data={financialSummary} />
      )}

      {activeTab === 'sales' && salesReport && (
        <SalesReportDocument data={salesReport} />
      )}

      {activeTab === 'discount' && discountReport && (
        <DiscountReportDocument data={discountReport} />
      )}

      {activeTab === 'till' && tillReport && (
        <TillReconciliationReport data={tillReport} />
      )}

      {activeTab === 'inventory' && inventoryReport && (
        <InventoryValueDocument data={inventoryReport} />
      )}

      {activeTab === 'deadstock' && deadStockReport && (
        <DeadStockDocument data={deadStockReport} />
      )}
    </div>
  )
}
