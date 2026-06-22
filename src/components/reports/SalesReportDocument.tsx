'use client'

import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { formatCurrency } from '@/lib/report-utils'
import type { SalesReport } from '@/app/admin/reports/actions'

function formatReportDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatDiscount(value: number): string {
  if (value === 0) return '—'
  return `(${formatCurrency(value)})`
}

export function SalesReportDocument({ data }: { data: SalesReport }) {
  /**
   * Placeholder: future implementations may call a dedicated PDF generation
   * service (e.g. a /api/reports/pdf route backed by Puppeteer or react-pdf).
   * Currently delegates to the browser Print API + CSS print isolation via
   * the #report-print-section media query defined in globals.css.
   */
  function handlePrint() {
    window.print()
  }

  const generatedDate = new Date().toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end print:hidden">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="outline" size="icon" onClick={handlePrint}>
                <Printer className="size-4" />
              </Button>
            }
          />
          <TooltipContent>
            <p>Print/Save</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div
        id="report-print-section"
        className="bg-card border rounded-lg p-8 font-mono text-sm leading-relaxed overflow-x-auto"
      >
        {/* Header */}
        <div className="mb-6">
          <p className="text-base font-bold uppercase tracking-wide">{data.pharmacyName}</p>
          <p className="text-base font-semibold mt-0.5">Sales Report</p>
          <p className="text-muted-foreground mt-2 text-xs">
            Period: {formatReportDate(data.startDate)} – {formatReportDate(data.endDate)}
          </p>
          <p className="text-muted-foreground text-xs">Generated: {generatedDate}</p>
        </div>

        <Divider />

        {/* Summary */}
        <section className="mb-6">
          <SectionLabel>Summary</SectionLabel>
          <SummaryRow
            label="Total Transactions"
            value={data.totals.totalTransactions.toLocaleString('en-PH')}
          />
          <SummaryRow
            label="Total Items Sold"
            value={data.totals.totalItemsSold.toLocaleString('en-PH')}
          />
          <div className="border-t border-dashed my-2" />
          <SummaryRow label="Gross Sales" value={formatCurrency(data.totals.totalGrossSales)} />
          <SummaryRow
            label="Total Discounts"
            value={formatDiscount(data.totals.totalDiscounts)}
            muted={data.totals.totalDiscounts === 0}
          />
          <div className="border-t my-2" />
          <SummaryRow label="Net Sales" value={formatCurrency(data.totals.totalNetSales)} bold />
        </section>

        <Divider />

        {/* Daily Breakdown */}
        <section className="mb-6">
          <SectionLabel>Daily Breakdown</SectionLabel>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-foreground/20">
                <th className="text-left py-1.5 pr-4 font-semibold">Date</th>
                <th className="text-right py-1.5 px-3 font-semibold">Transactions</th>
                <th className="text-right py-1.5 px-3 font-semibold">Gross Sales</th>
                <th className="text-right py-1.5 px-3 font-semibold">Discounts</th>
                <th className="text-right py-1.5 pl-3 font-semibold">Net Sales</th>
              </tr>
            </thead>
            <tbody>
              {data.dailyBreakdown.map((row, i) => (
                <tr key={row.date} className={i % 2 !== 0 ? 'bg-muted/40' : ''}>
                  <td className="py-1 pr-4">{formatReportDate(row.date)}</td>
                  <td className="py-1 px-3 text-right tabular-nums">{row.transactionCount}</td>
                  <td className="py-1 px-3 text-right tabular-nums">
                    {formatCurrency(row.grossSales)}
                  </td>
                  <td className="py-1 px-3 text-right tabular-nums text-muted-foreground">
                    {formatDiscount(row.totalDiscounts)}
                  </td>
                  <td className="py-1 pl-3 text-right tabular-nums">
                    {formatCurrency(row.netSales)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-foreground/20 font-semibold">
                <td className="py-1.5 pr-4">TOTAL</td>
                <td className="py-1.5 px-3 text-right tabular-nums">
                  {data.totals.totalTransactions.toLocaleString('en-PH')}
                </td>
                <td className="py-1.5 px-3 text-right tabular-nums">
                  {formatCurrency(data.totals.totalGrossSales)}
                </td>
                <td className="py-1.5 px-3 text-right tabular-nums">
                  {formatDiscount(data.totals.totalDiscounts)}
                </td>
                <td className="py-1.5 pl-3 text-right tabular-nums">
                  {formatCurrency(data.totals.totalNetSales)}
                </td>
              </tr>
            </tfoot>
          </table>
        </section>

        <Divider />

        {/* Product Breakdown */}
        <section>
          <SectionLabel>Product Sales Breakdown</SectionLabel>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-foreground/20">
                <th className="text-left py-1.5 pr-4 font-semibold">Product</th>
                <th className="text-left py-1.5 px-3 font-semibold">Category</th>
                <th className="text-right py-1.5 px-3 font-semibold">Qty Sold</th>
                <th className="text-right py-1.5 px-3 font-semibold">Gross Revenue</th>
                <th className="text-right py-1.5 pl-3 font-semibold">Net Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.productBreakdown.map((row, i) => (
                <tr key={row.productName} className={i % 2 !== 0 ? 'bg-muted/40' : ''}>
                  <td className="py-1 pr-4">{row.productName}</td>
                  <td className="py-1 px-3 text-muted-foreground">{row.category ?? '—'}</td>
                  <td className="py-1 px-3 text-right tabular-nums">
                    {row.quantitySold.toLocaleString('en-PH')}
                  </td>
                  <td className="py-1 px-3 text-right tabular-nums">
                    {formatCurrency(row.grossRevenue)}
                  </td>
                  <td className="py-1 pl-3 text-right tabular-nums">
                    {formatCurrency(row.netRevenue)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-foreground/20 font-semibold">
                <td className="py-1.5 pr-4">TOTAL</td>
                <td className="py-1.5 px-3" />
                <td className="py-1.5 px-3 text-right tabular-nums">
                  {data.totals.totalItemsSold.toLocaleString('en-PH')}
                </td>
                <td className="py-1.5 px-3 text-right tabular-nums">
                  {formatCurrency(data.totals.totalGrossSales)}
                </td>
                <td className="py-1.5 pl-3 text-right tabular-nums">
                  {formatCurrency(data.totals.totalNetSales)}
                </td>
              </tr>
            </tfoot>
          </table>
        </section>
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
  muted,
}: {
  label: string
  value: string
  bold?: boolean
  muted?: boolean
}) {
  return (
    <div
      className={`flex justify-between py-0.5 tabular-nums ${bold ? 'font-semibold' : ''} ${muted ? 'text-muted-foreground' : ''}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}
