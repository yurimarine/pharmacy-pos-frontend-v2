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
- **Supabase** (`@supabase/ssr`) — auth and database. Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- **@tanstack/react-table**, **recharts**, **@dnd-kit**, **zod**, **sonner**, **vaul** — already installed.
- Path alias: `@/` → `src/`

## Architecture

### Route structure

```
src/app/
  layout.tsx                    # Root layout: fonts, TooltipProvider
  page.tsx                      # Root redirect → /admin/dashboard or /auth/login
  auth/login/page.tsx           # Public login page
  admin/
    layout.tsx                  # Admin shell: SidebarProvider + AppSidebar + SiteHeader
    dashboard/page.tsx
    inventory/page.tsx + actions.ts
    products/page.tsx + actions.ts
    batches/page.tsx + actions.ts
    batches/[id]/page.tsx       # Batch detail with items
    inventory-logs/page.tsx + actions.ts
    manufacturers/page.tsx + actions.ts
    pharmacies/page.tsx + actions.ts
    suppliers/page.tsx + actions.ts
    orders/page.tsx             # Stub (not yet implemented)
```

### Domain model

The app is a multi-pharmacy POS system. Key entities and relationships:

- **Pharmacy** — a physical location. Users belong to one pharmacy (except admins).
- **Product** — catalog item with `base_price`. Can be `branded` or `generic`.
- **Inventory** — a (product × pharmacy) record with `quantity`, `selling_price` (= `base_price + markup_percentage%`), and `low_stock_threshold`.
- **Batch** — a grouped stock operation: `stock_in`, `stock_out`, or `price_change`. Batches are `draft` → `completed` | `cancelled`. Finalizing a batch updates inventory quantities and, if unit costs differ from base_price on stock_in, propagates price changes to all pharmacies.
- **InventoryLog** — written on every `updateInventoryEntry` call; tracks who changed what and why.
- **Supplier / Manufacturer** — reference data linked to products and batch items.

### Data fetching pattern

Pages are async RSCs. They call Server Actions in `actions.ts` co-located in the route folder, then pass data as props to Client Component tables/forms. Server Actions use `"use server"` and `createClient()` from `src/lib/supabase/server.ts`. Mutations call `revalidatePath` to bust the cache.

```
page.tsx (RSC) → actions.ts ("use server") → Supabase → Client Component
```

### Auth flow

`src/lib/supabase/middleware.ts` → `updateSession()` runs on every request. It calls `supabase.auth.getClaims()` and redirects unauthenticated users to `/auth/login`. Any route under `/admin` is protected. The middleware must always return the `supabaseResponse` object unchanged to keep cookies in sync.

Three Supabase client factories:
- `src/lib/supabase/client.ts` — browser (Client Components)
- `src/lib/supabase/server.ts` — RSC / Server Actions
- `src/lib/supabase/middleware.ts` — middleware only; never reuse across requests

Role-based access: `users` table has a `role` field (`"admin"` or otherwise). Actions check `getCurrentUser()` — a helper defined in each `actions.ts` that resolves the Supabase auth user to the app's `users` row. Non-admin users are scoped to their `pharmacy_id`.

### Component conventions

Each domain has a folder under `src/components/<domain>/` containing:
- `<Domain>Table.tsx` — Client Component using `@tanstack/react-table`; receives data as props, calls Server Actions via `useTransition` for mutations.
- `Add<Domain>Modal.tsx`, `Edit<Domain>Modal.tsx` — Dialog/Sheet wrappers with forms.
- `Delete/Deactivate<Domain>Dialog.tsx` — Confirmation dialogs.

Shared utility: `src/lib/inventory-utils.ts` exports `getStockStatus(quantity, threshold)` and `stockStatusConfig` for badge rendering.

### Admin layout composition

`AppSidebar` (`src/components/app-sidebar.tsx`) composes four nav sections:
- `NavMain` — primary links (Dashboard, Inventory, Products, …)
- `NavDocuments` — document shortcuts
- `NavSecondary` — Settings, Help, Search (pinned to bottom)
- `NavUser` — user avatar/menu in the footer

The sidebar width and header height are set as CSS custom properties on `SidebarProvider`:
- `--sidebar-width: calc(var(--spacing) * 72)`
- `--header-height: calc(var(--spacing) * 12)`

### shadcn/ui API differences

This version of shadcn has breaking API changes from common training data:

- `SidebarMenuButton`: use `render={<Link href="..." />}` (not `asChild`) to wrap with Next.js `<Link>`.
- `DropdownMenuTrigger`: use `render={<Button ... />}` (not `asChild`).
- `Select`: accepts an `items` prop for the option list in addition to `<SelectItem>` children.
- `Checkbox`: accepts `indeterminate` prop directly (not via `ref`).
