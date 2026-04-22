'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react'
import { toast } from 'sonner'
import type { CartItem } from '@/types/cart'
import { getStockStatus } from '@/lib/inventory-utils'

export type POSInventoryItem = {
  inventoryId: string
  productId: string
  productName: string
  productGenericName: string | null
  productSku: string | null
  requiresPrescription: boolean
  packagingLabel: string | null
  sellingPrice: number
  quantity: number
  lowStockThreshold: number
  expiryDate: string | null
}

type POSContextType = {
  // Static metadata
  pharmacyName: string
  userName: string

  // Inventory
  inventory: POSInventoryItem[]
  setInventory: (items: POSInventoryItem[]) => void

  // Cart
  cartItems: CartItem[]
  addToCart: (item: POSInventoryItem) => void
  removeFromCart: (inventoryId: string) => void
  updateQuantity: (inventoryId: string, quantity: number) => void
  clearCart: () => void

  // Computed
  subtotal: number
  totalAmount: number
  itemCount: number

  // Search
  searchQuery: string
  setSearchQuery: (query: string) => void
}

const POSContext = createContext<POSContextType | null>(null)

export function POSProvider({
  children,
  pharmacyName,
  userName,
}: {
  children: React.ReactNode
  pharmacyName: string
  userName: string
}) {
  const [inventory, setInventory] = useState<POSInventoryItem[]>([])
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const addToCart = useCallback((item: POSInventoryItem) => {
    // Guard: out of stock
    if (item.quantity === 0) {
      toast.error(`${item.productName} is out of stock.`)
      return
    }

    // Guard: expired
    if (item.expiryDate) {
      const expiry = new Date(item.expiryDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (expiry < today) {
        toast.error(`${item.productName} is expired.`)
        return
      }
    }

    setCartItems(prev => {
      const existing = prev.find(c => c.inventoryId === item.inventoryId)

      if (existing) {
        if (existing.quantity >= item.quantity) {
          toast.warning(`Maximum available stock reached (${item.quantity} units).`)
          return prev
        }
        return prev.map(c =>
          c.inventoryId === item.inventoryId
            ? {
                ...c,
                quantity: c.quantity + 1,
                totalPrice: (c.quantity + 1) * c.unitPrice,
              }
            : c
        )
      }

      // New cart entry
      const stockStatus = getStockStatus(
        item.quantity,
        item.lowStockThreshold,
        item.expiryDate,
      )

      return [
        ...prev,
        {
          inventoryId: item.inventoryId,
          productId: item.productId,
          productName: item.productName,
          productGenericName: item.productGenericName,
          productSku: item.productSku,
          requiresPrescription: item.requiresPrescription,
          quantity: 1,
          unitPrice: item.sellingPrice,
          totalPrice: item.sellingPrice,
          maxQuantity: item.quantity,
          stockStatus,
        },
      ]
    })
  }, [])

  const removeFromCart = useCallback((inventoryId: string) => {
    setCartItems(prev => prev.filter(c => c.inventoryId !== inventoryId))
  }, [])

  const updateQuantity = useCallback(
    (inventoryId: string, quantity: number) => {
      if (quantity < 1) {
        removeFromCart(inventoryId)
        return
      }
      setCartItems(prev =>
        prev.map(c => {
          if (c.inventoryId !== inventoryId) return c
          const cappedQty = Math.min(quantity, c.maxQuantity)
          if (cappedQty < quantity) {
            toast.warning(`Maximum available stock is ${c.maxQuantity} units.`)
          }
          return {
            ...c,
            quantity: cappedQty,
            totalPrice: cappedQty * c.unitPrice,
          }
        })
      )
    },
    [removeFromCart],
  )

  const clearCart = useCallback(() => {
    setCartItems([])
  }, [])

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.totalPrice, 0),
    [cartItems],
  )
  const totalAmount = subtotal
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <POSContext.Provider
      value={{
        pharmacyName,
        userName,
        inventory,
        setInventory,
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        totalAmount,
        itemCount,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </POSContext.Provider>
  )
}

export function usePOS() {
  const context = useContext(POSContext)
  if (!context) throw new Error('usePOS must be used within POSProvider')
  return context
}
