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

  return (
    <div className={cn("relative flex items-center gap-1", className)}>
      {/* Decrement */}
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        disabled={disabled}
        aria-label="Decrease quantity"
        onMouseDown={e => e.preventDefault()}
        onClick={() => step(-1)}
      >
        <MinusIcon className="size-3" />
      </Button>

      {/* Number input */}
      <input
        type="number"
        min={min}
        max={max}
        className={cn(
          "w-full min-w-0 h-8 rounded-md border border-input bg-transparent px-2 py-1 text-center text-sm shadow-xs transition-[color,box-shadow] outline-none",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        )}
        value={draft ?? value}
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            if (draft === null) setDraft(String(value))
            setIsOpen(true)
          }
        }}
        onFocus={e => {
          if (draft === null) setDraft(String(value))
          ;(e.target as HTMLInputElement).select()
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
        aria-label="Increase quantity"
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
                aria-label={`Add ${p}`}
                className="h-7 min-w-[2.5rem] px-2 text-xs rounded-md border border-border bg-background hover:bg-muted font-medium transition-colors"
                onMouseDown={e => e.preventDefault()}
                onClick={() => step(p)}
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
                aria-label={`Subtract ${p}`}
                className="h-7 min-w-[2.5rem] px-2 text-xs rounded-md border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 text-destructive font-medium transition-colors"
                onMouseDown={e => e.preventDefault()}
                onClick={() => step(-p)}
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
