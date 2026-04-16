import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ADMIN_ONLY_ROUTES = [
  "/admin/users",
  "/admin/suppliers",
  "/admin/manufacturers",
  "/admin/pharmacies",
  "/admin/product-classes",
  "/admin/product-categories",
  "/admin/packaging-units",
  "/admin/dispensing-units",
];

const ADMIN_PHARMACIST_ROUTES = [
  "/admin/dashboard",
  "/admin/inventory",
  "/admin/batches",
  "/admin/inventory-logs",
  "/admin/transactions",
  "/admin/products",
  "/admin/reports",
];

const PUBLIC_ROUTES = ["/auth/login", "/auth/deactivated", "/unauthorized"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const path = request.nextUrl.pathname;

  // Always allow public routes through
  if (PUBLIC_ROUTES.some((r) => path.startsWith(r))) {
    return supabaseResponse;
  }

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not authenticated → redirect to login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // Get user role and status from database
  const { data: userData, error } = await supabase
    .from("users")
    .select("role, is_active, pharmacy_id")
    .eq("auth_id", user.id)
    .single();

  // User not found in public users table → redirect to login
  if (error || !userData) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // Deactivated account → redirect to deactivated page
  if (userData.is_active === false) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/deactivated";
    return NextResponse.redirect(url);
  }

  const role = userData.role;

  // Pharmacy Assistant → cannot access /admin at all
  if (role === "pharmacy_assistant" && path.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = "/unauthorized";
    return NextResponse.redirect(url);
  }

  // Admin only routes
  const isAdminOnlyRoute = ADMIN_ONLY_ROUTES.some((r) => path.startsWith(r));
  if (isAdminOnlyRoute && role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/unauthorized";
    return NextResponse.redirect(url);
  }

  // Admin + Pharmacist routes
  const isAdminPharmacistRoute = ADMIN_PHARMACIST_ROUTES.some((r) =>
    path.startsWith(r),
  );
  if (isAdminPharmacistRoute && role !== "admin" && role !== "pharmacist") {
    const url = request.nextUrl.clone();
    url.pathname = "/unauthorized";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
