'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { formatCurrency } from '@/lib/report-utils'
import type { CategorySales } from '@/app/admin/reports/actions'

const chartConfig = {
  revenue: {
    label: 'Revenue (₱)',
    color: 'var(--primary)',
  },
} satisfies ChartConfig

export function SalesByCategory({ data }: { data: CategorySales[] }) {
  const totalRevenue = data.reduce((sum, r) => sum + r.revenue, 0)

  // Cap chart to top 10 for readability; table shows all
  const chartData = data.slice(0, 10)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales by Category</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No sales data for the selected period.
          </p>
        ) : (
          <>
            <ChartContainer
              config={chartConfig}
              className="w-full"
              style={{ height: Math.max(180, chartData.length * 36) }}
            >
              <BarChart layout="vertical" data={chartData} margin={{ left: 8, right: 8 }}>
                <CartesianGrid horizontal={false} />
                <YAxis
                  type="category"
                  dataKey="category"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={120}
                  tick={{ fontSize: 12 }}
                />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => `₱${Number(v).toLocaleString()}`}
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
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ChartContainer>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 text-left font-medium text-muted-foreground">Category</th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">Qty Sold</th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">Revenue</th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(row => (
                    <tr key={row.category} className="border-b last:border-0">
                      <td className="py-2 font-medium">{row.category}</td>
                      <td className="py-2 tabular-nums text-right">{row.quantity_sold}</td>
                      <td className="py-2 tabular-nums text-right">{formatCurrency(row.revenue)}</td>
                      <td className="py-2 tabular-nums text-right text-muted-foreground">
                        {totalRevenue > 0
                          ? ((row.revenue / totalRevenue) * 100).toFixed(1)
                          : '0.0'}
                        %
                      </td>
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
