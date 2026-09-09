"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"

interface DecimalInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  step?: number
  disabled?: boolean
  id?: string
  className?: string
  placeholder?: string
}

/**
 * Currency/decimal number input that can be emptied while editing.
 *
 * Plain controlled number inputs bound to `parseFloat(e.target.value) || 0`
 * can never be cleared — the leading `0` gets stuck. This uses a `draft`
 * string (mirroring QuantityInput) so the field can hold "" or a partial
 * value like "1." while typing, while the parent stays a plain `number`.
 */
export function DecimalInput({
  value,
  onChange,
  min,
  step = 0.01,
  disabled = false,
  id,
  className,
  placeholder = "0.00",
}: DecimalInputProps) {
  const [draft, setDraft] = useState<string | null>(null)

  return (
    <Input
      id={id}
      type="number"
      min={min}
      step={step}
      disabled={disabled}
      className={className}
      placeholder={placeholder}
      // A committed 0 renders as an empty field so there is no stuck zero.
      value={draft ?? (value === 0 ? "" : String(value))}
      onFocus={e => e.target.select()}
      onChange={e => {
        const raw = e.target.value
        setDraft(raw)
        // Keep the parent's numeric state live for any markup computation.
        onChange(parseFloat(raw) || 0)
      }}
      // Normalize the display back to the committed number on blur.
      onBlur={() => setDraft(null)}
    />
  )
}
