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
    inventory/page.tsx + actions.ts      # Pharmacy inventory with pricing + stock adjustments
    products/page.tsx + actions.ts
    purchase-orders/page.tsx + actions.ts        # PO management (admin + pharmacist)
    purchase-orders/new/page.tsx                 # Create PO (full page)
    purchase-orders/[id]/edit/page.tsx           # Edit draft PO (full page)
    warehouse-receipts/page.tsx + actions.ts     # Receiving stock into warehouse
    warehouse-receipts/new/page.tsx              # Create receipt (full page)
    warehouse-receipts/[id]/edit/page.tsx        # Edit draft receipt (full page)
    warehouse/page.tsx + actions.ts              # Warehouse inventory (read-only view)
    stock-transfers/page.tsx + actions.ts        # Transfer from warehouse to pharmacy
    stock-transfers/new/page.tsx                 # Create transfer (full page)
    stock-transfers/[id]/edit/page.tsx           # Edit draft transfer (full page)
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
- **Transaction** — a completed sale. Has `transaction_items[]`, `amount_tendered`, `change_amount`, `status` (`completed` | `voided`). Holds `subtotal`, `discount_id` (nullable FK → discounts), `discount_amount`, `reference_id`, `reference_name`. Voiding restores inventory; discount fields are audit records and are NOT reversed on void.
- **TransactionItem** — holds `discount_id` (nullable FK → discounts) and `discount_amount` per item. `total_price` is the pre-discount line total; the discounted price is `total_price - discount_amount`.
- **Discount** — `type` (`percentage` | `fixed`), `scope` (`per_item` | `whole_cart`), `value`, `requires_reference` (bool), `is_active`. Managed at `/admin/discounts`. Loaded into `POSProvider` at layout time for the entire POS session.
- **User** — `role` is `admin | pharmacist | pharmacy_assistant`. Non-admin users have `pharmacy_id`. `is_active` gates login.
- **TillSession** — tracks a staff member's shift at a pharmacy. `status`: `open | closed | force_closed`. Holds `opening_cash` / `closing_cash` / `expected_cash` / `discrepancy` (all nullable except opening), `opening_cash_breakdown` / `closing_cash_breakdown` (JSON), `transaction_count`. A user may only have one open session per pharmacy at a time; opening a new session force-closes any prior open session for the same user. `processTransaction` requires an open session and stamps `till_session_id` on the transaction.
- **Supplier / Manufacturer** — reference data linked to products and purchase orders.
- **PurchaseOrder** — procurement request from a supplier. Status: `draft` → `submitted` → `partially_received` → `received` | `cancelled`. `po_number` is auto-generated by DB sequence. Items have `quantity_ordered`, `unit_cost`, `notes`.
- **WarehouseReceipt** — confirms stock received against a PO. Status: `draft` → `completed` | `cancelled`. On complete: creates `warehouse_inventory` rows and writes `inventory_logs` (action: `received`).
- **WarehouseInventory** — a lot/batch of stock in the warehouse. Has `lot_number`, `expiry_date`, `quantity_remaining`, `unit_cost`. Deducted when stock is transferred to pharmacies.
- **StockTransfer** — moves stock from warehouse to a pharmacy. Status: `draft` → `completed` | `cancelled`. On complete: deducts `warehouse_inventory`, upserts `pharmacy_inventory` via RPC, writes `inventory_logs` (action: `transferred_out`).
- **PharmacyInventory** — per-(product × pharmacy) record. Has `quantity`, `selling_price`, `markup_percentage`, `low_stock_threshold`, `expiry_date`. Updated by stock transfers and manual adjustments.
- **StockAdjustment** — manual correction to pharmacy inventory quantity. Types: `increase` | `decrease`. Reason required. Writes `inventory_log` (action: `adjusted`).
- **InventoryLog** — audit trail for all stock changes. Polymorphic `entity_type` (`warehouse` | `pharmacy`) + `entity_id`. Actions: `received`, `transferred_out`, `transferred_in`, `adjusted`, `sold`, `voided`. NOT joinable on `entity_id` in PostgREST (polymorphic FK).

### Data fetching pattern

Pages are async RSCs. They call Server Actions in `actions.ts` co-located in the route folder, then pass data as props to Client Component tables/forms. Server Actions use `"use server"` and `createClient()` from `src/lib/supabase/server.ts`. Mutations call `revalidatePath` to bust the cache.

```
page.tsx (RSC) → actions.ts ("use server") → Supabase → Client Component
```

