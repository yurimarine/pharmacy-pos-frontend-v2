## Style Guide

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

**ProductForm variant support (create only)**: In `mode="create"`, the form supports multiple variants per submission — shared metadata (generic name, brand name, dosage, manufacturer) is entered once and an array of `variants` with per-variant `packaging_type`, `unit_count`, `volume`, `barcode`, `unit_cost`, `requires_prescription`, `status` is appended. Submit inserts one `products` row per variant. In `mode="edit"` the variant array is fixed at length 1.

### Component conventions

Each domain has a folder under `src/components/<domain>/` containing:

- `<Domain>Table.tsx` — Client Component using `@tanstack/react-table`; receives already-paginated data as props. Inventory and Products use URL search params for filtering/pagination — TanStack handles display only (`getCoreRowModel` only, no `getFilteredRowModel` or `getPaginationRowModel`).

**TanStack row selection** — When a table needs multi-row selection for bulk operations, add: `useState<RowSelectionState>({})` for selection state; `getRowId: row => row.id`, `onRowSelectionChange: setRowSelection`, `state: { rowSelection }`, `enableRowSelection: true` to `useReactTable`; a checkbox column as the first column using `table.getIsAllPageRowsSelected()` / `table.getIsSomePageRowsSelected()` in the header and `row.getIsSelected()` in cells; `const selectedIds = Object.keys(rowSelection).filter(k => rowSelection[k])` to derive the ID list; a conditional selection toolbar visible when `selectedIds.length > 0`. Use the key-remount pattern for the bulk-action modal (`setBulkEditKey(k => k+1); setBulkEditOpen(true)`). See `PharmacyInventoryTable.tsx` for the canonical implementation.
- `Add<Domain>Modal.tsx`, `Edit<Domain>Modal.tsx` — Dialog/Sheet wrappers with forms. Modal pattern: `DialogContent className="flex flex-col max-h-[90vh]"`, scrollable middle `<div className="flex-1 overflow-y-auto px-1">`, sticky `DialogHeader`/`DialogFooter` with `flex-shrink-0`. When the submit button is in the footer outside the `<form>`, link them with `id="form-id"` on the form and `form="form-id"` on the button. Use modals for simple single-record forms; use the full-page form pattern for complex multi-item forms.
- `Delete/Deactivate<Domain>Dialog.tsx` — Confirmation dialogs using `AlertDialog`.

Shared utilities (`src/lib/`):

- `src/lib/utils.ts` — `cn()` Tailwind class merger (clsx + tailwind-merge).
- `src/lib/inventory-utils.ts` — `getStockStatus(quantity, threshold, expiryDate?)` returns one of 5 statuses: `expired` (expiry < today), `near_expiry` (≤60 days), `out_of_stock` (qty = 0), `low_stock` (qty ≤ threshold), `in_stock` (default). Expiry checks take precedence over quantity. `stockStatusConfig` maps status → badge props (label, variant, className).
- `src/lib/suggestions.ts` — `upsertSuggestion(table, value)` and `upsertProductSuggestions(productData)`. Used fire-and-forget after every product create/update. Requires `UNIQUE(name)` on each suggestion table.
- `src/lib/pdf-utils.ts` — `downloadPDF(document, filename)` helper for `@react-pdf/renderer`. Renders to blob, appends a temporary anchor to the DOM, clicks, revokes. Always invoke via dynamic import — see architecture.md PDF section.
- `src/lib/report-utils.ts` — `formatCurrency(value)` — Philippine peso (`₱`) formatter.
- `src/lib/get-current-user.ts` — `getCurrentUser()`, `isAdmin()`, `isPharmacist()`, `isPharmacyAssistant()`, `hasPharmacyAccess()`. Used in every server action and protected RSC.

Shared types (`src/types/`):

