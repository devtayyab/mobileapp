/**
 * The supplier dashboard and analytics tiles are reduced from a capped
 * `order_items` scan (see `ITEM_SCAN_LIMIT` on those pages). Once a supplier
 * has more lines than the cap, every aggregate built from that scan —
 * revenue, order count, units sold — is understated.
 *
 * A quietly understated money figure is worse than no figure, so the cap is
 * detected (exact count vs. rows fetched) and stated right next to the
 * affected tiles rather than left invisible.
 */
export function PartialScanNotice({
  scanned,
  total,
  figures,
}: {
  /** Order-item rows actually fetched. */
  scanned: number;
  /** Total matching rows, or null when the count could not be read. */
  total: number | null;
  /** Which figures are affected, e.g. "revenue, orders and units sold". */
  figures: string;
}) {
  return (
    <div className="rounded-2xl border border-warning bg-surface-tint p-4">
      <p className="text-md font-bold text-warning">
        Figures cover your most recent {scanned.toLocaleString()} order lines
      </p>
      <p className="mt-0.5 text-sm text-content-tertiary">
        You have {total != null ? total.toLocaleString() : 'more'} order lines in total, so the{' '}
        {figures} below are a partial view of that window — not an all-time total.
      </p>
    </div>
  );
}
