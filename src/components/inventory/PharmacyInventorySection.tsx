"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { SquarePen } from "lucide-react";
import { type RowSelectionState } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import GenerateRestockPOButton from "@/components/inventory/GenerateRestockPOButton";
import InitializeInventoryButton from "@/components/inventory/InitializeInventoryButton";
import PharmacyInventoryTable from "@/components/inventory/PharmacyInventoryTable";
import type { PharmacyInventoryWithProduct, StockStatus } from "@/types/inventory";
import type { UserRole } from "@/types/user";

type Stats = {
  total: number;
  outOfStock: number;
  lowStock: number;
  nearExpiry: number;
  expired: number;
};

export default function PharmacyInventorySection({
  data,
  count,
  page,
  pageSize,
  pharmacyId,
  search,
  status,
  requires_prescription,
  pharmacies,
  userRole,
  stats,
}: {
  data: PharmacyInventoryWithProduct[];
  count: number;
  page: number;
  pageSize: number;
  pharmacyId: string;
  search?: string;
  status?: StockStatus;
  requires_prescription?: boolean;
  pharmacies: { id: string; name: string }[];
  userRole: UserRole;
  stats: Stats;
}) {
  const isAdmin = userRole === "admin";
  const canEdit = userRole === "admin" || userRole === "pharmacist";

  const [isBulkMode, setIsBulkMode] = useState(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  // typed explicitly so PharmacyInventoryTable receives the correct Dispatch shape
  const setRowSelectionTyped: Dispatch<SetStateAction<RowSelectionState>> = setRowSelection;

  function toggleBulkMode() {
    setIsBulkMode(v => !v);
    setRowSelection({});
  }

  return (
    <>
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Pharmacy Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Stock levels and pricing per pharmacy
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {isAdmin && (
            <>
              <GenerateRestockPOButton pharmacyId={pharmacyId} />
              <InitializeInventoryButton pharmacyId={pharmacyId} />
            </>
          )}
          {canEdit && (
            <Button
              variant={isBulkMode ? "default" : "outline"}
              size="icon"
              onClick={toggleBulkMode}
              aria-label={isBulkMode ? "Exit bulk edit" : "Bulk edit"}
            >
              <SquarePen className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total SKUs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Out of Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">
              {stats.outOfStock}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {stats.lowStock}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Near Expiry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {stats.nearExpiry}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expired
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">
              {stats.expired}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <PharmacyInventoryTable
        data={data}
        count={count}
        page={page}
        pageSize={pageSize}
        pharmacy_id={pharmacyId}
        search={search}
        status={status}
        requires_prescription={requires_prescription}
        pharmacies={pharmacies}
        userRole={userRole}
        isBulkMode={isBulkMode}
        rowSelection={rowSelection}
        setRowSelection={setRowSelectionTyped}
      />
    </>
  );
}
