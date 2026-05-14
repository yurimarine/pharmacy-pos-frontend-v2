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

export type DiscountReportItem = {
  discountName: string
  type: 'percentage' | 'fixed'
  scope: 'per_item' | 'whole_cart'
  value: number
  timesUsed: number
  totalDeducted: number
}

export type DiscountReport = {
  cartDiscounts: DiscountReportItem[]
  itemDiscounts: DiscountReportItem[]
  totals: {
    totalDiscountAmount: number
    transactionsWithDiscount: number
    transactionsWithoutDiscount: number
    totalTransactions: number
  }
  pharmacyName: string
  startDate: string
  endDate: string
}

export async function getDiscountReport(filters: ReportFilters): Promise<DiscountReport> {
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

  const [cartResult, itemsResult, summaryResult] = await Promise.all([
    supabase.rpc('get_discount_report_cart', rpcParams),
    supabase.rpc('get_discount_report_items', rpcParams),
    supabase.rpc('get_discount_report_summary', rpcParams),
  ])

  if (cartResult.error) throw new Error(cartResult.error.message)
  if (itemsResult.error) throw new Error(itemsResult.error.message)
  if (summaryResult.error) throw new Error(summaryResult.error.message)

  const mapItem = (row: Record<string, unknown>): DiscountReportItem => ({
    discountName: String(row.discount_name),
    type: String(row.type) as 'percentage' | 'fixed',
    scope: String(row.scope) as 'per_item' | 'whole_cart',
    value: Number(row.value),
    timesUsed: Number(row.times_used),
    totalDeducted: Number(row.total_deducted),
  })

  const cartDiscounts = ((cartResult.data as Record<string, unknown>[]) ?? []).map(mapItem)
  const itemDiscounts = ((itemsResult.data as Record<string, unknown>[]) ?? []).map(mapItem)

  const summaryRow = ((summaryResult.data as Record<string, unknown>[])[0]) ?? {}
  const totalTransactions = Number(summaryRow.total_transactions ?? 0)
  const transactionsWithDiscount = Number(summaryRow.transactions_with_discount ?? 0)
  const totalDiscountAmount =
    cartDiscounts.reduce((s, r) => s + r.totalDeducted, 0) +
    itemDiscounts.reduce((s, r) => s + r.totalDeducted, 0)

  return {
    cartDiscounts,
    itemDiscounts,
    totals: {
      totalDiscountAmount,
      transactionsWithDiscount,
      transactionsWithoutDiscount: totalTransactions - transactionsWithDiscount,
      totalTransactions,
    },
    pharmacyName,
    startDate: filters.dateFrom,
    endDate: filters.dateTo,
  }
}

export type TillReportSession = {
  id: string
  staffName: string
  pharmacyName: string
  openedAt: string
  closedAt: string | null
  status: 'closed' | 'force_closed'
  openingCash: number
  closingCash: number | null
  expectedCash: number | null
  discrepancy: number | null
  transactionCount: number
}

export type TillReport = {
  sessions: TillReportSession[]
  totals: {
    totalSessions: number
    totalOpeningCash: number
    totalExpectedCash: number
    totalActualCash: number
    totalDiscrepancy: number
    sessionsWithDiscrepancy: number
  }
  pharmacyName: string
  startDate: string
  endDate: string
}

export async function getTillReport(filters: ReportFilters): Promise<TillReport> {
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

  const { data, error } = await supabase.rpc('get_till_report', {
    p_pharmacy_id: pharmacyId ?? null,
    p_date_from: `${filters.dateFrom}T00:00:00`,
    p_date_to: `${filters.dateTo}T23:59:59`,
  })
  if (error) throw new Error(error.message)

  const sessions: TillReportSession[] = ((data as Record<string, unknown>[]) ?? []).map(row => ({
    id: String(row.id),
    staffName: String(row.staff_name),
    pharmacyName: String(row.pharmacy_name),
    openedAt: String(row.opened_at),
    closedAt: row.closed_at != null ? String(row.closed_at) : null,
    status: String(row.status) as 'closed' | 'force_closed',
    openingCash: Number(row.opening_cash ?? 0),
    closingCash: row.closing_cash != null ? Number(row.closing_cash) : null,
    expectedCash: row.expected_cash != null ? Number(row.expected_cash) : null,
    discrepancy: row.discrepancy != null ? Number(row.discrepancy) : null,
    transactionCount: Number(row.transaction_count ?? 0),
  }))

  const totals = {
    totalSessions: sessions.length,
    totalOpeningCash: sessions.reduce((s, r) => s + r.openingCash, 0),
    totalExpectedCash: sessions.reduce((s, r) => s + (r.expectedCash ?? 0), 0),
    totalActualCash: sessions.reduce((s, r) => s + (r.closingCash ?? 0), 0),
    totalDiscrepancy: sessions.reduce((s, r) => s + (r.discrepancy ?? 0), 0),
    sessionsWithDiscrepancy: sessions.filter(
      r => r.discrepancy != null && r.discrepancy !== 0,
    ).length,
  }

  return {
    sessions,
    totals,
    pharmacyName,
    startDate: filters.dateFrom,
    endDate: filters.dateTo,
  }
}