**URL search params pattern** — Inventory, Products, Users, and Transactions pages use URL-based filtering, search, and pagination instead of client-side state. `searchParams` is awaited in the RSC, passed to the action, and the Client Component uses `useRouter` + `useSearchParams` to push URL updates. Search is debounced 400ms via `useDebouncedCallback`. `useTransition` wraps `router.push` to get an `isPending` flag for table dimming. When adding this pattern to a new page:

- `searchParams` must be `await`ed in Next.js 16+ — type it as `Promise<{...}>`
- Use controlled input state (`useState`) for search to avoid Base UI's uncontrolled-to-controlled warning
- Actions return `{ data, count }` when pagination is needed — use `{ count: "exact" }` in the Supabase select and `.range(from, to)` for the slice
- **Status filter for computed statuses** — `StockStatus` is not stored in the DB; it is computed from `quantity`, `low_stock_threshold`, and `expiry_date`. When a status filter is active, fetch ALL rows (no server-side range), apply `getStockStatus()` in JS, sort by `product_name` in JS, then slice manually for pagination.

### Inventory write pattern

Every mutation that changes stock quantity follows the same three-step structure. Never skip any step.

**Step 1 — Validate ALL items before mutating ANY**

Before touching any row, loop through every affected item and collect all failures into an errors array. Only proceed if the array is empty. This prevents partial mutations where some items succeed and others fail.

```ts
const errors: string[] = []
for (const item of items) {
  const { data: row } = await supabase.from('...').select('quantity').eq('id', item.id).single()
  if (!row || row.quantity < item.quantity) {
    errors.push(`Insufficient stock for ${item.name}.`)
  }
}
if (errors.length > 0) return { success: false, error: errors.join('; ') }
```

For grouped deductions (e.g. multiple transfer items hitting the same warehouse lot), sum quantities by ID into a `Map<string, number>` before validating — do not validate per-item when the same source row is referenced multiple times.

**Step 2 — Mutate the quantity column**

| Operation | Table | Column | Direction |
|---|---|---|---|
| Warehouse receipt completed | `warehouse_inventory` | `quantity_remaining` | + received qty |
| Stock transfer completed | `warehouse_inventory` | `quantity_remaining` | − transferred qty |
| Stock transfer received | `pharmacy_inventory` | `quantity` | + via RPC (see below) |
| Stock adjustment (increase) | `pharmacy_inventory` | `quantity` | + adjusted qty |
| Stock adjustment (decrease) | `pharmacy_inventory` | `quantity` | − adjusted qty |
| POS sale | `pharmacy_inventory` | `quantity` | − sold qty |
| Transaction void | `pharmacy_inventory` | `quantity` | + restored qty |

For pharmacy_inventory upserts from stock transfers, always use the `upsert_pharmacy_inventory_on_transfer` RPC instead of manual insert/update — it handles the upsert atomically and updates `last_restocked_at`.

**Step 3 — Write inventory_logs via adminClient (mandatory)**

RLS restricts `inventory_logs` inserts to service role. Always use `createAdminClient()`:

```ts
const adminSupabase = createAdminClient()
await adminSupabase.from('inventory_logs').insert({
  entity_type: 'warehouse' | 'pharmacy',
  entity_id: <warehouse_inventory.id or pharmacy_inventory.id>,
  action: 'received' | 'transferred_out' | 'adjusted' | 'sold' | 'voided',
  quantity_before: <qty before mutation>,
  quantity_after: <qty after mutation>,
  quantity_change: <signed delta — negative for decreases>,
  reference_type: 'receipt' | 'transfer' | 'adjustment' | 'transaction',
  reference_id: <parent record id>,
  performed_by: currentUser.id,
})
```

Batch all log entries into a single `.insert(logEntries[])` call after the mutation loop. Log failures are non-fatal after step 2 (the inventory change already happened) — log the error but do not reverse the mutation.

**No rollback after transaction insert** — Once a `transactions` row is committed, inventory deductions and log writes proceed without rollback. The only exception is `transaction_items` insert failure, which deletes the orphaned transaction before throwing.

**`completeWarehouseReceipt` flow** (warehouse-receipts/actions.ts):
validate → insert `warehouse_inventory` rows → write logs (action: `received`) → mark receipt `completed`

**`completeStockTransfer` flow** (stock-transfers/actions.ts):
validate grouped totals → deduct `warehouse_inventory` → write logs (action: `transferred_out`) → RPC upsert `pharmacy_inventory` per item → mark transfer `completed`

**`createStockAdjustment` flow** (inventory/actions.ts):
fetch current qty → guard negative → update `pharmacy_inventory` → insert `stock_adjustments` row → write log (action: `adjusted`)

