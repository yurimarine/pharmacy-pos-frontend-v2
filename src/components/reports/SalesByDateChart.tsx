'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import type { DailySales } from '@/app/admin/reports/actions'

const chartConfig = {
  revenue: {
    label: 'Revenue (₱)',
    color: 'var(--primary)',
  },
} satisfies ChartConfig

function formatCurrency(value: number) {
  return `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDateLabel(dateStr: string) {
  // dateStr is YYYY-MM-DD
  const [year, month, day] = dateStr.split('-')
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

export function SalesByDateChart({ data }: { data: DailySales[] }) {
  const isEmpty = data.length === 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue by Day</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {isEmpty ? (
          <p className="text-muted-foreground py-12 text-center text-sm">
            No sales data for the selected period.
          </p>
        ) : (
          <>
            <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
              <BarChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="sale_date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={formatDateLabel}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={v => `₱${Number(v).toLocaleString()}`}
                  width={80}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => {
                        if (name === 'revenue') return [formatCurrency(Number(value)), 'Revenue']
                        return [String(value), name]
                      }}
                    />
                  }
                />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ChartContainer>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 text-left font-medium text-muted-foreground">Date</th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">Revenue</th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">
                      Transactions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(row => (
                    <tr key={row.sale_date} className="border-b last:border-0">
                      <td className="py-2 tabular-nums">{formatDateLabel(row.sale_date)}</td>
                      <td className="py-2 text-right tabular-nums">
                        {formatCurrency(row.revenue)}
                      </td>
                      <td className="py-2 text-right tabular-nums">{row.transaction_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
