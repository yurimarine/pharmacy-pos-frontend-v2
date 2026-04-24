export const CASH_DENOMINATIONS = [1, 5, 10, 20, 50, 100, 200, 500, 1000] as const

export type CashDenomination = typeof CASH_DENOMINATIONS[number]

export type CashBreakdown = {
  [K in CashDenomination]?: number
}

export function computeCashTotal(breakdown: CashBreakdown): number {
  return CASH_DENOMINATIONS.reduce((sum, denom) => {
    return sum + denom * (breakdown[denom] ?? 0)
  }, 0)
}

export type TillSessionStatus = 'open' | 'closed' | 'force_closed'

export type TillSession = {
  id: string
  pharmacy_id: string
  opened_by: string
  closed_by: string | null
  status: TillSessionStatus
  opening_cash: number
  closing_cash: number | null
  expected_cash: number | null
  discrepancy: number | null
  transaction_count: number
  opening_cash_breakdown: CashBreakdown | null
  closing_cash_breakdown: CashBreakdown | null
  opening_notes: string | null
  closing_notes: string | null
  opened_at: string
  closed_at: string | null
  created_at: string
  updated_at: string
}

export type TillSessionWithRelations = TillSession & {
  pharmacies: { name: string } | null
  opened_by_user: { name: string; role: string } | null
  closed_by_user: { name: string } | null
}

export const TILL_SESSION_STATUS_LABELS: Record<TillSessionStatus, string> = {
  open: 'Open',
  closed: 'Closed',
  force_closed: 'Force Closed',
}
