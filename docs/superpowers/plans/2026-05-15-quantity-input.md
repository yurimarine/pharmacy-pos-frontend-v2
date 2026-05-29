# QuantityInput Component Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable `QuantityInput` component with `[−]` / number input / `[+]` controls and a click-to-open preset popover, then replace all quantity inputs across 6 files.

**Architecture:** A single Client Component in `src/components/ui/QuantityInput.tsx`. Controlled by `value`/`onChange` props. Uses a local `draft` string buffer so `onChange` only fires on blur or Enter (not every keystroke). The preset panel is a plain absolute-positioned `div` — no Base UI Popover — so it works cleanly inside table grid cells. All buttons use `onMouseDown: e.preventDefault()` to keep input focus, then read the effective value via a helper to avoid stale-closure double-fires.

**Tech Stack:** React 19, Tailwind v4, lucide-react (MinusIcon, PlusIcon), `@/components/ui/button`, `@/lib/utils` (cn)

---

## File Map

| Action | File |
|---|---|
| Create | `src/components/ui/QuantityInput.tsx` |
| Modify | `src/components/pos/POSCartItem.tsx` |
| Modify | `src/components/purchase-orders/PurchaseOrderForm.tsx` |
| Modify | `src/components/warehouse-receipts/WarehouseReceiptForm.tsx` |
| Modify | `src/components/stock-transfers/StockTransferForm.tsx` |
| Modify | `src/components/inventory/StockAdjustmentModal.tsx` |
| Modify | `src/components/inventory/InitializeInventoryModal.tsx` |

---

## Task 1: Create `QuantityInput` component

**Files:**
- Create: `src/components/ui/QuantityInput.tsx`

- [ ] **Step 1: Write the component**

```tsx
"use client"

import { useState } from "react"
import { MinusIcon, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface QuantityInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  disabled?: boolean
  className?: string
}

const PRESETS = [1, 5, 10, 50, 100]

export function QuantityInput({
  value,
  onChange,
  min = 0,
  max,
  disabled = false,
  className,
}: QuantityInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState<string | null>(null)

  const clamp = (v: number) => {
    const lo = Math.max(min, v)
    return max !== undefined ? Math.min(max, lo) : lo
  }

  // Returns the effective number from draft (if editing) or current prop value.
  // Used by buttons so they operate on what's in the input, not the stale prop.
  const effective = () => {
    if (draft === null) return value
    const parsed = parseInt(draft, 10)
    return isNaN(parsed) ? value : parsed
  }

  const commit = () => {
    const next = clamp(effective())
    setDraft(null)
    onChange(next)
  }

  const step = (delta: number) => {
    const next = clamp(effective() + delta)
    setDraft(null)
    setIsOpen(false)
    onChange(next)
  }

  const applyPreset = (delta: number) => {
    const next = clamp(effective() + delta)
    setDraft(null)
    setIsOpen(false)
    onChange(next)
  }

  return (
    <div className={cn("relative flex items-center gap-1", className)}>
      {/* Decrement */}
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        disabled={disabled}
        onMouseDown={e => e.preventDefault()}
        onClick={() => step(-1)}
      >
        <MinusIcon className="size-3" />
      </Button>

      {/* Number input */}
      <input
        type="number"
        className={cn(
          "w-full min-w-0 h-8 rounded-md border border-input bg-transparent px-2 py-1 text-center text-sm shadow-xs transition-[color,box-shadow] outline-none",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        )}
        value={draft ?? value}
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setDraft(String(value))
            setIsOpen(true)
          }
        }}
        onFocus={() => {
          if (draft === null) setDraft(String(value))
        }}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => {
          commit()
          setIsOpen(false)
        }}
        onKeyDown={e => {
          if (e.key === "Enter") {
            commit()
            setIsOpen(false)
            ;(e.target as HTMLInputElement).blur()
          }
          if (e.key === "Escape") {
            setDraft(null)
            setIsOpen(false)
            ;(e.target as HTMLInputElement).blur()
          }
        }}
      />

      {/* Increment */}
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        disabled={disabled}
        onMouseDown={e => e.preventDefault()}
        onClick={() => step(1)}
      >
        <PlusIcon className="size-3" />
      </Button>

      {/* Preset panel */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-max rounded-md border bg-popover text-popover-foreground shadow-md p-2 flex flex-col gap-1.5">
          {/* Add row */}
          <div className="flex gap-1">
            {PRESETS.map(p => (
              <button
                key={p}
                type="button"
                className="h-7 min-w-[2.5rem] px-2 text-xs rounded-md border border-border bg-background hover:bg-muted font-medium transition-colors"
                onMouseDown={e => e.preventDefault()}
                onClick={() => applyPreset(p)}
              >
                +{p}
              </button>
            ))}
          </div>
          {/* Subtract row */}
          <div className="flex gap-1">
            {PRESETS.map(p => (
              <button
                key={p}
                type="button"
                className="h-7 min-w-[2.5rem] px-2 text-xs rounded-md border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 text-destructive font-medium transition-colors"
                onMouseDown={e => e.preventDefault()}
                onClick={() => applyPreset(-p)}
              >
                −{p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify build is clean**

```bash
cd /Users/brandocalvento/Desktop/pharmacy-pos-frontend-v2 && npm run build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully` or similar — no TypeScript errors on the new file.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/QuantityInput.tsx
git commit -m "feat: add QuantityInput reusable component with preset popover"
```

