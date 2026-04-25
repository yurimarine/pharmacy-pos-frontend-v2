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
  page.tsx                      # Root redirect → role-based (/pos-terminal or /admin/dashboard)
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
    transactions/page.tsx + actions.ts
    transactions/[id]/page.tsx  # Transaction detail with void support
    users/page.tsx + actions.ts # User management (admin only)
    manufacturers/page.tsx + actions.ts
    pharmacies/page.tsx + actions.ts
    suppliers/page.tsx + actions.ts
    orders/page.tsx             # Stub (not yet implemented)
    discounts/page.tsx + actions.ts      # Admin CRUD for discount definitions (admin only)
    till-sessions/page.tsx + actions.ts  # Admin view of all sessions; force-close
    time-logs/page.tsx + actions.ts      # Attendance-focused read-only view (admin only)
    product-classes/, product-categories/, packaging-units/, dispensing-units/
  pos-terminal/
    layout.tsx                  # POS shell: POSHeader + POSProvider (no admin sidebar)
    page.tsx                    # Client component; renders gate or POSLayout based on tillSession
    actions.ts                  # getPOSInventory, processTransaction
    till-session-actions.ts     # getActiveTillSession, openTillSession, getSessionSummary, closeTillSession
    inventory/page.tsx + actions.ts  # Read-only inventory view for POS users
    transactions/page.tsx + actions.ts
    transactions/[id]/page.tsx  # Shared TransactionDetail component
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
- **Transaction** — a completed sale. Has `transaction_items[]`, `amount_tendered`, `change_amount`, `status` (`completed` | `voided`). Holds `subtotal`, `discount_id` (nullable FK → discounts), `discount_amount`, `reference_id`, `reference_name`. Voiding restores inventory; discount fields are audit records and are NOT reversed on void.
- **TransactionItem** — holds `discount_id` (nullable FK → discounts) and `discount_amount` per item. `total_price` is the pre-discount line total; the discounted price is `total_price - discount_amount`.
- **Discount** — `type` (`percentage` | `fixed`), `scope` (`per_item` | `whole_cart`), `value`, `requires_reference` (bool), `is_active`. Managed at `/admin/discounts`. Loaded into `POSProvider` at layout time for the entire POS session.
- **User** — `role` is `admin | pharmacist | pharmacy_assistant`. Non-admin users have `pharmacy_id`. `is_active` gates login.
- **TillSession** — tracks a staff member's shift at a pharmacy. `status`: `open | closed | force_closed`. Holds `opening_cash` / `closing_cash` / `expected_cash` / `discrepancy` (all nullable except opening), `opening_cash_breakdown` / `closing_cash_breakdown` (JSON), `transaction_count`. A user may only have one open session per pharmacy at a time; opening a new session force-closes any prior open session for the same user. `processTransaction` requires an open session and stamps `till_session_id` on the transaction.
- **Supplier / Manufacturer** — reference data linked to products and batch items.

### Data fetching pattern

Pages are async RSCs. They call Server Actions in `actions.ts` co-located in the route folder, then pass data as props to Client Component tables/forms. Server Actions use `"use server"` and `createClient()` from `src/lib/supabase/server.ts`. Mutations call `revalidatePath` to bust the cache.

```
page.tsx (RSC) → actions.ts ("use server") → Supabase → Client Component
```

**URL search params pattern** — Inventory, Products, Users, and Transactions pages use URL-based filtering, search, and pagination instead of client-side state. `searchParams` is awaited in the RSC, passed to the action, and the Client Component uses `useRouter` + `useSearchParams` to push URL updates. Search is debounced 400ms via `useDebouncedCallback`. `useTransition` wraps `router.push` to get an `isPending` flag for table dimming. When adding this pattern to a new page:
- `searchParams` must be `await`ed in Next.js 16+ — type it as `Promise<{...}>`
- Use controlled input state (`useState`) for search to avoid Base UI's uncontrolled-to-controlled warning
- Actions return `{ data, count }` when pagination is needed — use `{ count: "exact" }` in the Supabase select and `.range(from, to)` for the slice