**`processTransaction` flow** (pos-terminal/actions.ts):
validate stock → insert transaction + items → deduct `pharmacy_inventory` → write logs (action: `sold`)

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

| Route group                                                                                                                                                                    | Allowed roles                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| `ADMIN_ONLY_ROUTES` (users, suppliers, manufacturers, pharmacies, discounts, till-sessions, time-logs, warehouse, warehouse-receipts, stock-transfers, inventory-logs) | `admin` only                       |
| `ADMIN_PHARMACIST_ROUTES` (dashboard, inventory, transactions, products, reports, purchase-orders)                                                                     | `admin`, `pharmacist`              |
| `POS_ROUTES` (`/pos-terminal`)                                                                                                                                                 | `pharmacist`, `pharmacy_assistant` |
| `PUBLIC_ROUTES`                                                                                                                                                                | always                             |

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
const canEdit = userRole === "admin" || userRole === "pharmacist";
const canDelete = userRole === "admin";
```

Actions columns use conditional spread to hide entirely when no actions are available:

```ts
...(canEdit ? [actionsColumn satisfies ColumnDef<T>] : [])
```

Pharmacy selectors: admin sees a `<Select>` to switch pharmacies; pharmacists see a locked read-only label. Inventory page redirects pharmacists back to `?pharmacy=<their id>` if they manually change the URL param.

### Full-page form pattern

Complex multi-item forms (PurchaseOrder, WarehouseReceipt, StockTransfer) use dedicated full pages instead of modals:

- `<domain>/new/page.tsx` — RSC; fetches reference data (suppliers, pharmacies, etc.), renders `<DomainForm mode="create" ... />`
- `<domain>/[id]/edit/page.tsx` — RSC; fetches record + reference data, guards with `notFound()` if missing and `redirect('/admin/<domain>')` if not in an editable status, renders `<DomainForm mode="edit" transfer={...} ... />`
- `<domain>/new/loading.tsx` + `<domain>/[id]/edit/loading.tsx` — matching skeleton files required for every full-page form route
- Shared `<Domain>Form.tsx` in `src/components/<domain>/` — Client Component; accepts `mode: "create" | "edit"` and the existing record (optional) as props

**Canonical form layout** — mirror `ProductForm.tsx`:
- Outer wrapper: `flex flex-col gap-6`
- Inner container: `flex flex-col gap-0`
- Section label: `text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4 pb-2 border-b`
- Between sections: `<Separator />`
- Footer: `border-t pt-6 mt-6 flex justify-between`

**Back navigation** — header uses `<Button render={<Link href="/admin/<domain>" />} nativeButton={false} variant="outline" size="sm">`. Do not use `router.back()`.

**Action pattern for full-page forms** — mutations return `{ error: string } | undefined`. The `redirect()` call on success must be placed **outside** the try/catch block (Next.js redirect throws internally and is caught as an error if inside try/catch):

```ts
async function createX(data) {
  "use server"
  let id: string
  try {
    // ... DB inserts ...
    id = inserted.id
  } catch (e) {
    return { error: "..." }
  }
  redirect(`/admin/x/${id}`) // outside try/catch
}
```

**Exception — ProductForm "stay on page" behavior**: `createProduct` does NOT call `redirect()`. After a successful create the action returns `undefined`, `ProductForm.handleSubmit` detects success (no `result?.error`), resets all form state back to empty, shows a success toast, and calls `router.refresh()` to re-fetch suggestions so newly created values (generic names, categories, etc.) appear immediately in the creatable comboboxes. Edit still redirects server-side via `updateProduct`.

### Component conventions

Each domain has a folder under `src/components/<domain>/` containing:

- `<Domain>Table.tsx` — Client Component using `@tanstack/react-table`; receives already-paginated data as props. Inventory and Products use URL search params for filtering/pagination — TanStack handles display only (`getCoreRowModel` only, no `getFilteredRowModel` or `getPaginationRowModel`).
- `Add<Domain>Modal.tsx`, `Edit<Domain>Modal.tsx` — Dialog/Sheet wrappers with forms. Modal pattern: `DialogContent className="flex flex-col max-h-[90vh]"`, scrollable middle `<div className="flex-1 overflow-y-auto px-1">`, sticky `DialogHeader`/`DialogFooter` with `flex-shrink-0`. When the submit button is in the footer outside the `<form>`, link them with `id="form-id"` on the form and `form="form-id"` on the button. Use modals for simple single-record forms; use the full-page form pattern for complex multi-item forms.
- `Delete/Deactivate<Domain>Dialog.tsx` — Confirmation dialogs using `AlertDialog`.

Shared utilities:

- `src/lib/inventory-utils.ts` — `getStockStatus(quantity, threshold, expiryDate?)` returns one of 5 statuses including `near_expiry` (≤60 days) and `expired`. `stockStatusConfig` maps status → badge props.
- `src/types/user.ts` — `AppUser`, `UserRole`, `ROLE_LABELS` for the users module.
- `src/types/transaction.ts` — `Transaction`, `TransactionItem`, `TransactionWithItems`, `TransactionWithDetails`, `TransactionItemWithDiscount`.
- `src/types/discount.ts` — `Discount`, `DiscountType`, `DiscountScope`, `computeDiscountAmount(discount, baseAmount)`, `formatDiscountLabel(discount)`.
- `src/types/inventory.ts` — all inventory/warehouse/transfer/PO types: `StockStatus`, `PharmacyInventory`, `PharmacyInventoryWithProduct`, `StockAdjustment`, `StockAdjustmentType`, `StockAdjustmentReason`, `ADJUSTMENT_REASON_LABELS`, `POSInventoryItem` (snake_case admin version), `POSInventoryTableItem` (camelCase POS table view), `InventoryLog`, `InventoryLogWithDetails`, `WarehouseInventory`, `WarehouseInventoryWithProduct`, `PurchaseOrder`, `PurchaseOrderItem`, `PurchaseOrderWithItems`, `PurchaseOrderStatus`, `PO_STATUS_LABELS`, `WarehouseReceipt`, `WarehouseReceiptItem`, `WarehouseReceiptWithItems`, `WarehouseReceiptStatus`, `WR_STATUS_LABELS`, `StockTransfer`, `StockTransferItem`, `StockTransferWithItems`, `StockTransferStatus`, `ST_STATUS_LABELS`.
- `src/components/ui/product-combobox.tsx` — `ProductCombobox` + `ProductOption` type. Searchable product selector built on `Popover` + plain `<input>`. Use wherever a product dropdown would otherwise render 50+ items. Filters by `product_name` and `generic_name`. Exports `ProductOption` (id, name, generic_name, base_price, optional current_quantity/markup/selling_price).

### Admin layout and sidebar

`AppSidebar` (`src/components/app-sidebar.tsx`) receives the current user's `role` from `layout.tsx` and filters nav items using a `roles?: Role[]` field on each item. The `NavItem` type includes `external?: boolean` — items with `external: true` render as `<a target="_blank">` instead of a Next.js `<Link>` (used for the POS Terminal link in the pharmacist sidebar).

Nav sections:

- `NavMain` — Dashboard, Inventory, Products, Purchase Orders, Warehouse Receipts (admin), Warehouse (admin), Stock Transfers (admin), Transactions, POS Terminal (pharmacist only, external)
- References group — Suppliers, Manufacturers, Pharmacies, Discounts, Users (all admin only)
- `NavLogs` — Inventory Logs (admin only), Till Sessions (admin only), Time Logs (admin only)
- `NavSecondary` — Settings, Help, Search

### Product name composition

`product_name` is auto-composed and stored on every product create/update. **Never accept `product_name` as form input** — it is always derived.

Composition logic lives in `composeProductName()` in `src/types/product.ts`:

- **Base**: `generic_name` + optional `brand_name` + optional `dosage_strength` + optional `dosage_form` (space-joined, uppercased)
- **Suffix**:
  - if `volume` is present → append `[PACKAGING_TYPE] [VOLUME]`
  - elif `unit_count > 1` → append `[PACKAGING_TYPE] [UNIT_COUNT]'S`
  - else (no volume, unit_count = 1) → no suffix

