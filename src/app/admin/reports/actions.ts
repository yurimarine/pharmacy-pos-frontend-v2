'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/get-current-user'

export type SalesSummary = {
  total_revenue: number
  transaction_count: number
  avg_transaction_value: number
  total_items_sold: number
}

export type DailySales = {
  sale_date: string
  revenue: number
  transaction_count: number
}

export type ProductSalesRank = {
  product_id: string
  product_name: string
  category: string | null
  quantity_sold: number
  revenue: number
}

export type CategorySales = {
  category: string
  quantity_sold: number
  revenue: number
}

export type StaffSales = {
  staff_id: string
  staff_name: string
  transaction_count: number
  revenue: number
}

type ReportFilters = {
  pharmacyId?: string
  dateFrom: string
  dateTo: string
}

// Enforce pharmacy scoping: non-admin users always see only their pharmacy
async function resolvePharmacyId(requestedPharmacyId?: string): Promise<string | undefined> {
  const currentUser = await getCurrentUser()
  if (currentUser.role === 'pharmacist' || currentUser.role === 'pharmacy_assistant') {
    return currentUser.pharmacy_id ?? undefined
  }
  return requestedPharmacyId || undefined
}

export async function getSalesSummary(filters: ReportFilters): Promise<SalesSummary> {
  const supabase = await createClient()
  const pharmacyId = await resolvePharmacyId(filters.pharmacyId)

  const { data, error } = await supabase.rpc('get_sales_summary', {
    p_pharmacy_id: pharmacyId ?? null,
    p_date_from: `${filters.dateFrom}T00:00:00`,
    p_date_to: `${filters.dateTo}T23:59:59`,
  })

  if (error) throw new Error(error.message)
  const row = (data as SalesSummary[])[0]
  return {
    total_revenue: Number(row?.total_revenue ?? 0),
    transaction_count: Number(row?.transaction_count ?? 0),
    avg_transaction_value: Number(row?.avg_transaction_value ?? 0),
    total_items_sold: Number(row?.total_items_sold ?? 0),
  }
}

export async function getSalesByDate(filters: ReportFilters): Promise<DailySales[]> {
  const supabase = await createClient()
  const pharmacyId = await resolvePharmacyId(filters.pharmacyId)

  const { data, error } = await supabase.rpc('get_sales_by_date', {
    p_pharmacy_id: pharmacyId ?? null,
    p_date_from: `${filters.dateFrom}T00:00:00`,
    p_date_to: `${filters.dateTo}T23:59:59`,
  })

  if (error) throw new Error(error.message)
  return ((data as DailySales[]) ?? []).map(row => ({
    sale_date: String(row.sale_date),
    revenue: Number(row.revenue),
    transaction_count: Number(row.transaction_count),
  }))
}

export async function getBestSellingProducts(filters: ReportFilters): Promise<ProductSalesRank[]> {
  const supabase = await createClient()
  const pharmacyId = await resolvePharmacyId(filters.pharmacyId)

  const { data, error } = await supabase.rpc('get_best_selling_products', {
    p_pharmacy_id: pharmacyId ?? null,
    p_date_from: `${filters.dateFrom}T00:00:00`,
    p_date_to: `${filters.dateTo}T23:59:59`,
    p_limit: 20,
  })

  if (error) throw new Error(error.message)
  return ((data as ProductSalesRank[]) ?? []).map(row => ({
    product_id: String(row.product_id),
    product_name: String(row.product_name),
    category: row.category ? String(row.category) : null,
    quantity_sold: Number(row.quantity_sold),
    revenue: Number(row.revenue),
  }))
}

export async function getSalesByCategory(filters: ReportFilters): Promise<CategorySales[]> {
  const supabase = await createClient()
  const pharmacyId = await resolvePharmacyId(filters.pharmacyId)

  const { data, error } = await supabase.rpc('get_sales_by_category', {
    p_pharmacy_id: pharmacyId ?? null,
    p_date_from: `${filters.dateFrom}T00:00:00`,
    p_date_to: `${filters.dateTo}T23:59:59`,
  })

  if (error) throw new Error(error.message)
  return ((data as CategorySales[]) ?? []).map(row => ({
    category: String(row.category),
    quantity_sold: Number(row.quantity_sold),
    revenue: Number(row.revenue),
  }))
}

export async function getSalesByStaff(filters: ReportFilters): Promise<StaffSales[]> {
  const supabase = await createClient()
  const pharmacyId = await resolvePharmacyId(filters.pharmacyId)

  const { data, error } = await supabase.rpc('get_sales_by_staff', {
    p_pharmacy_id: pharmacyId ?? null,
    p_date_from: `${filters.dateFrom}T00:00:00`,
    p_date_to: `${filters.dateTo}T23:59:59`,
  })

  if (error) throw new Error(error.message)
  return ((data as StaffSales[]) ?? []).map(row => ({
    staff_id: String(row.staff_id),
    staff_name: String(row.staff_name),
    transaction_count: Number(row.transaction_count),
    revenue: Number(row.revenue),
  }))
}

export type SalesReportDaily = {
  date: string
  transactionCount: number
  grossSales: number
  totalDiscounts: number
  netSales: number
}