export type InventoryValueItem = {
  productName: string
  category: string | null
  pharmacyName: string
  quantity: number
  unitCost: number
  sellingPrice: number
  stockValue: number
  retailValue: number
  potentialProfit: number
}

export type InventoryValueReport = {
  items: InventoryValueItem[]
  totals: {
    totalQuantity: number
    totalStockValue: number
    totalRetailValue: number
    totalPotentialProfit: number
  }
  byPharmacy: {
    pharmacyName: string
    totalStockValue: number
    totalRetailValue: number
    totalPotentialProfit: number
  }[]
  showByPharmacy: boolean
  generatedAt: string
  pharmacyName: string
}

export async function getInventoryValueReport(pharmacyId?: string): Promise<InventoryValueReport> {
  const supabase = await createClient()
  const resolvedPharmacyId = await resolvePharmacyId(pharmacyId)

  let pharmacyName = 'All Pharmacies'
  if (resolvedPharmacyId) {
    const { data: pharmacy } = await supabase
      .from('pharmacies')
      .select('name')
      .eq('id', resolvedPharmacyId)
      .single()
    if (pharmacy?.name) pharmacyName = String(pharmacy.name)
  }

  const { data, error } = await supabase.rpc('get_inventory_value_report', {
    p_pharmacy_id: resolvedPharmacyId ?? null,
  })
  if (error) throw new Error(error.message)

  const items: InventoryValueItem[] = ((data as Record<string, unknown>[]) ?? []).map(row => {
    const quantity = Number(row.quantity)
    const unitCost = Number(row.unit_cost)
    const sellingPrice = Number(row.selling_price)
    const stockValue = quantity * unitCost
    const retailValue = quantity * sellingPrice
    return {
      productName: String(row.product_name),
      category: row.category ? String(row.category) : null,
      pharmacyName: String(row.pharmacy_name),
      quantity,
      unitCost,
      sellingPrice,
      stockValue,
      retailValue,
      potentialProfit: retailValue - stockValue,
    }
  })

  const pharmacyMap = new Map<
    string,
    { totalStockValue: number; totalRetailValue: number; totalPotentialProfit: number }
  >()
  for (const item of items) {
    const prev = pharmacyMap.get(item.pharmacyName) ?? {
      totalStockValue: 0,
      totalRetailValue: 0,
      totalPotentialProfit: 0,
    }
    pharmacyMap.set(item.pharmacyName, {
      totalStockValue: prev.totalStockValue + item.stockValue,
      totalRetailValue: prev.totalRetailValue + item.retailValue,
      totalPotentialProfit: prev.totalPotentialProfit + item.potentialProfit,
    })
  }

  return {
    items,
    totals: {
      totalQuantity: items.reduce((s, r) => s + r.quantity, 0),
      totalStockValue: items.reduce((s, r) => s + r.stockValue, 0),
      totalRetailValue: items.reduce((s, r) => s + r.retailValue, 0),
      totalPotentialProfit: items.reduce((s, r) => s + r.potentialProfit, 0),
    },
    byPharmacy: Array.from(pharmacyMap.entries()).map(([name, t]) => ({
      pharmacyName: name,
      ...t,
    })),
    showByPharmacy: !resolvedPharmacyId,
    generatedAt: new Date().toISOString(),
    pharmacyName,
  }
}

export type DeadStockItem = {
  productName: string
  category: string | null
  pharmacyName: string
  quantity: number
  unitCost: number
  stockValue: number
  lastSoldAt: string | null
}

export type DeadStockReport = {
  items: DeadStockItem[]
  totals: {
    totalDeadStockItems: number
    totalQuantity: number
    totalStockValue: number
  }
  lookbackDays: number
  generatedAt: string
  pharmacyName: string
}

export async function getDeadStockReport(
  pharmacyId?: string,
  lookbackDays: number = 30,
): Promise<DeadStockReport> {
  const supabase = await createClient()
  const resolvedPharmacyId = await resolvePharmacyId(pharmacyId)

  let pharmacyName = 'All Pharmacies'
  if (resolvedPharmacyId) {
    const { data: pharmacy } = await supabase
      .from('pharmacies')
      .select('name')
      .eq('id', resolvedPharmacyId)
      .single()
    if (pharmacy?.name) pharmacyName = String(pharmacy.name)
  }

  const { data, error } = await supabase.rpc('get_dead_stock_report', {
    p_pharmacy_id: resolvedPharmacyId ?? null,
    p_lookback_days: lookbackDays,
  })
  if (error) throw new Error(error.message)

  const items: DeadStockItem[] = ((data as Record<string, unknown>[]) ?? []).map(row => {
    const quantity = Number(row.quantity)
    const unitCost = Number(row.unit_cost)
    return {
      productName: String(row.product_name),
      category: row.category ? String(row.category) : null,
      pharmacyName: String(row.pharmacy_name),
      quantity,
      unitCost,
      stockValue: quantity * unitCost,
      lastSoldAt: row.last_sold_at ? String(row.last_sold_at) : null,
    }
  })

  return {
    items,
    totals: {
      totalDeadStockItems: items.length,
      totalQuantity: items.reduce((s, r) => s + r.quantity, 0),
      totalStockValue: items.reduce((s, r) => s + r.stockValue, 0),
    },
    lookbackDays,
    generatedAt: new Date().toISOString(),
    pharmacyName,
  }
}
