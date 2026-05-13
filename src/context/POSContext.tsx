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
import type { TillSession } from '@/types/till-session'
import type { Discount } from '@/types/discount'
import { computeDiscountAmount } from '@/types/discount'
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
  pharmacyId: string
  userRole: 'pharmacist' | 'pharmacy_assistant'

  // Till session
  tillSession: TillSession | null
  setTillSession: (session: TillSession | null) => void

  // Inventory
  inventory: POSInventoryItem[]
  setInventory: (items: POSInventoryItem[] | ((prev: POSInventoryItem[]) => POSInventoryItem[])) => void

  // Cart
  cartItems: CartItem[]
  addToCart: (item: POSInventoryItem) => void
  addToCartWithQuantity: (item: POSInventoryItem, quantity: number) => void
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

  // Discounts — available list
  activeDiscounts: Discount[]

  // Discount mode (mutual exclusivity)
  discountMode: 'per_item' | 'whole_cart' | null

  // Whole-cart discount
  cartDiscount: Discount | null
  cartDiscountAmount: number

  // Reference fields (shared for both modes)
  referenceId: string
  referenceName: string
  setReference: (id: string, name: string) => void

  // Discount actions
  applyItemDiscount: (inventoryId: string, discount: Discount | null) => void
  setCartDiscount: (discount: Discount | null) => void
  clearAllDiscounts: () => void

  // Computed discount total
  totalDiscountAmount: number
}

const POSContext = createContext<POSContextType | null>(null)

