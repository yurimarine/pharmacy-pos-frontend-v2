'use client'

import { Printer } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/report-utils'
import type { DeadStockReport } from '@/app/admin/reports/actions'

const LOOKBACK_OPTIONS = [30, 60, 90] as const

function formatLastSold(isoStr: string | null): string {
  if (!isoStr) return 'Never'
  return new Date(isoStr).toLocaleDateString('en-PH', { month: 'short', year: 'numeric' })
}

function formatDate(isoStr: string) {
  return new Date(isoStr).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function DeadStockDocument({ data }: { data: DeadStockReport }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const switchLookback = useCallback(
    (days: number) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('lookback', String(days))
      router.push(`/admin/reports?${params.toString()}`)
    },
    [router, searchParams],
  )

  /**
   * Placeholder: future implementations may call a dedicated PDF generation
   * service (e.g. a /api/reports/pdf route backed by Puppeteer or react-pdf).
   * Currently delegates to the browser Print API + CSS print isolation via
   * the #report-print-section media query defined in globals.css.
   */
  function handlePrint() {
    window.print()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Controls — hidden on print */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">No sales in the last:</span>
          <div className="flex rounded-md border overflow-hidden">
            {LOOKBACK_OPTIONS.map(days => (
              <button
                key={days}
                onClick={() => switchLookback(days)}
                className={`px-3 py-1.5 text-sm transition-colors border-r last:border-r-0 ${
                  data.lookbackDays === days
                    ? 'bg-foreground text-background font-medium'
                    : 'hover:bg-muted text-foreground'
                }`}
              >
                {days}d
              </button>
            ))}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="size-4 mr-2" />
          Print / Save as PDF
        </Button>
      </div>

      <div
        id="report-print-section"
        className="bg-card border rounded-lg p-8 font-mono text-sm leading-relaxed overflow-x-auto"
      >
        {/* Header */}
        <div className="mb-6">
          <p className="text-base font-bold uppercase tracking-wide">{data.pharmacyName}</p>
          <p className="text-base font-semibold mt-0.5">Dead Stock Report</p>
          <p className="text-muted-foreground mt-1 text-xs">
            No sales in the last {data.lookbackDays} days
          </p>
          <p className="text-muted-foreground text-xs">As of: {formatDate(data.generatedAt)}</p>
        </div>

        <Divider />

        {/* Summary */}
        <section className="mb-6">
          <SectionLabel>Summary</SectionLabel>
          <SummaryRow
            label="Dead Stock SKUs"
            value={data.totals.totalDeadStockItems.toLocaleString('en-PH')}
          />
          <SummaryRow
            label="Total Dead Stock Quantity"
            value={data.totals.totalQuantity.toLocaleString('en-PH')}
          />
          <div className="border-t my-2" />
          <SummaryRow
            label="Total Capital at Risk"
            value={formatCurrency(data.totals.totalStockValue)}
            bold
          />
        </section>

        <Divider />

        {/* Items */}
        <section>
          <SectionLabel>
            Dead Stock Items — sorted by value, highest first
          </SectionLabel>
          {data.items.length === 0 ? (
            <p className="text-muted-foreground text-xs italic py-1">
              No dead stock found for the selected period.
            </p>
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-foreground/20">
                  <th className="text-left py-1.5 pr-4 font-semibold">Product</th>
                  <th className="text-left py-1.5 px-3 font-semibold">Category</th>
                  <th className="text-left py-1.5 px-3 font-semibold">Pharmacy</th>
                  <th className="text-right py-1.5 px-3 font-semibold">Qty</th>
                  <th className="text-right py-1.5 px-3 font-semibold">Unit Cost</th>
                  <th className="text-right py-1.5 px-3 font-semibold">Stock Value</th>
                  <th className="text-right py-1.5 pl-3 font-semibold">Last Sold</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((row, i) => (
                  <tr
                    key={`${row.pharmacyName}-${row.productName}`}
                    className={i % 2 !== 0 ? 'bg-muted/40' : ''}
                  >
                    <td className="py-1 pr-4">{row.productName}</td>
                    <td className="py-1 px-3 text-muted-foreground">{row.category ?? '—'}</td>
                    <td className="py-1 px-3 text-muted-foreground">{row.pharmacyName}</td>
                    <td className="py-1 px-3 text-right tabular-nums">
                      {row.quantity.toLocaleString('en-PH')}
                    </td>
                    <td className="py-1 px-3 text-right tabular-nums">
                      {formatCurrency(row.unitCost)}
                    </td>
                    <td className="py-1 px-3 text-right tabular-nums">
                      {formatCurrency(row.stockValue)}
                    </td>
                    <td className="py-1 pl-3 text-right text-muted-foreground">
                      {formatLastSold(row.lastSoldAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-foreground/20 font-semibold">
                  <td className="py-1.5 pr-4">TOTAL</td>
                  <td className="py-1.5 px-3" />
                  <td className="py-1.5 px-3" />
                  <td className="py-1.5 px-3 text-right tabular-nums">
                    {data.totals.totalQuantity.toLocaleString('en-PH')}
                  </td>
                  <td className="py-1.5 px-3" />
                  <td className="py-1.5 px-3 text-right tabular-nums">
                    {formatCurrency(data.totals.totalStockValue)}
                  </td>
                  <td className="py-1.5 pl-3" />
                </tr>
              </tfoot>
            </table>
          )}
        </section>

        <Divider />

        <p className="text-xs text-muted-foreground">
          Note: Products with no sales record are shown as Last Sold: Never. Items with unit cost
          of 0 are excluded from stock value calculations.
        </p>
      </div>
    </div>
  )
}

function Divider() {
  return <div className="border-t border-dashed my-5" />
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">{children}</p>
  )
}

function SummaryRow({
  label,
  value,
  bold,
}: {
  label: string
  value: string
  bold?: boolean
}) {
  return (
    <div
      className={`flex justify-between py-0.5 tabular-nums ${bold ? 'font-semibold' : ''}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}
