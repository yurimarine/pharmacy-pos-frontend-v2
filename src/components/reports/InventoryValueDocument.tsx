'use client'

import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/report-utils'
import type { InventoryValueReport } from '@/app/admin/reports/actions'

function formatDateTime(isoStr: string) {
  return new Date(isoStr).toLocaleString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function InventoryValueDocument({ data }: { data: InventoryValueReport }) {
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
          <p className="text-base font-semibold mt-0.5">Inventory Value Report</p>
          <p className="text-muted-foreground mt-2 text-xs">
            As of: {formatDateTime(data.generatedAt)}
          </p>
        </div>

        <Divider />

        {/* Summary */}
        <section className="mb-6">
          <SectionLabel>Summary</SectionLabel>
          <SummaryRow
            label="Total SKUs"
            value={data.items.length.toLocaleString('en-PH')}
          />
          <SummaryRow
            label="Total Quantity"
            value={data.totals.totalQuantity.toLocaleString('en-PH')}
          />
          <div className="border-t border-dashed my-2" />
          <SummaryRow
            label="Total Stock Value"
            value={formatCurrency(data.totals.totalStockValue)}
          />
          <SummaryRow
            label="Total Retail Value"
            value={formatCurrency(data.totals.totalRetailValue)}
          />
          <div className="border-t my-2" />
          <SummaryRow
            label="Total Potential Profit"
            value={formatCurrency(data.totals.totalPotentialProfit)}
            bold
          />
        </section>

        {/* By Pharmacy (admin all-pharmacy view only) */}
        {data.showByPharmacy && data.byPharmacy.length > 0 && (
          <>
            <Divider />
            <section className="mb-6">
              <SectionLabel>By Pharmacy</SectionLabel>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-foreground/20">
                    <th className="text-left py-1.5 pr-4 font-semibold">Pharmacy</th>
                    <th className="text-right py-1.5 px-3 font-semibold">Stock Value</th>
                    <th className="text-right py-1.5 px-3 font-semibold">Retail Value</th>
                    <th className="text-right py-1.5 pl-3 font-semibold">Potential Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byPharmacy.map((row, i) => (
                    <tr key={row.pharmacyName} className={i % 2 !== 0 ? 'bg-muted/40' : ''}>
                      <td className="py-1 pr-4">{row.pharmacyName}</td>
                      <td className="py-1 px-3 text-right tabular-nums">
                        {formatCurrency(row.totalStockValue)}
                      </td>
                      <td className="py-1 px-3 text-right tabular-nums">
                        {formatCurrency(row.totalRetailValue)}
                      </td>
                      <td className="py-1 pl-3 text-right tabular-nums">
                        {formatCurrency(row.totalPotentialProfit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-foreground/20 font-semibold">
                    <td className="py-1.5 pr-4">TOTAL</td>
                    <td className="py-1.5 px-3 text-right tabular-nums">
                      {formatCurrency(data.totals.totalStockValue)}
                    </td>
                    <td className="py-1.5 px-3 text-right tabular-nums">
                      {formatCurrency(data.totals.totalRetailValue)}
                    </td>
                    <td className="py-1.5 pl-3 text-right tabular-nums">
                      {formatCurrency(data.totals.totalPotentialProfit)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </section>
          </>
        )}

        <Divider />

        {/* Item Detail */}
        <section>
          <SectionLabel>Item Detail</SectionLabel>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-foreground/20">
                <th className="text-left py-1.5 pr-4 font-semibold">Product</th>
                <th className="text-left py-1.5 px-3 font-semibold">Category</th>
                <th className="text-right py-1.5 px-3 font-semibold">Qty</th>
                <th className="text-right py-1.5 px-3 font-semibold">Unit Cost</th>
                <th className="text-right py-1.5 px-3 font-semibold">Stock Value</th>
                <th className="text-right py-1.5 pl-3 font-semibold">Retail Value</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((row, i) => (
                <tr key={`${row.pharmacyName}-${row.productName}`} className={i % 2 !== 0 ? 'bg-muted/40' : ''}>
                  <td className="py-1 pr-4">{row.productName}</td>
                  <td className="py-1 px-3 text-muted-foreground">{row.category ?? '—'}</td>
                  <td className="py-1 px-3 text-right tabular-nums">
                    {row.quantity.toLocaleString('en-PH')}
                  </td>
                  <td className="py-1 px-3 text-right tabular-nums">
                    {formatCurrency(row.unitCost)}
                  </td>
                  <td className="py-1 px-3 text-right tabular-nums">
                    {formatCurrency(row.stockValue)}
                  </td>
                  <td className="py-1 pl-3 text-right tabular-nums">
                    {formatCurrency(row.retailValue)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-foreground/20 font-semibold">
                <td className="py-1.5 pr-4">TOTAL</td>
                <td className="py-1.5 px-3" />
                <td className="py-1.5 px-3 text-right tabular-nums">
                  {data.totals.totalQuantity.toLocaleString('en-PH')}
                </td>
                <td className="py-1.5 px-3" />
                <td className="py-1.5 px-3 text-right tabular-nums">
                  {formatCurrency(data.totals.totalStockValue)}
                </td>
                <td className="py-1.5 pl-3 text-right tabular-nums">
                  {formatCurrency(data.totals.totalRetailValue)}
                </td>
              </tr>
            </tfoot>
          </table>
        </section>

        <Divider />

        <p className="text-xs text-muted-foreground">
          Note: Items with no unit cost set (unit cost = 0) are excluded from this report.
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
