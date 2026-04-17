'use client'

type ReceiptItem = {
  name: string
  genericName: string | null
  quantity: number
  unitPrice: number
  totalPrice: number
}

type ReceiptData = {
  transactionNumber: string
  pharmacy: string
  cashier: string
  date: string
  time: string
  items: ReceiptItem[]
  subtotal: number
  discountAmount: number
  totalAmount: number
  amountTendered: number
  changeAmount: number
}

type POSReceiptProps = {
  data: ReceiptData
}

export function POSReceipt({ data }: POSReceiptProps) {
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
        {data.items.map((item, index) => (
          <div key={index} className="flex flex-col">
            <div className="flex justify-between">
              <span className="font-medium text-xs truncate max-w-[60%]">
                {item.name}
              </span>
              <span className="text-xs">₱{item.totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{item.genericName}</span>
              <span>{item.quantity} × ₱{item.unitPrice.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed my-2" />

      {/* Totals */}
      <div className="flex flex-col gap-1 text-xs mb-3">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>₱{data.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Discount</span>
          <span>₱{data.discountAmount.toFixed(2)}</span>
        </div>
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
