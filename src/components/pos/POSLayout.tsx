"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { usePOS, type POSInventoryItem } from "@/context/POSContext";
import { usePOSKeyboard } from "@/hooks/usePOSKeyboard";
import { POSSearchPanel } from "./POSSearchPanel";
import { POSCartPanel } from "./POSCartPanel";
import { POSQuantityModal } from "./POSQuantityModal";

type POSLayoutProps = {
  inventory: POSInventoryItem[];
  pharmacyId: string;
};

export function POSLayout({ inventory, pharmacyId }: POSLayoutProps) {
  const { setInventory, inventory: contextInventory, searchQuery, cartItems } = usePOS();

  useEffect(() => {
    setInventory(inventory);
  }, [inventory, setInventory]);

  // Keyboard nav state
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [focusedProductIndex, setFocusedProductIndex] = useState(-1);
  const [selectedProduct, setSelectedProduct] = useState<POSInventoryItem | null>(null);
  const [quantityModalOpen, setQuantityModalOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  // Filtered items computed here so usePOSKeyboard can navigate them
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return contextInventory;
    const q = searchQuery.toLowerCase();
    return contextInventory.filter(
      item =>
        item.productName.toLowerCase().includes(q) ||
        item.productGenericName?.toLowerCase().includes(q)
    );
  }, [contextInventory, searchQuery]);

  // Reset product focus when results change
  useEffect(() => {
    setFocusedProductIndex(-1);
  }, [filteredItems]);

  const openQuantityModal = useCallback((item: POSInventoryItem) => {
    setSelectedProduct(item);
    setQuantityModalOpen(true);
  }, []);

  usePOSKeyboard({
    searchInputRef,
    filteredItems,
    focusedProductIndex,
    setFocusedProductIndex,
    onSelectProduct: openQuantityModal,
    cartItemCount: cartItems.length,
    openPaymentModal: () => setPaymentOpen(true),
    isPaymentOpen: paymentOpen,
    isQuantityModalOpen: quantityModalOpen,
  });

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left: product search + results */}
      <div className="flex flex-1 flex-col overflow-hidden border-r">
        <POSSearchPanel
          searchInputRef={searchInputRef}
          filteredItems={filteredItems}
          focusedProductIndex={focusedProductIndex}
          setFocusedProductIndex={setFocusedProductIndex}
          onSelectProduct={openQuantityModal}
        />
      </div>

      {/* Right: cart */}
      <div className="flex w-105 shrink-0 flex-col overflow-hidden">
        <POSCartPanel
          pharmacyId={pharmacyId}
          paymentOpen={paymentOpen}
          onPaymentOpenChange={setPaymentOpen}
        />
      </div>

      <POSQuantityModal
        open={quantityModalOpen}
        onOpenChange={setQuantityModalOpen}
        item={selectedProduct}
      />
    </div>
  );
}
