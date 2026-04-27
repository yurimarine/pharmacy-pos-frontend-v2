'use client'

import {
  type TillSessionWithRelations,
  type TillSessionStatus,
  TILL_SESSION_STATUS_LABELS,
  CASH_DENOMINATIONS,
} from '@/types/till-session'
import { ROLE_LABELS } from '@/types/user'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

type Props = {
  session: TillSessionWithRelations | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatDateLong(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function computeDuration(start: string, end: string | null): string {
  if (!end) return 'In Progress'
  const diffMins = Math.floor(
    (new Date(end).getTime() - new Date(start).getTime()) / 60000,
  )
  const hours = Math.floor(diffMins / 60)
  const mins = diffMins % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

function formatPeso(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function StatusBadge({ status }: { status: TillSessionStatus }) {
  if (status === 'open') {
    return (
      <Badge className="bg-green-500 hover:bg-green-500">
        {TILL_SESSION_STATUS_LABELS.open}
      </Badge>
    )
  }
  if (status === 'force_closed') {
    return (
      <Badge className="bg-amber-500 hover:bg-amber-500">
        {TILL_SESSION_STATUS_LABELS.force_closed}
      </Badge>
    )
  }
  return <Badge variant="secondary">{TILL_SESSION_STATUS_LABELS.closed}</Badge>
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-4 py-1 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
      {children}
    </p>
  )
}

export function TillSessionDetailDialog({ session, open, onOpenChange }: Props) {
  if (!session) return null

  const duration = computeDuration(session.opened_at, session.closed_at)
  const isOpen = session.status === 'open'
  const totalSales =
    session.expected_cash !== null
      ? session.expected_cash - session.opening_cash
      : null

  const hasOpeningBreakdown =
    session.opening_cash_breakdown !== null &&
    Object.values(session.opening_cash_breakdown).some((v) => (v ?? 0) > 0)
  const hasClosingBreakdown =
    session.closing_cash_breakdown !== null &&
    Object.values(session.closing_cash_breakdown).some((v) => (v ?? 0) > 0)
  const hasBreakdown = hasOpeningBreakdown || hasClosingBreakdown

  const hasNotes = !!session.opening_notes || !!session.closing_notes

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col max-h-[90vh] sm:max-w-lg">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Till Session Details</DialogTitle>
          <DialogDescription>
            {session.opened_by_user?.name ?? '—'} ·{' '}
            {ROLE_LABELS[session.opened_by_user?.role as keyof typeof ROLE_LABELS] ??
              session.opened_by_user?.role ??
              '—'}{' '}
            · {session.pharmacies?.name ?? '—'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 space-y-4">
          {/* Overview */}
          <div>
            <SectionLabel>Overview</SectionLabel>
            <InfoRow label="Status">
              <StatusBadge status={session.status} />
            </InfoRow>
            <InfoRow label="Date">{formatDateLong(session.opened_at)}</InfoRow>
            <InfoRow label="Time In">{formatTime(session.opened_at)}</InfoRow>
            <InfoRow label="Time Out">
              {session.closed_at ? (
                session.status === 'force_closed' ? (
                  <span>
                    {formatTime(session.closed_at)}{' '}
                    <span className="text-amber-600 text-xs">(Auto)</span>
                  </span>
                ) : (
                  formatTime(session.closed_at)
                )
              ) : (
                <span className="text-muted-foreground italic">In Progress</span>
              )}
            </InfoRow>
            <InfoRow label="Duration">
              {duration === 'In Progress' ? (
                <span className="text-muted-foreground italic">In Progress</span>
              ) : (
                duration
              )}
            </InfoRow>
            <InfoRow label="Closed By">
              {session.closed_by_user?.name ?? '—'}
            </InfoRow>
          </div>

          <Separator />

          {/* Cash Reconciliation */}
          <div>
            <SectionLabel>Cash Reconciliation</SectionLabel>
            {isOpen ? (
              <p className="text-sm text-muted-foreground">
                Session is still open. Reconciliation available after closing.
              </p>
            ) : (
              <>
                <InfoRow label="Opening Cash">
                  {formatPeso(session.opening_cash)}
                </InfoRow>
                <InfoRow label="Total Sales">
                  {totalSales !== null ? formatPeso(totalSales) : '—'}
                </InfoRow>
                <InfoRow label="Expected Cash">
                  {session.expected_cash !== null
                    ? formatPeso(session.expected_cash)
                    : '—'}
                </InfoRow>
                <InfoRow label="Closing Cash">
                  {session.closing_cash !== null
                    ? formatPeso(session.closing_cash)
                    : '—'}
                </InfoRow>
                <InfoRow label="Transactions">
                  {session.transaction_count}
                </InfoRow>
                <InfoRow label="Discrepancy">
                  {session.discrepancy === null ? (
                    <span className="text-muted-foreground">—</span>
                  ) : session.discrepancy > 0 ? (
                    <span className="text-green-600 font-medium tabular-nums">
                      +{formatPeso(session.discrepancy)}{' '}
                      <span className="font-normal text-xs">Over</span>
                    </span>
                  ) : session.discrepancy < 0 ? (
                    <span className="text-red-600 font-medium tabular-nums">
                      -{formatPeso(Math.abs(session.discrepancy))}{' '}
                      <span className="font-normal text-xs">Short</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground tabular-nums">
                      {formatPeso(0)} Balanced
                    </span>
                  )}
                </InfoRow>
              </>
            )}
          </div>

          {/* Cash Breakdown */}
          {hasBreakdown && (
            <>
              <Separator />
              <div>
                <SectionLabel>Cash Breakdown</SectionLabel>

                {hasOpeningBreakdown && session.opening_cash_breakdown && (
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground mb-1">Opening</p>
                    <div className="rounded-md border text-sm overflow-hidden">
                      {CASH_DENOMINATIONS.filter(
                        (d) => (session.opening_cash_breakdown![d] ?? 0) > 0,
                      ).map((denom) => {
                        const count = session.opening_cash_breakdown![denom] ?? 0
                        return (
                          <div
                            key={denom}
                            className="flex items-center justify-between px-3 py-1.5 border-b last:border-b-0 tabular-nums"
                          >
                            <span className="text-muted-foreground">₱{denom}</span>
                            <span className="text-muted-foreground">× {count}</span>
                            <span className="font-medium">
                              {formatPeso(denom * count)}
                            </span>
                          </div>
                        )
                      })}
                      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/40 font-medium">
                        <span>Total</span>
                        <span>{formatPeso(session.opening_cash)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {hasClosingBreakdown && session.closing_cash_breakdown ? (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Closing</p>
                    <div className="rounded-md border text-sm overflow-hidden">
                      {CASH_DENOMINATIONS.filter(
                        (d) => (session.closing_cash_breakdown![d] ?? 0) > 0,
                      ).map((denom) => {
                        const count = session.closing_cash_breakdown![denom] ?? 0
                        return (
                          <div
                            key={denom}
                            className="flex items-center justify-between px-3 py-1.5 border-b last:border-b-0 tabular-nums"
                          >
                            <span className="text-muted-foreground">₱{denom}</span>
                            <span className="text-muted-foreground">× {count}</span>
                            <span className="font-medium">
                              {formatPeso(denom * count)}
                            </span>
                          </div>
                        )
                      })}
                      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/40 font-medium">
                        <span>Total</span>
                        <span>
                          {session.closing_cash !== null
                            ? formatPeso(session.closing_cash)
                            : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No cash breakdown recorded.
                  </p>
                )}
              </div>
            </>
          )}

          {!hasBreakdown && (
            <>
              <Separator />
              <div>
                <SectionLabel>Cash Breakdown</SectionLabel>
                <p className="text-sm text-muted-foreground">
                  No cash breakdown recorded.
                </p>
              </div>
            </>
          )}

          {/* Notes */}
          {hasNotes && (
            <>
              <Separator />
              <div>
                <SectionLabel>Notes</SectionLabel>
                {session.opening_notes && (
                  <div className="mb-2">
                    <p className="text-xs text-muted-foreground mb-0.5">
                      Opening Notes
                    </p>
                    <p className="text-sm">{session.opening_notes}</p>
                  </div>
                )}
                {session.closing_notes && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">
                      Closing Notes
                    </p>
                    <p className="text-sm">{session.closing_notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
