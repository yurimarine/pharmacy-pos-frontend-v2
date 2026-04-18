'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BanIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { TransactionWithItems } from '@/types/transaction'
import { ROLE_LABELS } from '@/types/user'
import { VoidTransactionDialog } from './VoidTransactionDialog'

type TransactionDetailProps = {
  transaction: TransactionWithItems
  canVoid: boolean
  backHref: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function TransactionDetail({
  transaction,
  canVoid,
  backHref,
}: TransactionDetailProps) {
  const router = useRouter()
  const [voidOpen, setVoidOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Back button */}
      <Button
        variant="ghost"
        className="w-fit -ml-2"
        render={<Link href={backHref} />}
        nativeButton={false}
      >
        ← Back to Transactions
      </Button>

      {/* Transaction Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex flex-col gap-1">
              <CardTitle className="font-mono text-xl">
                {transaction.transaction_number}
              </CardTitle>
              <CardDescription>
                {formatDate(transaction.created_at)}
              </CardDescription>
            </div>
            {transaction.status === 'completed' ? (
              <Badge className="bg-green-500 hover:bg-green-500">Completed</Badge>
            ) : (
              <Badge variant="destructive">Voided</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs">Pharmacy</span>
              <span className="font-medium">
                {transaction.pharmacies?.name ?? '—'}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs">Processed By</span>
              <span className="font-medium">
                {transaction.users?.name ?? '—'}
              </span>
              {transaction.users?.role && (
                <span className="text-xs text-muted-foreground">
                  {ROLE_LABELS[transaction.users.role as keyof typeof ROLE_LABELS] ??
                    transaction.users.role}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs">Payment Method</span>
              <Badge variant="secondary" className="w-fit">Cash</Badge>
            </div>
          </div>

          {/* Voided info */}
          {transaction.status === 'voided' && (
            <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <p className="font-medium text-destructive mb-1">Voided Transaction</p>
              {transaction.voided_by_user?.name && (
                <p className="text-muted-foreground">
                  Voided by: {transaction.voided_by_user.name}
                </p>
              )}
              {transaction.voided_at && (
                <p className="text-muted-foreground">
                  Date: {formatDate(transaction.voided_at)}
                </p>
              )}
              {transaction.void_reason && (
                <p className="text-muted-foreground">
                  Reason: {transaction.void_reason}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Generic Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transaction.transaction_items.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.product_name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.product_generic_name ?? '—'}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {item.product_sku ?? '—'}
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    ₱{item.unit_price.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ₱{item.total_price.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Totals + Actions Row */}
      <div className="flex flex-col md:flex-row justify-between gap-6">
        {/* Summary Card */}
        <Card className="flex-1 max-w-sm">
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₱{transaction.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span>₱{transaction.discount_amount.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span>₱{transaction.total_amount.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cash Tendered</span>
              <span>₱{transaction.amount_tendered.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-muted-foreground">Change</span>
              <span>₱{transaction.change_amount.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Void Action — admin only, completed transactions only */}
        {canVoid && transaction.status === 'completed' && (
          <div className="flex items-end">
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => setVoidOpen(true)}
            >
              <BanIcon className="h-4 w-4" />
              Void Transaction
            </Button>
          </div>
        )}
      </div>

      {/* Void dialog */}
      {canVoid && (
        <VoidTransactionDialog
          open={voidOpen}
          onOpenChange={setVoidOpen}
          transactionId={transaction.id}
          transactionNumber={transaction.transaction_number}
          onVoided={() => router.refresh()}
        />
      )}
    </div>
  )
}
