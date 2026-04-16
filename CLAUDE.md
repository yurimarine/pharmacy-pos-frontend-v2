# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run lint     # Run ESLint
```

No test suite is configured yet.

## Stack

- **Next.js 16.2.2** + **React 19.2.4** — App Router. This is a newer version than training data; always check `node_modules/next/dist/docs/` before writing Next.js-specific code.
- **Tailwind CSS v4** — PostCSS-based, no `tailwind.config.js`. Config lives in `globals.css`.
- **shadcn/ui** — components live in `src/components/ui/`. Add new ones via `npx shadcn add <component>`.
- **Supabase** (`@supabase/ssr`) — auth and database. Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- **@tanstack/react-table**, **recharts**, **@dnd-kit**, **zod**, **sonner**, **vaul**, **use-debounce** — already installed.
- Path alias: `@/` → `src/`

## Architecture

### Route structure

```
src/app/
  layout.tsx                    # Root layout: fonts, TooltipProvider
  page.tsx                      # Root redirect → /admin/dashboard or /auth/login
  auth/login/page.tsx           # Public login page
  auth/deactivated/page.tsx     # Shown when account is deactivated
  unauthorized/page.tsx         # Shown when role lacks permission
  admin/
    layout.tsx                  # Admin shell: SidebarProvider + AppSidebar + SiteHeader
    dashboard/page.tsx
    inventory/page.tsx + actions.ts
    products/page.tsx + actions.ts
    batches/page.tsx + actions.ts
    batches/[id]/page.tsx       # Batch detail with items
    inventory-logs/page.tsx + actions.ts
    users/page.tsx + actions.ts # User management (admin only)
    manufacturers/page.tsx + actions.ts
    pharmacies/page.tsx + actions.ts
    suppliers/page.tsx + actions.ts
    orders/page.tsx             # Stub (not yet implemented)
    product-classes/, product-categories/, packaging-units/, dispensing-units/
