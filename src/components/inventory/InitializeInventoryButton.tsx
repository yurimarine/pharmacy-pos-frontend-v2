"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import InitializeInventoryModal from "./InitializeInventoryModal";
import { PackagePlus } from "lucide-react";

export default function InitializeInventoryButton({
  pharmacyId,
}: {
  pharmacyId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);

  const handleOpen = () => {
    setModalKey(k => k + 1);
    setIsOpen(true);
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={<Button variant="outline" size="icon" onClick={handleOpen} />}
        >
          <PackagePlus />
        </TooltipTrigger>
        <TooltipContent>
          <p>Initialize Inventory</p>
        </TooltipContent>
      </Tooltip>
      <InitializeInventoryModal
        key={modalKey}
        open={isOpen}
        onOpenChange={setIsOpen}
        pharmacyId={pharmacyId}
      />
    </>
  );
}
