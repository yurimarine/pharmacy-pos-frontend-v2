'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/get-current-user'
import { revalidatePath } from 'next/cache'
import type { TillSession, CashBreakdown } from '@/types/till-session'
import { computeCashTotal } from '@/types/till-session'

export async function getActiveTillSession(
  pharmacyId: string,
  userId: string
): Promise<TillSession | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('till_sessions')
    .select('*')
    .eq('pharmacy_id', pharmacyId)
    .eq('opened_by', userId)
    .eq('status', 'open')
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)

  return (data as TillSession) ?? null
}

export async function openTillSession(input: {
  pharmacyId: string
  openingCashBreakdown: CashBreakdown
  openingNotes?: string
}): Promise<TillSession> {
  const currentUser = await getCurrentUser()
  if (!['pharmacist', 'pharmacy_assistant'].includes(currentUser.role)) {
    throw new Error('Unauthorized: Only pharmacists and pharmacy assistants can open a till session.')
  }

  const supabase = await createClient()
  const openingCash = computeCashTotal(input.openingCashBreakdown)

  // Force-close this user's existing open session at this pharmacy (if any)
  await supabase
    .from('till_sessions')
    .update({
      status: 'force_closed',
      closed_at: new Date().toISOString(),
      closing_notes: 'Auto-closed when new session was opened',
      updated_at: new Date().toISOString(),
    })
    .eq('pharmacy_id', input.pharmacyId)
    .eq('opened_by', currentUser.id)
    .eq('status', 'open')

  // Force-close any other user's open session at this pharmacy (if any)
  await supabase
    .from('till_sessions')
    .update({
      status: 'force_closed',
      closed_at: new Date().toISOString(),
      closing_notes: 'Auto-closed when new session was opened',
      updated_at: new Date().toISOString(),
    })
    .eq('pharmacy_id', input.pharmacyId)
    .eq('status', 'open')
    .neq('opened_by', currentUser.id)

  const { data, error } = await supabase
    .from('till_sessions')
    .insert({
      pharmacy_id: input.pharmacyId,
      opened_by: currentUser.id,
      status: 'open',
      opening_cash: openingCash,
      opening_cash_breakdown: input.openingCashBreakdown,
      opening_notes: input.openingNotes ?? null,
      opened_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) throw new Error('Failed to open till session.')

  revalidatePath('/pos-terminal')

  return data as TillSession
}

export async function getSessionSummary(
  sessionId: string
): Promise<{ transactionCount: number; totalSales: number }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('transactions')
    .select('id, total_amount')
    .eq('till_session_id', sessionId)
    .eq('status', 'completed')

  if (error) throw new Error(error.message)

  const rows = data ?? []
  const transactionCount = rows.length
  const totalSales = rows.reduce((sum, t) => sum + (t.total_amount as number), 0)

  return { transactionCount, totalSales }
}

export async function closeTillSession(input: {
  sessionId: string
  closingCashBreakdown: CashBreakdown
  closingNotes?: string
}): Promise<TillSession> {
  const currentUser = await getCurrentUser()
  if (!['pharmacist', 'pharmacy_assistant'].includes(currentUser.role)) {
    throw new Error('Unauthorized: Only pharmacists and pharmacy assistants can close a till session.')
  }

  const supabase = await createClient()

  // Fetch and validate the session
  const { data: session, error: fetchError } = await supabase
    .from('till_sessions')
    .select('*')
    .eq('id', input.sessionId)
    .single()

  if (fetchError || !session) throw new Error('Till session not found.')
  if ((session as TillSession).opened_by !== currentUser.id) {
    throw new Error('You can only close your own till session.')
  }
  if ((session as TillSession).status !== 'open') {
    throw new Error('This till session is already closed.')
  }

  const closingCash = computeCashTotal(input.closingCashBreakdown)

  // Fetch transaction totals for this session
  const { data: txns, error: txnError } = await supabase
    .from('transactions')
    .select('id, total_amount')
    .eq('till_session_id', input.sessionId)
    .eq('status', 'completed')

  if (txnError) throw new Error(txnError.message)

  const rows = txns ?? []
  const transactionCount = rows.length
  const totalSales = rows.reduce((sum, t) => sum + (t.total_amount as number), 0)

  const typedSession = session as TillSession
  const expectedCash = typedSession.opening_cash + totalSales
  const discrepancy = closingCash - expectedCash

  const { data: updated, error: updateError } = await supabase
    .from('till_sessions')
    .update({
      status: 'closed',
      closed_by: currentUser.id,
      closing_cash: closingCash,
      closing_cash_breakdown: input.closingCashBreakdown,
      expected_cash: expectedCash,
      discrepancy,
      transaction_count: transactionCount,
      closed_at: new Date().toISOString(),
      closing_notes: input.closingNotes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.sessionId)
    .select('*')
    .single()

  if (updateError) throw new Error('Failed to close till session.')

  revalidatePath('/pos-terminal')

  return updated as TillSession
}