---

## Task 2: Replace quantity input in `POSCartItem`

The cart item already has `[−]` / Input / `[+]` as separate elements. Replace all three with a single `QuantityInput`.

**Files:**
- Modify: `src/components/pos/POSCartItem.tsx`

- [ ] **Step 1: Update imports**

Remove `MinusIcon`, `PlusIcon` from the lucide-react import (they're no longer used directly). Add `QuantityInput`.

Find:
```tsx
import { Trash2Icon, MinusIcon, PlusIcon, TagIcon } from "lucide-react";
```
Replace with:
```tsx
import { Trash2Icon, TagIcon } from "lucide-react";
import { QuantityInput } from "@/components/ui/QuantityInput";
```

- [ ] **Step 2: Replace the qty stepper block**

Find the entire `{/* Qty stepper */}` block:
```tsx
        {/* Qty stepper */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-7"
            onClick={() => updateQuantity(item.inventoryId, item.quantity - 1)}
          >
            <MinusIcon className="size-3" />
          </Button>
          <Input
            className="w-12 h-7 text-center text-sm p-0"
            type="number"
            min={1}
            max={item.maxQuantity}
            value={item.quantity}
            onChange={(e) =>
              updateQuantity(item.inventoryId, parseInt(e.target.value) || 1)
            }
          />
          <Button
            variant="outline"
            size="icon"
            className="size-7"
            disabled={item.quantity >= item.maxQuantity}
            onClick={() => updateQuantity(item.inventoryId, item.quantity + 1)}
          >
            <PlusIcon className="size-3" />
          </Button>
          <span className="text-xs text-muted-foreground">
            × ₱{item.unitPrice.toFixed(2)}
          </span>
        </div>
```

Replace with:
```tsx
        {/* Qty stepper */}
        <div className="flex items-center gap-1">
          <QuantityInput
            value={item.quantity}
            onChange={(v) => updateQuantity(item.inventoryId, v)}
            min={1}
            max={item.maxQuantity}
          />
          <span className="text-xs text-muted-foreground">
            × ₱{item.unitPrice.toFixed(2)}
          </span>
        </div>
```

- [ ] **Step 3: Remove unused `Input` import if it's now unused**

Check the file — `Input` was imported from `@/components/ui/input`. If it's no longer used anywhere else in the file, remove the import line:
```tsx
import { Input } from "@/components/ui/input";
```

- [ ] **Step 4: Verify build**

```bash
cd /Users/brandocalvento/Desktop/pharmacy-pos-frontend-v2 && npm run build 2>&1 | tail -20
```

Expected: clean build, no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/pos/POSCartItem.tsx
git commit -m "feat: use QuantityInput in POSCartItem cart qty stepper"
```

---

## Task 3: Replace quantity input in `PurchaseOrderForm`

The qty column is currently `80px` — too narrow for `[−] input [+]`. Widen to `140px` in both the header label row and the item rows.

**Files:**
- Modify: `src/components/purchase-orders/PurchaseOrderForm.tsx`

- [ ] **Step 1: Add import**

Add after the existing imports:
```tsx
import { QuantityInput } from "@/components/ui/QuantityInput";
```

- [ ] **Step 2: Widen the qty grid column (header row)**

Find:
```tsx
          <div className="grid grid-cols-[2fr_80px_120px_100px_1fr_36px] gap-2 px-1 mb-2">
```
Replace with:
```tsx
          <div className="grid grid-cols-[2fr_140px_120px_100px_1fr_36px] gap-2 px-1 mb-2">
```

- [ ] **Step 3: Widen the qty grid column (item rows)**

Find:
```tsx
                className="grid grid-cols-[2fr_80px_120px_100px_1fr_36px] gap-2 items-center"
```
Replace with:
```tsx
                className="grid grid-cols-[2fr_140px_120px_100px_1fr_36px] gap-2 items-center"
```

- [ ] **Step 4: Replace the `quantity_ordered` Input**

Find:
```tsx
                <Input
                  type="number"
                  min={1}
                  value={item.quantity_ordered}
                  onChange={e =>
                    updateItem(i, {
                      quantity_ordered: Math.max(1, Number(e.target.value)),
                    })
                  }
                />
```
Replace with:
```tsx
                <QuantityInput
                  value={item.quantity_ordered}
                  onChange={v => updateItem(i, { quantity_ordered: Math.max(1, v) })}
                  min={1}
                />
```

- [ ] **Step 5: Verify build**

```bash
cd /Users/brandocalvento/Desktop/pharmacy-pos-frontend-v2 && npm run build 2>&1 | tail -20
```

Expected: clean build.

- [ ] **Step 6: Commit**

```bash
git add src/components/purchase-orders/PurchaseOrderForm.tsx
git commit -m "feat: use QuantityInput in PurchaseOrderForm quantity_ordered field"
```

---

## Task 4: Replace quantity input in `WarehouseReceiptForm`

The qty column (`quantity_received`) is currently `90px` — widen to `140px`.

**Files:**
- Modify: `src/components/warehouse-receipts/WarehouseReceiptForm.tsx`

- [ ] **Step 1: Add import**

```tsx
import { QuantityInput } from "@/components/ui/QuantityInput";
```

- [ ] **Step 2: Widen the qty grid column (header row)**

Find:
```tsx
          <div className="grid grid-cols-[2fr_90px_110px_120px_130px_1fr_36px] gap-2 px-1 mb-2">
```
Replace with:
```tsx
          <div className="grid grid-cols-[2fr_140px_110px_120px_130px_1fr_36px] gap-2 px-1 mb-2">
```

- [ ] **Step 3: Widen the qty grid column (item rows)**

Find:
```tsx
                className="grid grid-cols-[2fr_90px_110px_120px_130px_1fr_36px] gap-2 items-center"
```
Replace with:
```tsx
                className="grid grid-cols-[2fr_140px_110px_120px_130px_1fr_36px] gap-2 items-center"
```

- [ ] **Step 4: Replace the `quantity_received` Input**

Find:
```tsx
                {/* Qty received */}
                <Input
                  type="number"
                  min={1}
                  value={item.quantity_received}
                  onChange={e =>
                    updateItem(i, {
                      quantity_received: Math.max(1, Number(e.target.value)),
                    })
                  }
                />
```
Replace with:
```tsx
                {/* Qty received */}
                <QuantityInput
                  value={item.quantity_received}
                  onChange={v => updateItem(i, { quantity_received: Math.max(1, v) })}
                  min={1}
                />
```

- [ ] **Step 5: Verify build**

```bash
cd /Users/brandocalvento/Desktop/pharmacy-pos-frontend-v2 && npm run build 2>&1 | tail -20
```

Expected: clean build.

- [ ] **Step 6: Commit**

```bash
git add src/components/warehouse-receipts/WarehouseReceiptForm.tsx
git commit -m "feat: use QuantityInput in WarehouseReceiptForm quantity_received field"
```

---

## Task 5: Replace quantity input in `StockTransferForm`

Two separate quantity inputs — one in the `by_receipt` section and one in the `by_product` section. Both use the same grid `[2fr_2fr_90px_120px_36px]` — widen the 90px qty column to 140px (there are 3 occurrences: 1 header, 2 row grids).

**Files:**
- Modify: `src/components/stock-transfers/StockTransferForm.tsx`

- [ ] **Step 1: Add import**

```tsx
import { QuantityInput } from "@/components/ui/QuantityInput";
```

- [ ] **Step 2: Widen all three grid column declarations**

There are 3 occurrences of `grid-cols-[2fr_2fr_90px_120px_36px]` — the shared header label row and two item-row grids (one per transfer mode). Replace all three:

Find (replace all occurrences):
```
grid-cols-[2fr_2fr_90px_120px_36px]
```
Replace with:
```
grid-cols-[2fr_2fr_140px_120px_36px]
```

(There should be exactly 3 occurrences — 1 at line ~548, 1 at ~574, 1 at ~637. Confirm count before running.)

- [ ] **Step 3: Replace qty input in the `by_receipt` section**

Find the `{/* Qty with validation */}` block in the by_receipt section (the one that does NOT have `disabled`):
```tsx
                    {/* Qty with validation */}
                    <div className="flex flex-col gap-1">
                      <Input
                        type="number"
                        min={1}
                        max={lockedBatch?.quantity_remaining}
                        value={row.quantity}
                        className={isOver ? "border-destructive" : ""}
                        onChange={e =>
                          updateRow(i, {
                            quantity: Math.max(1, Number(e.target.value)),
                          })
                        }
                      />
                      {isOver && (
                        <p className="text-xs text-destructive">
                          Max: {maxQty}
                        </p>
                      )}
                    </div>
```
Replace with:
```tsx
                    {/* Qty with validation */}
                    <div className="flex flex-col gap-1">
                      <QuantityInput
                        value={row.quantity}
                        onChange={v => updateRow(i, { quantity: Math.max(1, v) })}
                        min={1}
                        max={lockedBatch?.quantity_remaining}
                      />
                      {isOver && (
                        <p className="text-xs text-destructive">
                          Max: {maxQty}
                        </p>
                      )}
                    </div>
```

- [ ] **Step 4: Replace qty input in the `by_product` section**

Find the `{/* Qty with validation */}` block in the by_product section (the one with `disabled={!row.warehouse_inventory_id}`):
```tsx
                  {/* Qty with validation */}
                  <div className="flex flex-col gap-1">
                    <Input
                      type="number"
                      min={1}
                      value={row.quantity}
                      className={isOver ? "border-destructive" : ""}
                      disabled={!row.warehouse_inventory_id}
                      onChange={e =>
                        updateRow(i, {
                          quantity: Math.max(1, Number(e.target.value)),
                        })
                      }
                    />
                    {isOver && (
                      <p className="text-xs text-destructive">Max: {maxQty}</p>
                    )}
                  </div>
```
Replace with:
```tsx
                  {/* Qty with validation */}
                  <div className="flex flex-col gap-1">
                    <QuantityInput
                      value={row.quantity}
                      onChange={v => updateRow(i, { quantity: Math.max(1, v) })}
                      min={1}
                      max={maxQty === Infinity ? undefined : maxQty}
                      disabled={!row.warehouse_inventory_id}
                    />
                    {isOver && (
                      <p className="text-xs text-destructive">Max: {maxQty}</p>
                    )}
                  </div>
```

- [ ] **Step 5: Verify build**

```bash
cd /Users/brandocalvento/Desktop/pharmacy-pos-frontend-v2 && npm run build 2>&1 | tail -20
```

Expected: clean build.

- [ ] **Step 6: Commit**

```bash
git add src/components/stock-transfers/StockTransferForm.tsx
git commit -m "feat: use QuantityInput in StockTransferForm quantity fields"
```

---

## Task 6: Replace quantity input in `StockAdjustmentModal`

The modal uses `quantity` as a `string` state (`useState<string>("1")`), with `qty` as the parsed number. Wire QuantityInput to `qty`/`setQuantity(String(v))` to avoid touching the surrounding submit logic.

**Files:**
- Modify: `src/components/inventory/StockAdjustmentModal.tsx`

- [ ] **Step 1: Add import**

```tsx
import { QuantityInput } from "@/components/ui/QuantityInput";
```

- [ ] **Step 2: Replace the `sa-qty` Input**

Find:
```tsx
            <Input
              id="sa-qty"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
```
Replace with:
```tsx
            <QuantityInput
              value={qty}
              onChange={(v) => setQuantity(String(v))}
              min={0}
            />
```

Note: `qty` is already declared above as `const qty = Math.max(0, parseInt(quantity, 10) || 0)`. This pattern keeps the existing string state and derived `qty` intact — no changes to `newTotal`, `wouldGoNegative`, or `handleSubmit`.

- [ ] **Step 3: Verify build**

```bash
cd /Users/brandocalvento/Desktop/pharmacy-pos-frontend-v2 && npm run build 2>&1 | tail -20
```

Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add src/components/inventory/StockAdjustmentModal.tsx
git commit -m "feat: use QuantityInput in StockAdjustmentModal"
```

---

## Task 7: Replace quantity input in `InitializeInventoryModal`

The `quantity` state is already a `number` (`useState(0)`), so the wire-up is direct.

**Files:**
- Modify: `src/components/inventory/InitializeInventoryModal.tsx`

- [ ] **Step 1: Add import**

```tsx
import { QuantityInput } from "@/components/ui/QuantityInput";
```

- [ ] **Step 2: Replace the `ii-quantity` Input**

Find:
```tsx
                <Input
                  id="ii-quantity"
                  type="number"
                  min={0}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                  disabled={nothingToInit}
                />
```
Replace with:
```tsx
                <QuantityInput
                  value={quantity}
                  onChange={setQuantity}
                  min={0}
                  disabled={nothingToInit}
                />
```

- [ ] **Step 3: Verify build**

```bash
cd /Users/brandocalvento/Desktop/pharmacy-pos-frontend-v2 && npm run build 2>&1 | tail -20
```

Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add src/components/inventory/InitializeInventoryModal.tsx
git commit -m "feat: use QuantityInput in InitializeInventoryModal default quantity"
```

---

## Task 8: Final verification

- [ ] **Step 1: Full build**

```bash
cd /Users/brandocalvento/Desktop/pharmacy-pos-frontend-v2 && npm run build 2>&1 | tail -30
```

Expected: build succeeds with no TypeScript errors. All 7 modified files compile cleanly.

- [ ] **Step 2: Lint check**

```bash
cd /Users/brandocalvento/Desktop/pharmacy-pos-frontend-v2 && npm run lint 2>&1 | tail -20
```

Expected: no new lint errors introduced.
