"use client";

import { useEffect } from "react";
import { usePOS, type POSInventoryItem } from "@/context/POSContext";
import { POSSearchPanel } from "./POSSearchPanel";
import { POSCartPanel } from "./POSCartPanel";

type POSLayoutProps = {
  inventory: POSInventoryItem[];
  pharmacyId: string;
};

export function POSLayout({ inventory, pharmacyId }: POSLayoutProps) {
  const { setInventory } = usePOS();

  useEffect(() => {
    setInventory(inventory);
  }, [inventory, setInventory]);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left: product search + results */}
      <div className="flex flex-1 flex-col overflow-hidden border-r">
        <POSSearchPanel />
      </div>

      {/* Right: cart */}
      <div className="flex w-105 shrink-0 flex-col overflow-hidden">
        <POSCartPanel pharmacyId={pharmacyId} />
      </div>
    </div>
  );
}