### Auth and role-based access

**Middleware** — `src/lib/supabase/middleware.ts` runs `updateSession()` on every request. Route gating logic order:

1. Public routes (`/auth/login`, `/auth/deactivated`, `/unauthorized`) — allowed through; authenticated users hitting `/auth/login` are redirected role-based.
2. Unauthenticated → `/auth/login`
3. DB query for `role`, `is_active`, `pharmacy_id`
4. User record not found → `/auth/login`
5. Deactivated (`is_active = false`) → `/auth/deactivated`
6. **POS routes** (`/pos-terminal`): admin → `/admin/dashboard`; pharmacist/PA → allow
7. Pharmacy Assistant on `/admin/*` → `/unauthorized`
8. `ADMIN_ONLY_ROUTES` and non-admin → `/unauthorized`
9. `ADMIN_PHARMACIST_ROUTES` and non-admin/pharmacist → `/unauthorized`

| Route group | Allowed roles |
|---|---|
| `ADMIN_ONLY_ROUTES` (users, suppliers, manufacturers, pharmacies, discounts, product-classes, product-categories, packaging-units, dispensing-units, till-sessions, time-logs) | `admin` only |
| `ADMIN_PHARMACIST_ROUTES` (dashboard, inventory, batches, inventory-logs, transactions, products, reports) | `admin`, `pharmacist` |
| `POS_ROUTES` (`/pos-terminal`) | `pharmacist`, `pharmacy_assistant` |
| `PUBLIC_ROUTES` | always |

**Login redirects** — both `src/app/page.tsx` (root) and `src/app/auth/login/actions.ts` (post-login) redirect based on role: `pharmacy_assistant` → `/pos-terminal`, all others → `/admin/dashboard`.

**`src/lib/get-current-user.ts`** — shared helper used in Server Actions and page RSCs. Exports `getCurrentUser()`, `isAdmin()`, `isPharmacist()`, `isPharmacyAssistant()`, `hasPharmacyAccess()`. Throws if not authenticated, user record not found, or account deactivated. **All mutation server actions must call `getCurrentUser()` and check role before proceeding.**

**`src/lib/supabase/admin.ts`** — service-role client. Only used in `users/actions.ts` for Supabase Auth admin operations and in `voidTransaction` for admin credential re-auth.

Three regular Supabase client factories:
- `src/lib/supabase/client.ts` — browser (Client Components)
- `src/lib/supabase/server.ts` — RSC / Server Actions
- `src/lib/supabase/middleware.ts` — middleware only; never reuse across requests

### POS Terminal

The POS terminal is a separate layout (`/pos-terminal`) with its own shell — no admin sidebar. It uses `POSContext` for shared cart state.

**`src/context/POSContext.tsx`** — React context wrapping the entire POS layout. Holds:
- Static metadata: `pharmacyName`, `userName`, `pharmacyId`, `userRole`
- `tillSession: TillSession | null` + `setTillSession` — seeded from layout RSC
- `inventory: POSInventoryItem[]` — seeded from layout RSC via `POSProvider` props
- Cart state: `cartItems`, `addToCart`, `addToCartWithQuantity`, `removeFromCart`, `updateQuantity`, `clearCart`
- Discount state: `activeDiscounts`, `cartDiscount`, `cartDiscountAmount`, `referenceId`, `referenceName`, `applyItemDiscount`, `setCartDiscount`, `setReference`, `clearAllDiscounts`
- Computed: `subtotal`, `totalAmount`, `itemCount`, `totalDiscountAmount`, `discountMode` (`'per_item' | 'whole_cart' | null`)
- Search: `searchQuery`, `setSearchQuery`

**Discount mutual exclusivity** — `discountMode` is derived via `useMemo` (never stored). Applying an item discount clears the cart discount and vice versa. `setCartDiscount` throws synchronously if a fixed discount exceeds the cart subtotal (client-side floor check); `processTransaction` repeats this check server-side. `CartItem` carries `discount: Discount | null` and `discountAmount: number`. Per-item discount amounts are computed from `item.unitPrice * item.quantity`; the whole-cart discount amount is stored separately in `cartDiscountAmount`.

