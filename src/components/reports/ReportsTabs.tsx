"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface ReportsTabsProps {
  activeTab: string;
}

const TABS = [
  { id: "analytics", label: "Analytics" },
  { id: "financial", label: "Financial Summary" },
  { id: "sales", label: "Sales Report" },
  { id: "discount", label: "Discount Report" },
  { id: "till", label: "Till Report" },
  { id: "inventory", label: "Inventory Value" },
  { id: "deadstock", label: "Dead Stock" },
];

export function ReportsTabs({ activeTab }: ReportsTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const switchTab = useCallback(
    (tab: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.push(`/admin/reports?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="flex justify- border-b">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => switchTab(tab.id)}
          className={`px-4 py-2.5 font-medium border-b-2 -mb-px transition-all duration-500 ${
            activeTab === tab.id
              ? "border-foreground font-bold text-lg"
              : "font-bold text-sm hover:text-lg hover:border-foreground"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
