import { useEffect, type RefObject } from 'react'
import type { POSInventoryItem } from '@/context/POSContext'

type UsePOSKeyboardOptions = {
  searchInputRef: RefObject<HTMLInputElement | null>
  filteredItems: POSInventoryItem[]
  focusedProductIndex: number
  setFocusedProductIndex: (i: number) => void
  onSelectProduct: (item: POSInventoryItem) => void
  cartItemCount: number
  openPaymentModal: () => void
  isPaymentOpen: boolean
  isQuantityModalOpen: boolean
}

export function usePOSKeyboard({
  searchInputRef,
  filteredItems,
  focusedProductIndex,
  setFocusedProductIndex,
  onSelectProduct,
  cartItemCount,
  openPaymentModal,
  isPaymentOpen,
  isQuantityModalOpen,
}: UsePOSKeyboardOptions) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Let dialogs handle their own keyboard when open
      if (isPaymentOpen || isQuantityModalOpen) return

      const target = e.target as HTMLElement
      const isInInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      const isInSearchInput = target === searchInputRef.current

      // F2: focus search bar
      if (e.key === 'F2') {
        e.preventDefault()
        searchInputRef.current?.focus()
        setFocusedProductIndex(-1)
        return
      }

      // F8: open payment modal when cart has items
      if (e.key === 'F8') {
        e.preventDefault()
        if (cartItemCount > 0) openPaymentModal()
        return
      }

      // Remaining shortcuts only apply when in search input or no input focused
      if (isInInput && !isInSearchInput) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        if (filteredItems.length === 0) return
        const next = Math.min(focusedProductIndex + 1, filteredItems.length - 1)
        setFocusedProductIndex(next)
        if (isInSearchInput) searchInputRef.current?.blur()
        return
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (focusedProductIndex <= 0) {
          setFocusedProductIndex(-1)
          searchInputRef.current?.focus()
        } else {
          setFocusedProductIndex(focusedProductIndex - 1)
        }
        return
      }

      if (e.key === 'Enter' && focusedProductIndex >= 0 && !isInSearchInput) {
        e.preventDefault()
        const item = filteredItems[focusedProductIndex]
        if (item) onSelectProduct(item)
        return
      }

      // Escape: return focus to search when a product is visually focused
      if (e.key === 'Escape' && focusedProductIndex >= 0) {
        e.preventDefault()
        setFocusedProductIndex(-1)
        searchInputRef.current?.focus()
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [
    searchInputRef,
    filteredItems,
    focusedProductIndex,
    setFocusedProductIndex,
    onSelectProduct,
    cartItemCount,
    openPaymentModal,
    isPaymentOpen,
    isQuantityModalOpen,
  ])
}