`addToCart` guards: out-of-stock/expired items are rejected with a toast; quantity is capped at available stock with a toast.

**Till session lifecycle (POS)** — `pos-terminal/layout.tsx` (RSC) fetches both inventory and the active till session, seeds them into `POSProvider`. `pos-terminal/page.tsx` is a Client Component that reads `tillSession` from context: if null, renders the gate page (card + Open Till button + `OpenTillModal`); otherwise renders `<POSLayout />`. `TillSessionIndicator` (inside `POSHeader`) shows elapsed time and an "End Shift" button that opens `CloseTillModal`. `CloseTillModal` has two stages: `input` (reconciliation form) and `summary` (shift report with print support). The "Done" button on stage 2 calls `setTillSession(null)` to return to the gate page.

**`processTransaction`** (`src/app/pos-terminal/actions.ts`) — validates role → **validates open till session** → validates cart → server-side floor check (fixed cart discount > subtotal throws) → validates tendered amount (post-discount total) → checks stock for ALL items (collects all errors before throwing) → generates TXN number via Supabase RPC → inserts transaction (with `till_session_id`, `subtotal`, `discount_id`, `discount_amount`, `reference_id`, `reference_name`) → inserts items (with `discount_id`, `discount_amount` per item) → deducts inventory (no rollback on deduction for audit integrity) → revalidates. Input receives discount fields from `POSPaymentModal`; per-item discounts travel through `CartItem.discount`/`CartItem.discountAmount`.

**`voidTransaction`** (`src/app/admin/transactions/actions.ts`) — re-authenticates the admin via `adminClient.auth.signInWithPassword` → verifies admin role in DB → restores inventory BEFORE marking voided (if restoration fails, status is NOT changed).

**POS cart panel layout** — `POSCartPanel` uses `flex flex-col` with:
- Items area: `flex-1 min-h-0 overflow-y-auto` — grows to fill all space
- Footer (totals + buttons): `shrink-0` — anchored at bottom, natural height only

Payment is handled via **`POSPaymentModal`** — a Dialog that opens when "PROCESS SALE" is clicked. Contains amount tendered input (autofocused on open, reset on each open), change display, and the Confirm & Process button. Receipt logic and `POSReceiptModal` are mounted inside `POSPaymentModal`, not the cart panel.

**Shared components** between `/admin/transactions` and `/pos-terminal/transactions`:
- `src/components/transactions/TransactionsTable.tsx` — accepts `basePath` prop for detail page navigation; both routes use `getTransactions` from `src/app/admin/transactions/actions.ts`
- `src/components/transactions/TransactionDetail.tsx` — full detail view with void support; uses `TransactionWithDetails` type

**Transaction types** (`src/types/transaction.ts`):
- `TransactionWithItems` — `Omit<Transaction, 'transaction_items'> & { transaction_items: TransactionItem[] }` — used by `POSTransactionReceiptModal`
- `TransactionWithDetails` — includes `transaction_discount` join (nullable) and `transaction_items: TransactionItemWithDiscount[]` (each item includes `item_discount` join) — returned by `getTransactionById`, consumed by `TransactionDetail`
- `TransactionItemWithDiscount` — extends `TransactionItem` with `item_discount: { id, name, type, value, scope } | null`

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
- `src/types/transaction.ts` — `Transaction`, `TransactionItem`, `TransactionWithItems`, `TransactionWithDetails`, `TransactionItemWithDiscount`.
- `src/types/discount.ts` — `Discount`, `DiscountType`, `DiscountScope`, `computeDiscountAmount(discount, baseAmount)`, `formatDiscountLabel(discount)`.
- `src/types/inventory.ts` — `POSInventoryTableItem`, `Inventory`, `StockStatus`.

### Admin layout and sidebar

