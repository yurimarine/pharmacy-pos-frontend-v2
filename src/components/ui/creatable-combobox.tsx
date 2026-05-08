"use client"

import { useState, useRef, useEffect } from "react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { SuggestionItem } from "@/types/product"

// Matches Input component styling exactly
const INPUT_CLASSES =
  "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"

type Props = {
  value: string
  onChange: (value: string) => void
  suggestions: SuggestionItem[]
  placeholder?: string
  disabled?: boolean
  id?: string
}

export function CreatableCombobox({
  value,
  onChange,
  suggestions,
  placeholder,
  disabled,
  id,
}: Props) {
  const [inputValue, setInputValue] = useState(value)
  const [isFocused, setIsFocused] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  const filtered = inputValue.trim()
    ? suggestions.filter(s =>
        s.name.toLowerCase().includes(inputValue.toLowerCase()),
      )
    : suggestions

  const hasAddRow = filtered.length === 0 && inputValue.trim().length > 0
  const totalItems = filtered.length + (hasAddRow ? 1 : 0)
  const showDropdown = isFocused && totalItems > 0

  const selectItem = (name: string) => {
    setInputValue(name)
    onChange(name)
    setIsFocused(false)
    setActiveIndex(-1)
  }

  const handleBlur = () => {
    setIsFocused(false)
    const normalized = inputValue.trim().toUpperCase()
    setInputValue(normalized)
    onChange(normalized)
    setActiveIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault()
      inputRef.current?.blur()
      return
    }
    if (!showDropdown) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, totalItems - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (activeIndex >= 0 && activeIndex < filtered.length) {
        selectItem(filtered[activeIndex].name)
      } else if (hasAddRow && activeIndex === filtered.length) {
        selectItem(inputValue.trim().toUpperCase())
      } else {
        inputRef.current?.blur()
      }
    }
  }

  return (
    <Popover
      open={showDropdown}
      onOpenChange={open => {
        if (!open && document.activeElement !== inputRef.current) {
          setIsFocused(false)
        }
      }}
    >
      <PopoverTrigger render={<div className="w-full" />} nativeButton={false}>
        <input
          ref={inputRef}
          id={id}
          value={inputValue}
          onChange={e => {
            setInputValue(e.target.value)
            setActiveIndex(-1)
          }}
          onFocus={() => {
            setIsFocused(true)
            setActiveIndex(-1)
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className={INPUT_CLASSES}
        />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={4}
        initialFocus={false}
        finalFocus={false}
        className="w-(--anchor-width) p-0 max-h-48 overflow-y-auto"
      >
        {filtered.map((s, i) => (
          <div
            key={s.id}
            className={cn(
              "text-sm py-1.5 px-2 cursor-pointer hover:bg-accent",
              i === activeIndex && "bg-accent",
            )}
            onMouseDown={e => e.preventDefault()}
            onClick={() => selectItem(s.name)}
          >
            {s.name}
          </div>
        ))}
        {hasAddRow && (
          <div
            className={cn(
              "text-sm py-1.5 px-2 cursor-pointer hover:bg-accent text-muted-foreground",
              activeIndex === filtered.length && "bg-accent",
            )}
            onMouseDown={e => e.preventDefault()}
            onClick={() => selectItem(inputValue.trim().toUpperCase())}
          >
            Add &ldquo;{inputValue}&rdquo;
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
