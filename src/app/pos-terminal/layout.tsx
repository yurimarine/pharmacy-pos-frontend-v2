import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-current-user";
import { createClient } from "@/lib/supabase/server";
import { POSHeader } from "@/components/pos/POSHeader";
import { POSProvider } from "@/context/POSContext";

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

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden w-full">
      <POSHeader
        userName={currentUser.name}
        userRole={currentUser.role}
        pharmacyName={pharmacyName}
      />
      <POSProvider pharmacyName={pharmacyName} userName={currentUser.name}>
        <main className="flex flex-1 overflow-hidden w-full">{children}</main>
      </POSProvider>
    </div>
  );
}