```

### Domain model

The app is a multi-pharmacy POS system. Key entities and relationships:

- **Pharmacy** — a physical location. Users belong to one pharmacy (except admins).
- **Product** — catalog item with `base_price`. Can be `branded` or `generic`.
- **Inventory** — a (product × pharmacy) record with `quantity`, `selling_price` (= `base_price + markup_percentage%`), `low_stock_threshold`, `expiry_date`, and `last_restocked_at`.
- **Batch** — a grouped stock operation. Types: `stock_in`, `stock_out`, `markup_change`, `base_price_change`. Batches are `draft` → `completed` | `cancelled`.
  - `stock_in`: adds inventory at a pharmacy. If `unit_cost` differs from `base_price`, propagates a base price update globally on finalize.
  - `stock_out`: deducts inventory at a pharmacy. `batch_items.reason` is required.
  - `markup_change`: updates `inventory.markup_percentage` + recalculates `selling_price` at a specific pharmacy. `batch_items.unit_cost` stores the new markup %.
  - `base_price_change`: updates `products.base_price` globally, recalculates `selling_price` across all pharmacies. `pharmacy_id` is null on the batch.
- **InventoryLog** — written on every `updateInventoryEntry` call; tracks who changed what and why.
- **User** — `role` is `admin | pharmacist | pharmacy_assistant`. Non-admin users have `pharmacy_id`. `is_active` gates login.
- **Supplier / Manufacturer** — reference data linked to products and batch items.

### Data fetching pattern

Pages are async RSCs. They call Server Actions in `actions.ts` co-located in the route folder, then pass data as props to Client Component tables/forms. Server Actions use `"use server"` and `createClient()` from `src/lib/supabase/server.ts`. Mutations call `revalidatePath` to bust the cache.

```
page.tsx (RSC) → actions.ts ("use server") → Supabase → Client Component
```

**URL search params pattern** — Inventory, Products, and Users pages use URL-based filtering, search, and pagination instead of client-side state. `searchParams` is awaited in the RSC, passed to the action, and the Client Component uses `useRouter` + `useSearchParams` to push URL updates. Search is debounced 400ms via `useDebouncedCallback`. `useTransition` wraps `router.push` to get an `isPending` flag for table dimming. When adding this pattern to a new page:
- `searchParams` must be `await`ed in Next.js 16+ — type it as `Promise<{...}>`
- Use controlled input state (`useState`) for search to avoid Base UI's uncontrolled-to-controlled warning
- Actions return `{ data, count }` when pagination is needed — use `{ count: "exact" }` in the Supabase select and `.range(from, to)` for the slice

### Auth and role-based access

**Middleware** — `src/lib/supabase/middleware.ts` runs `updateSession()` on every request. It calls `supabase.auth.getUser()` then does one DB query to fetch `role`, `is_active`, and `pharmacy_id` from the `users` table. Route gating:

| Routes | Allowed roles |
|---|---|
| `ADMIN_ONLY_ROUTES` (`/admin/users`, `/admin/suppliers`, `/admin/manufacturers`, `/admin/pharmacies`, `/admin/product-classes`, `/admin/product-categories`, `/admin/packaging-units`, `/admin/dispensing-units`) | `admin` only |
| `ADMIN_PHARMACIST_ROUTES` (`/admin/dashboard`, `/admin/inventory`, `/admin/batches`, `/admin/inventory-logs`, `/admin/products`) | `admin`, `pharmacist` |
| `/admin/*` (anything else) | blocked for `pharmacy_assistant` |
| `PUBLIC_ROUTES` (`/auth/login`, `/auth/deactivated`, `/unauthorized`) | always allowed |

Deactivated accounts (`is_active = false`) are redirected to `/auth/deactivated` before any route check.

**`src/lib/get-current-user.ts`** — shared helper used in Server Actions and page RSCs to resolve the authenticated Supabase user to the app's `users` row. Exports `getCurrentUser()`, `isAdmin()`, `isPharmacist()`, `isPharmacyAssistant()`, `hasPharmacyAccess()`. Throws if not authenticated, user record not found, or account deactivated. **All mutation server actions must call `getCurrentUser()` and check role before proceeding.**

**`src/lib/supabase/admin.ts`** — service-role client (`SUPABASE_SERVICE_ROLE_KEY`). Only imported in server action files. Used in `users/actions.ts` for Supabase Auth admin operations (create user, reset password, ban/unban).

Three regular Supabase client factories:
- `src/lib/supabase/client.ts` — browser (Client Components)
- `src/lib/supabase/server.ts` — RSC / Server Actions
- `src/lib/supabase/middleware.ts` — middleware only; never reuse across requests

### Role-scoped UI pattern

Pages that have per-role behavior pass `userRole` and `userPharmacyId` (from `getCurrentUser()`) as props to their Client Component tables. The convention:

```ts
const canEdit   = userRole === 'admin' || userRole === 'pharmacist'
const canDelete = userRole === 'admin'
```

Actions columns use conditional spread to hide entirely when no actions are available:
```ts
...(canEdit ? [actionsColumn satisfies ColumnDef<T>] : [])
```

Pharmacy selectors: admin sees a `<Select>` to switch pharmacies; pharmacists see a locked read-only label. Inventory page redirects pharmacists back to `?pharmacy=<their id>` if they manually change the URL param.

### Component conventions

Each domain has a folder under `src/components/<domain>/` containing:
- `<Domain>Table.tsx` — Client Component using `@tanstack/react-table`; receives already-paginated data as props. Inventory and Products use URL search params for filtering/pagination — TanStack handles display only (`getCoreRowModel` only, no `getFilteredRowModel` or `getPaginationRowModel`).
- `Add<Domain>Modal.tsx`, `Edit<Domain>Modal.tsx` — Dialog/Sheet wrappers with forms. Modal pattern: `DialogContent className="flex flex-col max-h-[90vh]"`, scrollable middle `<div className="flex-1 overflow-y-auto px-1">`, sticky `DialogHeader`/`DialogFooter` with `flex-shrink-0`. When the submit button is in the footer outside the `<form>`, link them with `id="form-id"` on the form and `form="form-id"` on the button.
- `Delete/Deactivate<Domain>Dialog.tsx` — Confirmation dialogs using `AlertDialog`.

Shared utilities:
- `src/lib/inventory-utils.ts` — `getStockStatus(quantity, threshold, expiryDate?)` returns one of 5 statuses including `near_expiry` (≤60 days) and `expired`. `stockStatusConfig` maps status → badge props.
- `src/types/user.ts` — `AppUser`, `UserRole`, `ROLE_LABELS` for the users module.

### SelectValue display fix

This shadcn version uses `@base-ui/react/select`. `SelectValue` does not auto-render the selected item's label — it renders the raw value string. Always pass the resolved label as children:
- UUID selects: `{items.find(i => i.id === field.value)?.name}`
- Enum selects: `{LABEL_MAP[field.value]}` — define a static `Record<string, string>` map

### Admin layout and sidebar

`AppSidebar` (`src/components/app-sidebar.tsx`) receives the current user's `role` from `layout.tsx` and filters nav items using a `roles?: Role[]` field on each item. Items without `roles` are visible to all. Nav sections:
- `NavMain` — Dashboard, Inventory, Products, Batches, Order (all roles)
- References group — Suppliers, Manufacturers, Pharmacies, Users (admin only)
- `NavLogs` — Inventory Logs (admin only), Transaction Logs, Time Logs
- `NavSecondary` — Settings, Help, Search (all roles)

`NavUser` (`src/components/nav-user.tsx`) shows `ROLE_LABELS[role]` as the subtitle in the sidebar footer trigger and in the dropdown header.

The sidebar width and header height are set as CSS custom properties on `SidebarProvider`:
- `--sidebar-width: calc(var(--spacing) * 72)`
- `--header-height: calc(var(--spacing) * 12)`

### shadcn/ui API differences

This version of shadcn has breaking API changes from common training data:

- `SidebarMenuButton`: use `render={<Link href="..." />}` (not `asChild`) to wrap with Next.js `<Link>`.
- `DropdownMenuTrigger`: use `render={<Button ... />}` (not `asChild`).
- `Button` with `render={<Link />}`: add `nativeButton={false}` to suppress Base UI warning about non-`<button>` rendering.
- `Select`: `onValueChange` receives `string | null`, not `string` — guard against null before using the value.
- `Checkbox`: accepts `indeterminate` prop directly (not via `ref`).
