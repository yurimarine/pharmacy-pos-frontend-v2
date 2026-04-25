'use client'

import { useState } from 'react'
import type { Discount } from '@/types/discount'
import { DiscountsTable } from './DiscountsTable'
import { AddDiscountModal } from './AddDiscountModal'

type Props = {
  data: Discount[]
  count: number
  currentSearch: string
  currentScope: string
  currentType: string
  currentIsActive: string
  currentPage: number
  pageSize: number
}

export function DiscountsPageClient({
  data,
  count,
  currentSearch,
  currentScope,
  currentType,
  currentIsActive,
  currentPage,
  pageSize,
}: Props) {
  const [addModalOpen, setAddModalOpen] = useState(false)

  return (
    <>
      <DiscountsTable
        data={data}
        count={count}
        currentSearch={currentSearch}
        currentScope={currentScope}
        currentType={currentType}
        currentIsActive={currentIsActive}
        currentPage={currentPage}
        pageSize={pageSize}
        onAddClick={() => setAddModalOpen(true)}
      />
      <AddDiscountModal open={addModalOpen} onOpenChange={setAddModalOpen} />
    </>
  )
}
