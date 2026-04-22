import { redirect } from "next/navigation";
import { EyeIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/get-current-user";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { POSInventoryTable } from "@/components/pos/POSInventoryTable";
import { getPOSInventoryForTable } from "./actions";

export default async function POSInventoryPage() {
  let currentUser;
  try {
    currentUser = await getCurrentUser();
  } catch {
    redirect("/auth/login");
  }

  if (!currentUser.pharmacy_id) {
    return (
      <div className="flex flex-1 items-center justify-center h-full p-8 text-center text-muted-foreground">
        <div>
          <p className="font-medium">No pharmacy assigned</p>
          <p className="text-sm">Contact your administrator.</p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const [inventory, pharmacyResult] = await Promise.all([
    getPOSInventoryForTable(currentUser.pharmacy_id),
    supabase
      .from("pharmacies")
      .select("name")
      .eq("id", currentUser.pharmacy_id)
      .single(),
  ]);

  const pharmacyName = pharmacyResult.data?.name ?? "your pharmacy";

  return (
    <div className="flex flex-col h-full p-6 gap-6 overflow-hidden w-full">
      {/* Page header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            Stock levels for {pharmacyName}
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <EyeIcon className="h-3 w-3" />
          View Only
        </Badge>
      </div>

      <POSInventoryTable inventory={inventory} />
    </div>
  );
}
