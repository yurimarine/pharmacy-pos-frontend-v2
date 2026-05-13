'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/report-utils'
import type { ProductSalesRank } from '@/app/admin/reports/actions'

export function BestSellingProducts({ data }: { data: ProductSalesRank[] }) {
  const [sortBy, setSortBy] = useState<'revenue' | 'quantity'>('revenue')

  const sorted = [...data].sort((a, b) =>
    sortBy === 'revenue' ? b.revenue - a.revenue : b.quantity_sold - a.quantity_sold,
  )

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Best-Selling Products</CardTitle>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={sortBy === 'revenue' ? 'default' : 'outline'}
            onClick={() => setSortBy('revenue')}
          >
            By Revenue
          </Button>
          <Button
            size="sm"
            variant={sortBy === 'quantity' ? 'default' : 'outline'}
            onClick={() => setSortBy('quantity')}
          >
            By Qty
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No sales data for the selected period.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-2 text-left font-medium text-muted-foreground">#</th>
                  <th className="pb-2 text-left font-medium text-muted-foreground">Product</th>
                  <th className="pb-2 text-left font-medium text-muted-foreground">Category</th>
                  <th className="pb-2 text-right font-medium text-muted-foreground">Qty Sold</th>
                  <th className="pb-2 text-right font-medium text-muted-foreground">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row, i) => (
                  <tr key={row.product_id} className="border-b last:border-0">
                    <td className="py-2 tabular-nums text-muted-foreground">{i + 1}</td>
                    <td className="py-2 font-medium">{row.product_name}</td>
                    <td className="py-2 text-muted-foreground">
                      {row.category ?? 'Uncategorized'}
                    </td>
                    <td className="py-2 tabular-nums text-right">{row.quantity_sold}</td>
                    <td className="py-2 tabular-nums text-right">{formatCurrency(row.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