export function POSProvider({
  children,
  pharmacyName,
  userName,
  pharmacyId,
  userRole,
  initialTillSession,
  initialInventory,
  activeDiscounts: initialActiveDiscounts,
}: {
  children: React.ReactNode
  pharmacyName: string
  userName: string
  pharmacyId: string
  userRole: 'pharmacist' | 'pharmacy_assistant'
  initialTillSession: TillSession | null
  initialInventory: POSInventoryItem[]
  activeDiscounts: Discount[]
}) {
  const [inventory, setInventory] = useState<POSInventoryItem[]>(initialInventory)
  const [tillSession, setTillSession] = useState<TillSession | null>(initialTillSession)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // Discount state
  const [activeDiscounts] = useState<Discount[]>(initialActiveDiscounts)
  const [cartDiscount, setCartDiscountState] = useState<Discount | null>(null)
  const [cartDiscountAmount, setCartDiscountAmount] = useState<number>(0)
  const [referenceId, setReferenceId] = useState<string>('')
  const [referenceName, setReferenceName] = useState<string>('')

  // ─── Cart actions ─────────────────────────────────────────────────────────

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
          discount: null,
          discountAmount: 0,
        },
      ]
    })
  }, [])

  const addToCartWithQuantity = useCallback((item: POSInventoryItem, quantity: number) => {
    if (item.quantity === 0) {
      toast.error(`${item.productName} is out of stock.`)
      return
    }
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
        const newQty = Math.min(existing.quantity + quantity, item.quantity)
        if (existing.quantity + quantity > item.quantity) {
          toast.warning(`Only ${item.quantity - existing.quantity} more unit(s) available.`)
        }
        return prev.map(c =>
          c.inventoryId === item.inventoryId
            ? { ...c, quantity: newQty, totalPrice: newQty * c.unitPrice }
            : c
        )
      }
      const cappedQty = Math.min(quantity, item.quantity)
      const stockStatus = getStockStatus(item.quantity, item.lowStockThreshold, item.expiryDate)
      return [
        ...prev,
        {
          inventoryId: item.inventoryId,
          productId: item.productId,
          productName: item.productName,
          productGenericName: item.productGenericName,
          productSku: item.productSku,
          requiresPrescription: item.requiresPrescription,
          quantity: cappedQty,
          unitPrice: item.sellingPrice,
          totalPrice: cappedQty * item.sellingPrice,
          maxQuantity: item.quantity,
          stockStatus,
          discount: null,
          discountAmount: 0,
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

  // ─── Discount actions ─────────────────────────────────────────────────────

  const clearAllDiscounts = useCallback(() => {
    setCartItems(prev =>
      prev.map(item => ({ ...item, discount: null, discountAmount: 0 }))
    )
    setCartDiscountState(null)
    setCartDiscountAmount(0)
    setReferenceId('')
    setReferenceName('')
  }, [])

  const clearCart = useCallback(() => {
    setCartItems([])
    clearAllDiscounts()
  }, [clearAllDiscounts])

  const applyItemDiscount = useCallback(
    (inventoryId: string, discount: Discount | null) => {
      // Mutual exclusivity: clear cart discount when applying an item discount
      if (discount !== null && cartDiscount !== null) {
        setCartDiscountState(null)
        setCartDiscountAmount(0)
        setReferenceId('')
        setReferenceName('')
      }

      setCartItems(prev =>
        prev.map(item => {
          if (item.inventoryId !== inventoryId) return item
          if (discount === null) {
            return { ...item, discount: null, discountAmount: 0 }
          }
          const itemTotal = item.unitPrice * item.quantity
          const amount = computeDiscountAmount(discount, itemTotal)
          return { ...item, discount, discountAmount: amount }
        })
      )
    },
    [cartDiscount],
  )

  const setCartDiscount = useCallback(
    (discount: Discount | null) => {
      if (discount === null) {
        setCartDiscountState(null)
        setCartDiscountAmount(0)
        setReferenceId('')
        setReferenceName('')
        return
      }

      // Mutual exclusivity: clear all item discounts
      setCartItems(prev =>
        prev.map(item => ({ ...item, discount: null, discountAmount: 0 }))
      )

      // Compute current subtotal (before any discount)
      const currentSubtotal = cartItems.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0,
      )

      // Floor check: fixed discount cannot exceed subtotal
      if (discount.type === 'fixed' && discount.value > currentSubtotal) {
        throw new Error(
          `Discount of ₱${discount.value.toFixed(2)} exceeds ` +
            `the cart total of ₱${currentSubtotal.toFixed(2)}.`,
        )
      }

      const amount = computeDiscountAmount(discount, currentSubtotal)
      setCartDiscountState(discount)
      setCartDiscountAmount(amount)
    },
    [cartItems],
  )

  const setReference = useCallback((id: string, name: string) => {
    setReferenceId(id)
    setReferenceName(name)
  }, [])

  // ─── Derived discount mode ────────────────────────────────────────────────

  const discountMode = useMemo<'per_item' | 'whole_cart' | null>(() => {
    if (cartDiscount !== null) return 'whole_cart'
    if (cartItems.some(item => item.discount !== null)) return 'per_item'
    return null
  }, [cartDiscount, cartItems])

  // ─── Computed values ──────────────────────────────────────────────────────

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.totalPrice, 0),
    [cartItems],
  )

  const totalDiscountAmount = useMemo(() => {
    if (discountMode === 'whole_cart') return cartDiscountAmount
    if (discountMode === 'per_item') {
      return cartItems.reduce((sum, item) => sum + item.discountAmount, 0)
    }
    return 0
  }, [discountMode, cartDiscountAmount, cartItems])

  const totalAmount = Math.max(0, subtotal - totalDiscountAmount)

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <POSContext.Provider
      value={{
        pharmacyName,
        userName,
        pharmacyId,
        userRole,
        tillSession,
        setTillSession,
        inventory,
        setInventory,
        cartItems,
        addToCart,
        addToCartWithQuantity,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        totalAmount,
        itemCount,
        searchQuery,
        setSearchQuery,
        activeDiscounts,
        discountMode,
        cartDiscount,
        cartDiscountAmount,
        referenceId,
        referenceName,
        setReference,
        applyItemDiscount,
        setCartDiscount,
        clearAllDiscounts,
        totalDiscountAmount,
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
