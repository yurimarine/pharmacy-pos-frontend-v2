import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-current-user";

export default async function RootPage() {
  let currentUser;
  try {
    currentUser = await getCurrentUser();
  } catch {
    redirect("/auth/login");
  }

  if (currentUser.role === "pharmacy_assistant") {
    redirect("/pos-terminal");
  }

  redirect("/admin/dashboard");
}