export type SalesReportProduct = {
  productName: string
  category: string | null
  quantitySold: number
  grossRevenue: number
  discountAmount: number
  netRevenue: number
}

export type SalesReport = {
  dailyBreakdown: SalesReportDaily[]
  productBreakdown: SalesReportProduct[]
  totals: {
    totalTransactions: number
    totalGrossSales: number
    totalDiscounts: number
    totalNetSales: number
    totalItemsSold: number
  }
  pharmacyName: string
  startDate: string
  endDate: string
}

export async function getSalesReport(filters: ReportFilters): Promise<SalesReport> {
  const supabase = await createClient()
  const pharmacyId = await resolvePharmacyId(filters.pharmacyId)

  let pharmacyName = 'All Pharmacies'
  if (pharmacyId) {
    const { data: pharmacy } = await supabase
      .from('pharmacies')
      .select('name')
      .eq('id', pharmacyId)
      .single()
    if (pharmacy?.name) pharmacyName = String(pharmacy.name)
  }

  const rpcParams = {
    p_pharmacy_id: pharmacyId ?? null,
    p_date_from: `${filters.dateFrom}T00:00:00`,
    p_date_to: `${filters.dateTo}T23:59:59`,
  }

  const [dailyResult, productsResult] = await Promise.all([
    supabase.rpc('get_sales_report_daily', rpcParams),
    supabase.rpc('get_sales_report_products', rpcParams),
  ])

  if (dailyResult.error) throw new Error(dailyResult.error.message)
  if (productsResult.error) throw new Error(productsResult.error.message)

  const daily = ((dailyResult.data as Record<string, unknown>[]) ?? []).map(row => ({
    date: String(row.sale_date),
    transactionCount: Number(row.transaction_count),
    grossSales: Number(row.gross_sales),
    totalDiscounts: Number(row.total_discounts),
    netSales: Number(row.net_sales),
  }))

  const products = ((productsResult.data as Record<string, unknown>[]) ?? []).map(row => ({
    productName: String(row.product_name),
    category: row.category ? String(row.category) : null,
    quantitySold: Number(row.quantity_sold),
    grossRevenue: Number(row.gross_revenue),
    discountAmount: Number(row.discount_amount),
    netRevenue: Number(row.net_revenue),
  }))

  const totals = {
    totalTransactions: daily.reduce((s, r) => s + r.transactionCount, 0),
    totalGrossSales: daily.reduce((s, r) => s + r.grossSales, 0),
    totalDiscounts: daily.reduce((s, r) => s + r.totalDiscounts, 0),
    totalNetSales: daily.reduce((s, r) => s + r.netSales, 0),
    totalItemsSold: products.reduce((s, r) => s + r.quantitySold, 0),
  }

  return {
    dailyBreakdown: daily,
    productBreakdown: products,
    totals,
    pharmacyName,
    startDate: filters.dateFrom,
    endDate: filters.dateTo,
  }
}

export type FinancialSummary = {
  grossRevenue: number
  totalDiscounts: number
  netRevenue: number
  cogs: number
  grossProfit: number
  grossProfitMargin: number
  totalTransactions: number
  voidedTransactions: number
  averageTransactionValue: number
  hasCogs: boolean
  pharmacyName: string
  startDate: string
  endDate: string
}

export async function getFinancialSummary(filters: ReportFilters): Promise<FinancialSummary> {
  const supabase = await createClient()
  const pharmacyId = await resolvePharmacyId(filters.pharmacyId)

  let pharmacyName = 'All Pharmacies'
  if (pharmacyId) {
    const { data: pharmacy } = await supabase
      .from('pharmacies')
      .select('name')
      .eq('id', pharmacyId)
      .single()
    if (pharmacy?.name) pharmacyName = String(pharmacy.name)
  }

  const { data, error } = await supabase.rpc('get_financial_summary', {
    p_pharmacy_id: pharmacyId ?? null,
    p_date_from: `${filters.dateFrom}T00:00:00`,
    p_date_to: `${filters.dateTo}T23:59:59`,
  })
  if (error) throw new Error(error.message)

  const row = ((data as Record<string, unknown>[])[0]) ?? {}
  const grossRevenue           = Number(row.gross_revenue ?? 0)
  const totalDiscounts         = Number(row.total_discounts ?? 0)
  const cogs                   = Number(row.cogs ?? 0)
  const netRevenue             = grossRevenue - totalDiscounts
  const grossProfit            = netRevenue - cogs
  const grossProfitMargin      = netRevenue > 0
    ? Math.round((grossProfit / netRevenue) * 10000) / 100
    : 0
  const totalTransactions      = Number(row.total_transactions ?? 0)
  const voidedTransactions     = Number(row.voided_transactions ?? 0)
  const totalAmountSum         = Number(row.total_amount_sum ?? 0)
  const averageTransactionValue = totalTransactions > 0 ? totalAmountSum / totalTransactions : 0

  return {
    grossRevenue,
    totalDiscounts,
    netRevenue,
    cogs,
    grossProfit,
    grossProfitMargin,
    totalTransactions,
    voidedTransactions,
    averageTransactionValue,
    hasCogs: cogs > 0,
    pharmacyName,
    startDate: filters.dateFrom,
    endDate: filters.dateTo,
  }
}
