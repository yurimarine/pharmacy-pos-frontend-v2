'use client'

type ReceiptItem = {
  name: string
  genericName: string | null
  quantity: number
  unitPrice: number
  totalPrice: number
  discountAmount: number
  discountLabel: string | null
}

type ReceiptData = {
  transactionNumber: string
  pharmacy: string
  cashier: string
  date: string
  time: string
  items: ReceiptItem[]
  subtotal: number
  discountId: string | null
  discountAmount: number
  discountName: string | null
  referenceId: string | null
  referenceName: string | null
  totalAmount: number
  amountTendered: number
  changeAmount: number
}

type POSReceiptProps = {
  data: ReceiptData
}

export function POSReceipt({ data }: POSReceiptProps) {
  const totalItemDiscounts = data.items.reduce((s, i) => s + i.discountAmount, 0)
  const hasPerItemDiscount = data.discountId === null && totalItemDiscounts > 0
  const hasCartDiscount = data.discountId !== null

  return (
    <div className="bg-white text-black p-5 font-mono text-sm">
      {/* Header */}
      <div className="text-center mb-4">
        <p className="font-bold text-base">💊 PharmaCare POS</p>
        <p className="text-sm">{data.pharmacy}</p>
        <div className="border-t border-dashed my-2" />
        <p className="text-xs">{data.transactionNumber}</p>
        <p className="text-xs">{data.date} · {data.time}</p>
        <p className="text-xs">Cashier: {data.cashier}</p>
      </div>

      <div className="border-t border-dashed my-2" />

      {/* Items */}
      <div className="flex flex-col gap-2 mb-3">
        {data.items.map((item, index) => {
          const displayTotal = item.totalPrice - item.discountAmount
          return (
            <div key={index} className="flex flex-col">
              <div className="flex justify-between">
                <span className="font-medium text-xs truncate max-w-[60%]">
                  {item.name}
                </span>
                <span className="text-xs">₱{displayTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{item.genericName}</span>
                <span>{item.quantity} × ₱{item.unitPrice.toFixed(2)}</span>
              </div>
              {item.discountAmount > 0 && item.discountLabel && (
                <div className="flex justify-between text-xs text-green-600">
                  <span className="pl-2">{item.discountLabel}</span>
                  <span>-₱{item.discountAmount.toFixed(2)}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="border-t border-dashed my-2" />

      {/* Totals */}
      <div className="flex flex-col gap-1 text-xs mb-3">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>₱{data.subtotal.toFixed(2)}</span>
        </div>

        {hasPerItemDiscount && (
          <div className="flex justify-between text-green-600">
            <span>Total discount</span>
            <span>-₱{totalItemDiscounts.toFixed(2)}</span>
          </div>
        )}

        {hasCartDiscount && (
          <>
            <div className="flex justify-between text-amber-600">
              <span>{data.discountName ?? 'Discount'}</span>
              <span>-₱{data.discountAmount.toFixed(2)}</span>
            </div>
            {data.referenceId && data.referenceName && (
              <div className="text-xs text-gray-500 pl-2">
                ID: {data.referenceId} · {data.referenceName}
              </div>
            )}
          </>
        )}

        <div className="flex justify-between font-bold text-sm mt-1">
          <span>TOTAL</span>
          <span>₱{data.totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="border-t border-dashed my-2" />

      {/* Payment */}
      <div className="flex flex-col gap-1 text-xs mb-3">
        <div className="flex justify-between">
          <span>Cash</span>
          <span>₱{data.amountTendered.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Change</span>
          <span>₱{data.changeAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="border-t border-dashed my-2" />

      {/* Footer */}
      <div className="text-center text-xs mt-3 text-gray-500">
        <p>Thank you for your purchase!</p>
        <p className="mt-1">Please keep this receipt</p>
        <p>for any concerns.</p>
      </div>
    </div>
  )
}
