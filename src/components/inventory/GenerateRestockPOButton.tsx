"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import GenerateRestockPOModal from "./GenerateRestockPOModal";
import { ArchiveRestore } from "lucide-react";

export default function GenerateRestockPOButton({
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
          <ArchiveRestore />
        </TooltipTrigger>
        <TooltipContent>
          <p>Generate Restock PO</p>
        </TooltipContent>
      </Tooltip>
      <GenerateRestockPOModal
        key={modalKey}
        open={isOpen}
        onOpenChange={setIsOpen}
        pharmacyId={pharmacyId}
      />
    </>
  );
}
