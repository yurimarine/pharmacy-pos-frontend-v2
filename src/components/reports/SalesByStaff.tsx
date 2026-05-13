import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/report-utils'
import type { StaffSales } from '@/app/admin/reports/actions'

export function SalesByStaff({ data }: { data: StaffSales[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales by Staff</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No sales data for the selected period.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-2 text-left font-medium text-muted-foreground">#</th>
                  <th className="pb-2 text-left font-medium text-muted-foreground">Staff Member</th>
                  <th className="pb-2 text-right font-medium text-muted-foreground">
                    Transactions
                  </th>
                  <th className="pb-2 text-right font-medium text-muted-foreground">Revenue</th>
                  <th className="pb-2 text-right font-medium text-muted-foreground">Avg / Txn</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={row.staff_id} className="border-b last:border-0">
                    <td className="py-2 tabular-nums text-muted-foreground">{i + 1}</td>
                    <td className="py-2 font-medium">{row.staff_name}</td>
                    <td className="py-2 tabular-nums text-right">{row.transaction_count}</td>
                    <td className="py-2 tabular-nums text-right">{formatCurrency(row.revenue)}</td>
                    <td className="py-2 tabular-nums text-right text-muted-foreground">
                      {formatCurrency(
                        row.transaction_count > 0 ? row.revenue / row.transaction_count : 0,
                      )}
                    </td>
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