- `src/types/user.ts` — `AppUser`, `UserRole` (`admin | pharmacist | pharmacy_assistant`), `UserStatus`, `ROLE_LABELS`.
- `src/types/pharmacy.ts` — `Pharmacy`, `PharmacyInput`.
- `src/types/supplier.ts` — `Supplier`, `SupplierInput`.
- `src/types/manufacturer.ts` — `Manufacturer`, `ManufacturerInput`.
- `src/types/product.ts` — `Product`, `ProductFormData`, `ProductType`, `ProductStatus`, `SuggestionItem`, `ProductSuggestions`, `POSProductOption`, `PRODUCT_TYPE_LABELS`, `PRODUCT_STATUS_LABELS`, **`composeProductName(data)`**, `computeSellingPrice()`, `computeMarkupPercentage()`.
- `src/types/transaction.ts` — `Transaction`, `TransactionItem`, `TransactionWithItems`, `TransactionWithDetails`, `TransactionItemWithDiscount`, `TransactionStatus`, `PaymentMethod`.
- `src/types/cart.ts` — `CartItem`, `Cart` types used by POSContext.
- `src/types/discount.ts` — `Discount`, `DiscountType`, `DiscountScope`, `DISCOUNT_TYPE_LABELS`, `DISCOUNT_SCOPE_LABELS`, `computeDiscountAmount(discount, baseAmount)`, `formatDiscountLabel(discount)`.
- `src/types/till-session.ts` — `TillSession`, `TillSessionStatus`, `CashDenomination`, `CashBreakdown`.
- `src/types/inventory.ts` — all inventory/warehouse/transfer/PO types: `StockStatus`, `PharmacyInventory`, `PharmacyInventoryWithProduct`, `StockAdjustment`, `StockAdjustmentType`, `StockAdjustmentReason`, `ADJUSTMENT_REASON_LABELS`, `POSInventoryItem` (snake_case admin version), `POSInventoryTableItem` (camelCase POS table view), `InventoryLog`, `InventoryLogWithDetails`, `WarehouseInventory`, `WarehouseInventoryWithProduct`, `PurchaseOrder`, `PurchaseOrderItem`, `PurchaseOrderWithItems`, `PurchaseOrderStatus`, `PO_STATUS_LABELS`, `WarehouseReceipt`, `WarehouseReceiptItem`, `WarehouseReceiptWithItems`, `WarehouseReceiptStatus`, `WR_STATUS_LABELS`, `StockTransfer`, `StockTransferItem`, `StockTransferWithItems`, `StockTransferStatus`, `ST_STATUS_LABELS`.
- `src/types/reference-data.ts` — `ProductClass`, `ProductCategory`, `PackagingUnit`, `DispensingUnit` — lookup types for product classification fields.

Shared components:

- `src/components/ui/product-combobox.tsx` — `ProductCombobox` + `ProductOption` type. Searchable product selector built on `Popover` + plain `<input>`. Use wherever a product dropdown would otherwise render 50+ items. Filters by `product_name` and `generic_name`. Exports `ProductOption` (id, name, generic_name, base_price, optional current_quantity/markup/selling_price).
- `src/components/ui/creatable-combobox.tsx` — `CreatableCombobox` with built-in `initialFocus={false}` / `finalFocus={false}` fix for use inside Dialogs. Normalizes input to UPPERCASE on blur.
- `src/components/skeletons/PageSkeleton.tsx` — reusable loading skeleton components used in every `loading.tsx` file: `PageHeaderSkeleton` (title + optional button/select), `FilterBarSkeleton` (search + N filter chips), `TableSkeleton` (rows×columns grid), `StatCardsSkeleton` (N stat cards in a grid), `PaginationSkeleton`. Every admin list-page `loading.tsx` composes these; every full-page form route (`new/loading.tsx`, `[id]/edit/loading.tsx`) also has a matching skeleton file.
- `src/components/pdf/PurchaseOrderPDF.tsx`, `src/components/pdf/WarehouseReceiptPDF.tsx` — `@react-pdf/renderer` documents. **Never import statically** anywhere outside the `pdf/` folder.
- `src/components/reports/*` — report tab components (SalesByDateChart, BestSellingProducts, SalesByCategory, SalesByStaff, SalesSummaryCards, SalesReportDocument, FinancialSummaryReport, DiscountReportDocument, TillReconciliationReport, InventoryValueDocument, DeadStockDocument, ReportsTabs, ReportsFilterBar).

Hooks:

- `src/hooks/usePOSKeyboard.ts` — global POS keyboard navigation (F2/F8/Arrow/Enter/Escape). See architecture.md POS section.
- `src/hooks/use-mobile.ts` — viewport breakpoint detector (≤768px).

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

**Exception**: a single selected object passed down for editing (e.g. the inventory row being edited in `EditInventoryModal`) is reliable to pass as a prop — it is already loaded.

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
