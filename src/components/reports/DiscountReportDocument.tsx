'use client'

import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/report-utils'
import type { DiscountReport, DiscountReportItem } from '@/app/admin/reports/actions'

function formatReportDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatDiscountType(type: string): string {
  return type === 'percentage' ? 'Percentage' : 'Fixed'
}

function formatDiscountValue(type: string, value: number): string {
  return type === 'percentage' ? `${value}%` : formatCurrency(value)
}

export function DiscountReportDocument({ data }: { data: DiscountReport }) {
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

  const cartTotal = data.cartDiscounts.reduce((s, r) => s + r.totalDeducted, 0)
  const cartTimesTotal = data.cartDiscounts.reduce((s, r) => s + r.timesUsed, 0)
  const itemTotal = data.itemDiscounts.reduce((s, r) => s + r.totalDeducted, 0)
  const itemTimesTotal = data.itemDiscounts.reduce((s, r) => s + r.timesUsed, 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end print:hidden">
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
          <p className="text-base font-semibold mt-0.5">Discount Report</p>
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
            label="Transactions with Discounts"
            value={data.totals.transactionsWithDiscount.toLocaleString('en-PH')}
          />
          <SummaryRow
            label="Transactions without Discounts"
            value={data.totals.transactionsWithoutDiscount.toLocaleString('en-PH')}
            muted
          />
          <div className="border-t my-2" />
          <SummaryRow
            label="Total Discount Amount"
            value={`(${formatCurrency(data.totals.totalDiscountAmount)})`}
            bold
          />
        </section>

        <Divider />

        {/* Cart-Level Discounts */}
        <section className="mb-6">
          <SectionLabel>Cart-Level Discounts</SectionLabel>
          {data.cartDiscounts.length === 0 ? (
            <p className="text-muted-foreground text-xs italic py-1">
              No cart-level discounts applied in this period.
            </p>
          ) : (
            <DiscountTable rows={data.cartDiscounts} timesTotal={cartTimesTotal} amountTotal={cartTotal} />
          )}
        </section>

        <Divider />

        {/* Item-Level Discounts */}
        <section className="mb-6">
          <SectionLabel>Item-Level Discounts</SectionLabel>
          {data.itemDiscounts.length === 0 ? (
            <p className="text-muted-foreground text-xs italic py-1">
              No item-level discounts applied in this period.
            </p>
          ) : (
            <DiscountTable rows={data.itemDiscounts} timesTotal={itemTimesTotal} amountTotal={itemTotal} />
          )}
        </section>

        <Divider />

        {/* Grand Total */}
        <div className="flex justify-between font-semibold tabular-nums">
          <span>GRAND TOTAL DISCOUNTS</span>
          <span>{`(${formatCurrency(data.totals.totalDiscountAmount)})`}</span>
        </div>
      </div>
    </div>
  )
}

function DiscountTable({
  rows,
  timesTotal,
  amountTotal,
}: {
  rows: DiscountReportItem[]
  timesTotal: number
  amountTotal: number
}) {
  return (
    <table className="w-full text-xs border-collapse">
      <thead>
        <tr className="border-b-2 border-foreground/20">
          <th className="text-left py-1.5 pr-4 font-semibold">Discount Name</th>
          <th className="text-left py-1.5 px-3 font-semibold">Type</th>
          <th className="text-right py-1.5 px-3 font-semibold">Value</th>
          <th className="text-right py-1.5 px-3 font-semibold">Times Used</th>
          <th className="text-right py-1.5 pl-3 font-semibold">Total Deducted</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={`${row.discountName}-${i}`} className={i % 2 !== 0 ? 'bg-muted/40' : ''}>
            <td className="py-1 pr-4">{row.discountName}</td>
            <td className="py-1 px-3 text-muted-foreground">{formatDiscountType(row.type)}</td>
            <td className="py-1 px-3 text-right tabular-nums">
              {formatDiscountValue(row.type, row.value)}
            </td>
            <td className="py-1 px-3 text-right tabular-nums">
              {row.timesUsed.toLocaleString('en-PH')}
            </td>
            <td className="py-1 pl-3 text-right tabular-nums">
              {`(${formatCurrency(row.totalDeducted)})`}
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="border-t-2 border-foreground/20 font-semibold">
          <td className="py-1.5 pr-4" colSpan={3}>
            TOTAL
          </td>
          <td className="py-1.5 px-3 text-right tabular-nums">
            {timesTotal.toLocaleString('en-PH')}
          </td>
          <td className="py-1.5 pl-3 text-right tabular-nums">
            {`(${formatCurrency(amountTotal)})`}
          </td>
        </tr>
      </tfoot>
    </table>
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
