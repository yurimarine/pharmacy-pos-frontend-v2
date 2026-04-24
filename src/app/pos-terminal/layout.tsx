import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-current-user";
import { createClient } from "@/lib/supabase/server";
import { POSHeader } from "@/components/pos/POSHeader";
import { POSProvider } from "@/context/POSContext";
import { getPOSInventory } from "./actions";
import { getActiveTillSession } from "./till-session-actions";

export default async function POSTerminalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let currentUser;
  try {
    currentUser = await getCurrentUser();
  } catch {
    redirect("/auth/login");
  }

  // Fetch pharmacy name for the header and receipt
  let pharmacyName = "My Pharmacy";
  if (currentUser.pharmacy_id) {
    const supabase = await createClient();
    const { data: pharmacy } = await supabase
      .from("pharmacies")
      .select("name")
      .eq("id", currentUser.pharmacy_id)
      .single();
    if (pharmacy?.name) pharmacyName = pharmacy.name;
  }

  const inventory = currentUser.pharmacy_id
    ? await getPOSInventory(currentUser.pharmacy_id)
    : [];

  const activeTillSession = await getActiveTillSession(
    currentUser.pharmacy_id ?? "",
    currentUser.id
  );

  return (
    <POSProvider
      pharmacyName={pharmacyName}
      userName={currentUser.name}
      pharmacyId={currentUser.pharmacy_id ?? ""}
      userRole={currentUser.role as "pharmacist" | "pharmacy_assistant"}
      initialTillSession={activeTillSession}
      initialInventory={inventory}
    >
      <div className="flex h-screen flex-col bg-background overflow-hidden w-full">
        <POSHeader />
        <main className="flex flex-1 overflow-hidden w-full">{children}</main>
      </div>
    </POSProvider>
  );
}
