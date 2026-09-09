export const PAGE_SIZE_OPTIONS = [20, 50, 100] as const

export const PAGE_SIZE_PARAM = "per_page"

/**
 * Resolve the `?per_page=` search param into a page size.
 *
 * Only values present in PAGE_SIZE_OPTIONS are accepted — anything else
 * (a typo, a stale link, `?per_page=100000`) falls back rather than turning
 * a page load into an unbounded query.
 */
export function resolvePageSize(
  raw: string | undefined,
  fallback: number = PAGE_SIZE_OPTIONS[0],
): number {
  const parsed = Number(raw)
  return (PAGE_SIZE_OPTIONS as readonly number[]).includes(parsed)
    ? parsed
    : fallback
}
