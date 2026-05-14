"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type Pharmacy = { id: string; name: string };

type ReportsFilterBarProps = {
  pharmacies: Pharmacy[];
  isAdmin: boolean;
  currentPharmacyId: string | null;
  currentDateFrom: string;
  currentDateTo: string;
};

export function ReportsFilterBar({
  pharmacies,
  isAdmin,
  currentPharmacyId,
  currentDateFrom,
  currentDateTo,
}: ReportsFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const pushParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      router.push(`/admin/reports?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="dateFrom" className="text-xs text-muted-foreground">
          From
        </Label>
        <input
          id="dateFrom"
          type="date"
          value={currentDateFrom}
          max={currentDateTo}
          onChange={e => pushParams({ dateFrom: e.target.value })}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="dateTo" className="text-xs text-muted-foreground">
          To
        </Label>
        <input
          id="dateTo"
          type="date"
          value={currentDateTo}
          min={currentDateFrom}
          onChange={e => pushParams({ dateTo: e.target.value })}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      {isAdmin && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Pharmacy</Label>
          <Select
            value={currentPharmacyId ?? "all"}
            onValueChange={value =>
              pushParams({ pharmacyId: value === "all" ? null : value })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {currentPharmacyId
                  ? (pharmacies.find(p => p.id === currentPharmacyId)?.name ??
                    "Unknown")
                  : "All Pharmacies"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pharmacies</SelectItem>
              {pharmacies.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
