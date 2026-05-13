import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type { SalesSummary } from '@/app/admin/reports/actions'
import { formatCurrency } from '@/lib/report-utils'

export function SalesSummaryCards({ summary }: { summary: SalesSummary }) {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Revenue</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(summary.total_revenue)}
          </CardTitle>
        </CardHeader>
        <CardFooter>
          <div className="text-muted-foreground text-sm">Completed transactions only</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Transactions</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {summary.transaction_count.toLocaleString()}
          </CardTitle>
        </CardHeader>
        <CardFooter>
          <div className="text-muted-foreground text-sm">Voided transactions excluded</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Avg Transaction Value</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(summary.avg_transaction_value)}
          </CardTitle>
        </CardHeader>
        <CardFooter>
          <div className="text-muted-foreground text-sm">Per completed transaction</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Items Sold</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {summary.total_items_sold.toLocaleString()}
          </CardTitle>
        </CardHeader>
        <CardFooter>
          <div className="text-muted-foreground text-sm">Units across all products</div>
        </CardFooter>
      </Card>
    </div>
  )
}
