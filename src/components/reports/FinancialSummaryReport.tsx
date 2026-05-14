'use client'

import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/report-utils'
import type { FinancialSummary } from '@/app/admin/reports/actions'

function formatReportDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatAccounting(value: number): string {
  const formatted = formatCurrency(Math.abs(value))
  return value < 0 ? `(${formatted})` : formatted
}

interface FinancialSummaryReportProps {
  data: FinancialSummary
}

export function FinancialSummaryReport({ data }: FinancialSummaryReportProps) {
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
    <div className="flex flex-col gap-4 max-w-2xl">
      <div className="flex justify-end print:hidden">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="size-4 mr-2" />
          Print / Save as PDF
        </Button>
      </div>

      <div
        id="report-print-section"
        className="bg-card border rounded-lg p-8 font-mono text-sm leading-relaxed"
      >
        {/* Header */}
        <div className="mb-6">
          <p className="text-base font-bold uppercase tracking-wide">{data.pharmacyName}</p>
          <p className="text-base font-semibold mt-0.5">Financial Summary Report</p>
          <p className="text-muted-foreground mt-2 text-xs">
            Period: {formatReportDate(data.startDate)} – {formatReportDate(data.endDate)}
          </p>
          <p className="text-muted-foreground text-xs">Generated: {generatedDate}</p>
        </div>

        <Divider />

        {/* Revenue */}
        <Section label="Revenue">
          <Row label="Gross Sales" value={formatCurrency(data.grossRevenue)} />
          <Row
            label="Less: Discounts"
            value={`(${formatCurrency(data.totalDiscounts)})`}
            muted
          />
          <div className="border-t my-2" />
          <Row label="Net Revenue" value={formatCurrency(data.netRevenue)} bold />
        </Section>

        {/* COGS */}
        <Section label="Cost of Goods Sold">
          {data.hasCogs ? (
            <Row
              label="Total COGS"
              value={`(${formatCurrency(data.cogs)})`}
              muted
            />
          ) : (
            <p className="text-muted-foreground text-xs italic py-0.5">
              COGS data unavailable — unit cost not captured on these transactions.
            </p>
          )}
        </Section>

        {/* Gross Profit */}
        <Section label="Gross Profit">
          <Row
            label="Gross Profit"
            value={data.hasCogs ? formatAccounting(data.grossProfit) : '—'}
            bold
          />
          <Row
            label="Gross Profit Margin"
            value={data.hasCogs ? `${data.grossProfitMargin.toFixed(2)}%` : '—'}
          />
        </Section>

        <Divider />

        {/* Transaction Summary */}
        <Section label="Transaction Summary">
          <Row
            label="Completed Transactions"
            value={data.totalTransactions.toLocaleString('en-PH')}
          />
          <Row
            label="Voided Transactions"
            value={data.voidedTransactions.toLocaleString('en-PH')}
            muted
          />
          <Row
            label="Average Transaction Value"
            value={formatCurrency(data.averageTransactionValue)}
          />
        </Section>

        <Divider />

        <p className="text-xs text-muted-foreground leading-relaxed">
          Note: COGS figures are based on the unit cost snapshot captured at time of sale.
          Transactions processed before the unit cost feature was enabled are excluded from
          COGS and gross profit calculations.
        </p>
      </div>
    </div>
  )
}

function Divider() {
  return <div className="border-t border-dashed my-5" />
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">{label}</p>
      {children}
    </section>
  )
}

function Row({
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
