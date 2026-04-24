"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { PrinterIcon, CheckCircle2Icon } from "lucide-react";
import { usePOS } from "@/context/POSContext";
import {
  closeTillSession,
  getSessionSummary,
} from "@/app/pos-terminal/till-session-actions";
import {
  CASH_DENOMINATIONS,
  type CashBreakdown,
  type TillSession,
  computeCashTotal,
} from "@/types/till-session";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

type ModalStage = "input" | "summary";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatPeso(amount: number): string {
  return `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDenomLabel(denom: number): string {
  return `₱${denom.toLocaleString("en-PH")}`;
}

function computeDuration(start: string, end?: string | null): string {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();
  const diffMins = Math.floor(
    (endDate.getTime() - startDate.getTime()) / 60000,
  );
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

function formatTimeShort(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateLong(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function BreakdownList({ breakdown }: { breakdown: CashBreakdown }) {
  const rows = CASH_DENOMINATIONS.filter(d => (breakdown[d] ?? 0) > 0);
  if (rows.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No denominations recorded.
      </p>
    );
  }
  return (
    <div className="space-y-0.5">
      {rows.map(d => {
        const count = breakdown[d] ?? 0;
        return (
          <div key={d} className="flex justify-between text-xs tabular-nums">
            <span>{formatDenomLabel(d)}</span>
            <span className="text-muted-foreground">× {count}</span>
            <span>{formatPeso(d * count)}</span>
          </div>
        );
      })}
    </div>
  );
}

export function CloseTillModal({ open, onOpenChange }: Props) {
  const { tillSession, setTillSession, pharmacyName, userName } = usePOS();

  // stage starts as 'input'; no reset effect needed — parent remounts via key
  const [stage, setStage] = useState<ModalStage>("input");
  const [breakdown, setBreakdown] = useState<Record<number, number>>({});
  const [closingNotes, setClosingNotes] = useState("");
  // summaryLoading starts true: data loads on mount
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [sessionSummary, setSessionSummary] = useState<{
    transactionCount: number;
    totalSales: number;
  } | null>(null);
  const [closedSession, setClosedSession] = useState<TillSession | null>(null);
  const [isPending, startTransition] = useTransition();

  const sessionId = tillSession?.id;

  // Load session summary once on mount (component is remounted fresh via key each open)
  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;

    getSessionSummary(sessionId)
      .then(result => {
        if (!cancelled) setSessionSummary(result);
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load session summary.");
      })
      .finally(() => {
        if (!cancelled) setSummaryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const closingCash = computeCashTotal(breakdown as CashBreakdown);
  const expectedCash =
    (tillSession?.opening_cash ?? 0) + (sessionSummary?.totalSales ?? 0);
  const discrepancy = closingCash - expectedCash;

  const discrepancyLabel =
    discrepancy > 0
      ? `Over by ${formatPeso(discrepancy)}`
      : discrepancy < 0
        ? `Short by ${formatPeso(Math.abs(discrepancy))}`
        : "Balanced";

  const discrepancyClass =
    discrepancy > 0
      ? "text-green-600"
      : discrepancy < 0
        ? "text-red-600"
        : "text-muted-foreground";

  if (!tillSession) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tillSession) return;

    startTransition(async () => {
      try {
        const result = await closeTillSession({
          sessionId: tillSession.id,
          closingCashBreakdown: breakdown as CashBreakdown,
          closingNotes: closingNotes.trim() || undefined,
        });
        setClosedSession(result);
        setStage("summary");
        toast.success("Till closed successfully. Shift ended.");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to close till.";
        toast.error(message);
      }
    });
  }

  // ── Stage 2: Summary ────────────────────────────────────────────────────

  if (stage === "summary" && closedSession) {
    const totalSales =
      (closedSession.expected_cash ?? 0) - closedSession.opening_cash;

    const closedDiscrepancy = closedSession.discrepancy ?? 0;
    const closedDiscrepancyLabel =
      closedDiscrepancy > 0
        ? `Over by ${formatPeso(closedDiscrepancy)}`
        : closedDiscrepancy < 0
          ? `Short by ${formatPeso(Math.abs(closedDiscrepancy))}`
          : "Balanced";
    const closedDiscrepancyClass =
      closedDiscrepancy > 0
        ? "text-green-600"
        : closedDiscrepancy < 0
          ? "text-red-600"
          : "text-muted-foreground";

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex flex-col max-h-[90vh] sm:max-w-lg">
          <DialogHeader className="shrink-0 items-center text-center">
            <CheckCircle2Icon className="size-10 text-green-600 mb-1" />
            <DialogTitle>Shift Complete</DialogTitle>
            <DialogDescription>
              Your till has been closed. Here is your shift summary.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-1 space-y-4">
            <div id="shift-summary-print" className="space-y-4">
              {/* Header info */}
              <div className="space-y-0.5 text-sm">
                <p className="font-semibold">{pharmacyName}</p>
                <p className="text-muted-foreground">Cashier: {userName}</p>
                <p className="text-muted-foreground">
                  Date: {formatDateLong(closedSession.opened_at)}
                </p>
                <p className="text-muted-foreground">
                  Shift: {formatTimeShort(closedSession.opened_at)}
                  {" → "}
                  {closedSession.closed_at
                    ? formatTimeShort(closedSession.closed_at)
                    : "—"}
                </p>
                <p className="text-muted-foreground">
                  Duration:{" "}
                  {computeDuration(
                    closedSession.opened_at,
                    closedSession.closed_at,
                  )}
                </p>
              </div>

              <Separator />

              {/* Transaction summary */}
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transactions</span>
                  <span className="tabular-nums font-medium">
                    {closedSession.transaction_count}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Sales</span>
                  <span className="tabular-nums font-medium">
                    {formatPeso(totalSales)}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Cash reconciliation */}
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Opening Cash</span>
                  <span className="tabular-nums">
                    {formatPeso(closedSession.opening_cash)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Sales</span>
                  <span className="tabular-nums">{formatPeso(totalSales)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expected Cash</span>
                  <span className="tabular-nums">
                    {formatPeso(closedSession.expected_cash ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Closing Cash</span>
                  <span className="tabular-nums">
                    {formatPeso(closedSession.closing_cash ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Discrepancy</span>
                  <span className={`tabular-nums ${closedDiscrepancyClass}`}>
                    {closedDiscrepancyLabel}
                  </span>
                </div>
              </div>

              {closedSession.opening_cash_breakdown && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Opening Cash Breakdown
                    </p>
                    <BreakdownList
                      breakdown={closedSession.opening_cash_breakdown}
                    />
                  </div>
                </>
              )}

              {closedSession.closing_cash_breakdown && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Closing Cash Breakdown
                    </p>
                    <BreakdownList
                      breakdown={closedSession.closing_cash_breakdown}
                    />
                  </div>
                </>
              )}

              {closedSession.closing_notes && (
                <>
                  <Separator />
                  <p className="text-sm text-muted-foreground">
                    Notes: {closedSession.closing_notes}
                  </p>
                </>
              )}
            </div>
          </div>

          <DialogFooter className="shrink-0">
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="gap-2"
            >
              <PrinterIcon className="size-4" />
              Print Summary
            </Button>
            <Button
              onClick={() => {
                setTillSession(null);
                onOpenChange(false);
              }}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Stage 1: Input ───────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col max-h-[90vh] sm:max-w-lg">
        <DialogHeader className="shrink-0">
          <DialogTitle>Close Till & End Shift</DialogTitle>
          <DialogDescription>
            Count the cash in the drawer to complete your shift.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 space-y-5">
          <form
            id="close-till-form"
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* Shift stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Opened At</p>
                <p className="text-sm font-medium">
                  {formatTimeShort(tillSession.opened_at)}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="text-sm font-medium">
                  {computeDuration(tillSession.opened_at)}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Transactions</p>
                {summaryLoading ? (
                  <Skeleton className="mt-1 h-5 w-10" />
                ) : (
                  <p className="text-sm font-medium">
                    {sessionSummary?.transactionCount ?? "—"}
                  </p>
                )}
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Total Sales</p>
                {summaryLoading ? (
                  <Skeleton className="mt-1 h-5 w-20" />
                ) : (
                  <p className="text-sm font-medium">
                    {sessionSummary
                      ? formatPeso(sessionSummary.totalSales)
                      : "—"}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Cash breakdown table */}
            <div className="space-y-2">
              <div>
                <Label className="text-sm font-medium">
                  Closing Cash Count
                </Label>
                <p className="text-xs text-muted-foreground">
                  Count each denomination currently in the drawer.
                </p>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Denomination</TableHead>
                    <TableHead className="w-28">Count</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {CASH_DENOMINATIONS.map(denom => {
                    const count = breakdown[denom] ?? 0;
                    return (
                      <TableRow key={denom}>
                        <TableCell className="font-medium">
                          {formatDenomLabel(denom)}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            step={1}
                            value={count === 0 ? "" : count}
                            placeholder="0"
                            className="h-8 w-24"
                            onChange={e => {
                              const val = parseInt(e.target.value, 10);
                              const clamped = isNaN(val) ? 0 : Math.max(0, val);
                              setBreakdown(prev => ({
                                ...prev,
                                [denom]: clamped,
                              }));
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatPeso(denom * count)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between border-t pt-3 px-1">
                <span className="text-sm font-bold">Total Closing Cash</span>
                <span className="text-sm font-bold tabular-nums">
                  {formatPeso(closingCash)}
                </span>
              </div>
            </div>

            <Separator />

            {/* Live reconciliation */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Reconciliation</Label>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Opening Cash</span>
                  <span className="tabular-nums">
                    {formatPeso(tillSession.opening_cash)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Sales</span>
                  {summaryLoading ? (
                    <Skeleton className="h-4 w-20" />
                  ) : (
                    <span className="tabular-nums">
                      {sessionSummary
                        ? formatPeso(sessionSummary.totalSales)
                        : "—"}
                    </span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expected Cash</span>
                  {summaryLoading ? (
                    <Skeleton className="h-4 w-20" />
                  ) : (
                    <span className="tabular-nums">
                      {sessionSummary ? formatPeso(expectedCash) : "—"}
                    </span>
                  )}
                </div>
                <div className="border-t pt-2 mt-1 flex justify-between">
                  <span className="text-muted-foreground">Closing Cash</span>
                  <span className="tabular-nums font-medium">
                    {formatPeso(closingCash)}
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Discrepancy</span>
                  {summaryLoading ? (
                    <Skeleton className="h-4 w-20" />
                  ) : (
                    <span className={`tabular-nums ${discrepancyClass}`}>
                      {sessionSummary ? discrepancyLabel : "—"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="closing-notes">Closing Notes</Label>
              <Textarea
                id="closing-notes"
                placeholder="Optional notes for this shift..."
                value={closingNotes}
                onChange={e => setClosingNotes(e.target.value)}
                rows={2}
              />
            </div>
          </form>
        </div>

        <DialogFooter className="shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="close-till-form"
            variant="destructive"
            disabled={isPending || summaryLoading || closingCash === 0}
          >
            {isPending ? "Closing Till..." : "Close Till & End Shift"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
