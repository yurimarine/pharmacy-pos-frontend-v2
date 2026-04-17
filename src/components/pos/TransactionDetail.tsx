'use client'

import Link from 'next/link'
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

const mockTransaction = {
  transactionNumber: 'TXN-000001',
  pharmacy: 'MediCare Pharmacy',
  processedBy: 'Juan dela Cruz',
  role: 'Pharmacist',
  dateTime: 'April 16, 2026 2:34 PM',
  paymentMethod: 'Cash',
  status: 'completed',
  items: [
    {
      name: 'Biogesic 500mg',
      genericName: 'Paracetamol',
      sku: 'BIOG-001',
      quantity: 2,
      unitPrice: 10.2,
      total: 20.4,
    },
    {
      name: 'Amoxicillin 500mg',
      genericName: 'Amoxicillin',
      sku: 'AMOX-001',
      quantity: 1,
      unitPrice: 14.4,
      total: 14.4,
    },
    {
      name: 'Cetirizine 10mg',
      genericName: 'Cetirizine HCl',
      sku: 'CETI-001',
      quantity: 3,
      unitPrice: 4.0,
      total: 12.0,
    },
  ],
  subtotal: 46.8,
  discountAmount: 0.0,
  totalAmount: 46.8,
  amountTendered: 50.0,
  changeAmount: 3.2,
}

type TransactionDetailProps = {
  canVoid: boolean
  backHref: string
}

export default function TransactionDetail({ canVoid, backHref }: TransactionDetailProps) {
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
                {mockTransaction.transactionNumber}
              </CardTitle>
              <CardDescription>
                {mockTransaction.dateTime}
              </CardDescription>
            </div>
            {mockTransaction.status === 'completed' ? (
              <Badge className="bg-green-500 hover:bg-green-500">
                Completed
              </Badge>
            ) : (
              <Badge variant="destructive">Voided</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs">Pharmacy</span>
              <span className="font-medium">{mockTransaction.pharmacy}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs">Processed By</span>
              <span className="font-medium">{mockTransaction.processedBy}</span>
              <span className="text-xs text-muted-foreground">{mockTransaction.role}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs">Payment Method</span>
              <Badge variant="secondary" className="w-fit">Cash</Badge>
            </div>
          </div>
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
              {mockTransaction.items.map((item, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">{item.genericName}</TableCell>
                  <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">₱{item.unitPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium">₱{item.total.toFixed(2)}</TableCell>
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
              <span>₱{mockTransaction.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span>₱{mockTransaction.discountAmount.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span>₱{mockTransaction.totalAmount.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cash Tendered</span>
              <span>₱{mockTransaction.amountTendered.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-muted-foreground">Change</span>
              <span>₱{mockTransaction.changeAmount.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Void Action (admin only) */}
        {canVoid && mockTransaction.status === 'completed' && (
          <div className="flex items-end">
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => {}}
            >
              <BanIcon className="h-4 w-4" />
              Void Transaction
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
