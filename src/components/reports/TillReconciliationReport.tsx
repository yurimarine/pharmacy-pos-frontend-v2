'use client'

import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { formatCurrency } from '@/lib/report-utils'
import type { TillReport, TillReportSession } from '@/app/admin/reports/actions'

function formatReportDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function formatDiscrepancy(value: number | null): string {
  if (value == null || value === 0) return '—'
  if (value < 0) return `(${formatCurrency(Math.abs(value))})`
  return formatCurrency(value)
}

export function TillReconciliationReport({ data }: { data: TillReport }) {
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

  const hasForceClosed = data.sessions.some(s => s.status === 'force_closed')

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
          <p className="text-base font-semibold mt-0.5">Till Reconciliation Report</p>
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
            label="Total Sessions"
            value={data.totals.totalSessions.toLocaleString('en-PH')}
          />
          <SummaryRow
            label="Sessions with Discrepancy"
            value={data.totals.sessionsWithDiscrepancy.toLocaleString('en-PH')}
          />
          <div className="border-t border-dashed my-2" />
          <SummaryRow
            label="Total Expected Cash"
            value={formatCurrency(data.totals.totalExpectedCash)}
          />
          <SummaryRow
            label="Total Actual Cash"
            value={formatCurrency(data.totals.totalActualCash)}
          />
          <div className="border-t my-2" />
          <SummaryRow
            label="Net Discrepancy"
            value={formatDiscrepancy(data.totals.totalDiscrepancy)}
            bold
          />
        </section>

        <Divider />

        {/* Session Detail */}
        <section>
          <SectionLabel>Session Detail</SectionLabel>
          {data.sessions.length === 0 ? (
            <p className="text-muted-foreground text-xs italic py-1">
              No closed sessions found in this period.
            </p>
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-foreground/20">
                  <th className="text-left py-1.5 pr-3 font-semibold">Staff</th>
                  <th className="text-left py-1.5 px-3 font-semibold">Pharmacy</th>
                  <th className="text-left py-1.5 px-3 font-semibold">Opened</th>
                  <th className="text-left py-1.5 px-3 font-semibold">Closed</th>
                  <th className="text-right py-1.5 px-3 font-semibold">Txns</th>
                  <th className="text-right py-1.5 px-3 font-semibold">Expected</th>
                  <th className="text-right py-1.5 px-3 font-semibold">Actual</th>
                  <th className="text-right py-1.5 pl-3 font-semibold">Discrepancy</th>
                </tr>
              </thead>
              <tbody>
                {data.sessions.map((session, i) => (
                  <SessionRow key={session.id} session={session} index={i} />
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-foreground/20 font-semibold">
                  <td className="py-1.5 pr-3">TOTAL</td>
                  <td className="py-1.5 px-3" />
                  <td className="py-1.5 px-3" />
                  <td className="py-1.5 px-3" />
                  <td className="py-1.5 px-3 text-right tabular-nums">
                    {data.sessions
                      .reduce((s, r) => s + r.transactionCount, 0)
                      .toLocaleString('en-PH')}
                  </td>
                  <td className="py-1.5 px-3 text-right tabular-nums">
                    {formatCurrency(data.totals.totalExpectedCash)}
                  </td>
                  <td className="py-1.5 px-3 text-right tabular-nums">
                    {formatCurrency(data.totals.totalActualCash)}
                  </td>
                  <td className="py-1.5 pl-3 text-right tabular-nums">
                    {formatDiscrepancy(data.totals.totalDiscrepancy)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </section>

        {hasForceClosed && (
          <p className="text-xs text-muted-foreground mt-4">
            * Session was force-closed by admin.
          </p>
        )}
      </div>
    </div>
  )
}

function SessionRow({ session, index }: { session: TillReportSession; index: number }) {
  const hasDiscrepancy = session.discrepancy != null && session.discrepancy !== 0
  const isForce = session.status === 'force_closed'

  return (
    <tr
      className={[
        index % 2 !== 0 ? 'bg-muted/40' : '',
        hasDiscrepancy ? 'bg-red-50 print:bg-transparent dark:bg-red-950/20' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <td className="py-1 pr-3 whitespace-nowrap">
        {session.staffName}
        {isForce && <span className="text-muted-foreground ml-0.5">*</span>}
      </td>
      <td className="py-1 px-3 whitespace-nowrap text-muted-foreground">
        {session.pharmacyName}
      </td>
      <td className="py-1 px-3 whitespace-nowrap">{formatDateTime(session.openedAt)}</td>
      <td className="py-1 px-3 whitespace-nowrap">
        {session.closedAt ? formatDateTime(session.closedAt) : '—'}
      </td>
      <td className="py-1 px-3 text-right tabular-nums">{session.transactionCount}</td>
      <td className="py-1 px-3 text-right tabular-nums">
        {session.expectedCash != null ? formatCurrency(session.expectedCash) : '—'}
      </td>
      <td className="py-1 px-3 text-right tabular-nums">
        {session.closingCash != null ? formatCurrency(session.closingCash) : '—'}
      </td>
      <td className="py-1 pl-3 text-right tabular-nums">
        {formatDiscrepancy(session.discrepancy)}
      </td>
    </tr>
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