`AppSidebar` (`src/components/app-sidebar.tsx`) receives the current user's `role` from `layout.tsx` and filters nav items using a `roles?: Role[]` field on each item. The `NavItem` type includes `external?: boolean` — items with `external: true` render as `<a target="_blank">` instead of a Next.js `<Link>` (used for the POS Terminal link in the pharmacist sidebar).

Nav sections:
- `NavMain` — Dashboard, Inventory, Products, Batches, Order, POS Terminal (pharmacist only, external)
- References group — Suppliers, Manufacturers, Pharmacies, Discounts, Users (admin only)
- `NavLogs` — Inventory Logs (admin only), Transactions (admin + pharmacist), Till Sessions (admin only), Time Logs (admin only)
- `NavSecondary` — Settings, Help, Search

### SelectValue display fix

This shadcn version uses `@base-ui/react/select`. `SelectValue` does not auto-render the selected item's label — it renders the raw value string. Always pass the resolved label as children:
- UUID selects: `{items.find(i => i.id === field.value)?.name}`
- Enum selects: `{LABEL_MAP[field.value]}` — define a static `Record<string, string>` map

### shadcn/ui API differences

This version of shadcn has breaking API changes from common training data:

- `SidebarMenuButton`: use `render={<Link href="..." />}` (not `asChild`) to wrap with Next.js `<Link>`.
- `DropdownMenuTrigger`: use `render={<Button ... />}` (not `asChild`).
- `PopoverTrigger`: use `render={<Button ... />}` (not `asChild`) — same Base UI render prop pattern.
- `Button` with `render={<Link />}`: add `nativeButton={false}` to suppress Base UI warning about non-`<button>` rendering.
- `Select`: `onValueChange` receives `string | null`, not `string` — guard against null before using the value.
- `Checkbox`: accepts `indeterminate` prop directly (not via `ref`).
- `Popover` (`src/components/ui/popover.tsx`) — built from scratch using `@base-ui/react/popover`. Structure: `Popover` → `PopoverTrigger` (render prop) + `PopoverContent` → `Portal → Positioner → Popup`.

### Known pitfalls

**PostgREST joined-column filtering** — You cannot use `.eq()` or `.ilike()` on columns from an embedded relation (e.g. `opened_by_user.name`). Workaround: pre-resolve matching IDs with a separate `users` query, then use `.in('opened_by', userIds)` on the parent table. If the user query returns zero rows, return `{ data: [], count: 0 }` immediately to skip the main query.

**react-compiler: synchronous `setState` in `useEffect`** — The react-compiler ESLint rule treats any synchronous `setState()` call directly in the `useEffect` body as an error ("Calling setState synchronously within an effect"). Avoid reset `useEffect`s that call multiple setters. Instead, reset modal state by remounting the component via a `key` prop (increment a `modalKey` counter in the parent on each open) so initial `useState` values serve as the reset. Only call `setState` inside async `.then()` / `.catch()` / `.finally()` chains within effects.

**Modal state reset via `key` remount** — Rather than a `useEffect` that resets a modal's state on open/close, increment a `key` integer in the parent each time the modal is opened. React will unmount and remount the component, so all `useState` initializers re-run. This is the preferred pattern for CloseTillModal and similar two-stage modals.

**Print isolation** — To print a specific section of the page, give it `id="section-id"` and add a `@media print` block in `globals.css` that hides everything else (`body > * { display: none }`) and shows only `#section-id`. See the shift summary print block at the bottom of `globals.css`.

**Supabase FK alias syntax for joins** — When two FK columns reference the same table (e.g. both `processed_by` and `voided_by` → `users`), Supabase requires a hint. Use the alias + FK constraint name syntax:
```ts
users!transactions_processed_by_fkey ( name, role )
voided_by_user:users!transactions_voided_by_fkey ( name )
transaction_discount:discounts!transactions_discount_id_fkey ( id, name, type )
```
The alias (left of `:`) becomes the key on the returned object. Without the FK hint, PostgREST throws an ambiguous join error.