All text fields are stored as UPPERCASE on the `products` row. After every create or update, call `upsertProductSuggestions()` fire-and-forget to keep the suggestion pool current.

### Creatable select / suggestion pattern

Several product fields (dosage form, dosage strength, packaging type, etc.) use a freeform creatable combobox. The component is `CreatableCombobox` from `src/components/ui/creatable-combobox.tsx`.

- Values are stored as plain UPPERCASE text strings on the `products` row — no FK to a lookup table.
- On save, each non-empty creatable field is upserted via `upsertProductSuggestions()` (fire-and-forget) so it appears in future dropdowns.
- **Each suggestion table must have a `UNIQUE` constraint on `name`** — `upsertSuggestion` uses `.upsert({ name: value }, { onConflict: 'name' })`. Without the constraint, Postgres rejects the `ON CONFLICT` clause with an error that is silently swallowed, and the new value is never saved. If a new suggestion table stops persisting values, verify the constraint: `ALTER TABLE <table> ADD CONSTRAINT <table>_name_key UNIQUE (name);`
- **KNOWN ISSUE — focus trap**: Base UI Popover steals focus by default (`initialFocus` defaults to `true`). Always pass `initialFocus={false}` and `finalFocus={false}` on the `PopoverContent` that wraps the combobox list. This is already fixed inside `creatable-combobox.tsx` — do not remove those props.

