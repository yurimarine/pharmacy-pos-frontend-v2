'use client'

import { useState, useCallback } from 'react'
import { TransactionsTable } from '@/components/transactions/TransactionsTable'
import { POSTransactionReceiptModal } from './POSTransactionReceiptModal'
import { getTransactionById } from '@/app/admin/transactions/actions'
import type { Transaction } from '@/types/transaction'
import type { TransactionWithItems } from '@/types/transaction'

type POSTransactionsListProps = {
  transactions: Transaction[]
  totalCount: number
  currentPage: number
  pageSize: number
  currentSearch: string
  currentStatus: string
  currentPharmacyId: string
  currentDateFrom: string
  currentDateTo: string
  currentUserId: string
}

export function POSTransactionsList({
  transactions,
  totalCount,
  currentPage,
  pageSize,
  currentSearch,
  currentStatus,
  currentPharmacyId,
  currentDateFrom,
  currentDateTo,
  currentUserId,
}: POSTransactionsListProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithItems | null>(null)

  const handleRowClick = useCallback(async (transaction: Transaction) => {
    setSelectedTransaction(null)
    setModalOpen(true)
    const full = await getTransactionById(transaction.id)
    if (full) setSelectedTransaction(full)
  }, [])

  return (
    <>
      <TransactionsTable
        transactions={transactions}
        pharmacies={[]}
        totalCount={totalCount}
        currentPage={currentPage}
        pageSize={pageSize}
        currentSearch={currentSearch}
        currentStatus={currentStatus}
        currentPharmacyId={currentPharmacyId}
        currentDateFrom={currentDateFrom}
        currentDateTo={currentDateTo}
        isAdmin={false}
        currentUserId={currentUserId}
        onRowClick={handleRowClick}
      />

      <POSTransactionReceiptModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        transaction={selectedTransaction}
      />
    </>
  )
}
