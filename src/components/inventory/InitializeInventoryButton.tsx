"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import InitializeInventoryModal from "./InitializeInventoryModal"

export default function InitializeInventoryButton({
  pharmacyId,
}: {
  pharmacyId: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [modalKey, setModalKey] = useState(0)

  const handleOpen = () => {
    setModalKey((k) => k + 1)
    setIsOpen(true)
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleOpen}>
        Initialize inventory
      </Button>
      <InitializeInventoryModal
        key={modalKey}
        open={isOpen}
        onOpenChange={setIsOpen}
        pharmacyId={pharmacyId}
      />
    </>
  )
}