### Modal data fetching pattern

Modals must **not** receive reference data (pharmacy lists, PO lists, supplier lists, etc.) via RSC prop chains. Drilling large lists through page → table → modal causes unnecessary RSC re-renders and couples the modal to the page's data load.

**Pattern**: fetch reference data inside the modal via `useEffect` on mount, calling Server Actions directly from the Client Component.

```ts
const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
useEffect(() => {
  getPharmacies().then(setPharmacies)
}, [])
```

Example in the codebase:
- `StockAdjustmentModal` — calls `getPharmacies()` / pharmacy inventory in `useEffect` on open

Note: PurchaseOrder, WarehouseReceipt, and StockTransfer use the full-page form pattern (see above) and receive reference data from the RSC page as props — the modal data-fetching pattern does not apply to them.

**Exception**: a single selected object passed down for editing (e.g. the inventory row being edited in `EditPricingModal`) is reliable to pass as a prop — it is already loaded.

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
- `Popover` (`src/components/ui/popover.tsx`) — built from scratch using `@base-ui/react/popover`. Structure: `Popover` → `PopoverTrigger` (render prop) + `PopoverContent` → `Portal → Positioner → Popup`. To match popover width to its trigger, use `w-(--anchor-width)` on `PopoverContent` — the Base UI Positioner sets `--anchor-width` on itself (Tailwind v4 shorthand; `w-[var(--anchor-width)]` also works but triggers a lint warning).
- `DropdownMenuLabel` and `DropdownMenuItem` must each be direct children of `DropdownMenuGroup` — Base UI's `MenuGroupRootContext` throws if they appear bare inside `DropdownMenuContent`. Always wrap content sections in `<DropdownMenuGroup>`.

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

**Polymorphic entity_id in inventory_logs** — `entity_id` is NOT a direct FK to any single table; it can point to `warehouse_inventory` or `pharmacy_inventory` depending on `entity_type`. Never attempt to join on it in PostgREST queries.

**inventory_logs inserts require adminClient (service role)** — RLS restricts inserts to service role only. Always use `createAdminClient()` when writing to `inventory_logs`.

**upsert_pharmacy_inventory_on_transfer RPC** — called per item in `completeStockTransfer` to atomically upsert `pharmacy_inventory`. Use the RPC, not manual insert/update, to avoid race conditions.

**Status filter for PharmacyInventory** — `StockStatus` is computed (not stored). When filtering by status, fetch all matching rows first, apply `getStockStatus()` in JS, sort + slice manually. See the `getPharmacyInventory` action for the pattern.

**PostgREST nested join column selection** — You cannot select FK columns that belong to a child join context. For example, if you embed `po_items(...)` inside a `purchase_orders` select, you cannot also pull `po_items.purchase_order_id` — it is the PK of the parent, not a column on the child row in PostgREST's view. When in doubt, verify available column names via the Supabase MCP `list_tables` / `execute_sql` tools before writing the query.

**Sequence numbers are DB-generated** — `po_number`, `receipt_number`, and `transfer_number` are generated by DB functions (`generate_po_number()`, `generate_wr_number()`, `generate_st_number()`). Never include them in insert payloads. Retrieve them after insert via `.select('id, po_number')` (or equivalent). The same applies to any other auto-numbered column backed by a sequence.

**CreatableCombobox focus trap** — Base UI Popover sets `initialFocus={true}` by default, which steals keyboard focus when the combobox list opens inside a Dialog. This breaks the text input the user was typing into. Always set `initialFocus={false}` and `finalFocus={false}` on the `PopoverContent` surrounding the suggestion list. This is already applied in `creatable-combobox.tsx` — preserve it.

**`redirect()` inside try/catch** — Next.js `redirect()` works by throwing a special error internally. If called inside a `try/catch` block, that throw is caught and the redirect silently fails. Always call `redirect()` after the try/catch block. The pattern for full-page form actions: do all DB work inside try/catch (return `{ error }` on failure), then call `redirect()` unconditionally after the block.
