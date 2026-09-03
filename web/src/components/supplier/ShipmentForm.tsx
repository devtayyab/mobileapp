'use client';

/**
 * "Shipment & Tracking" card + create/update dialog for the supplier order
 * detail screen — port of mobile `app/supplier/orders/[id].tsx`.
 *
 * Schema notes:
 * - `shipments.courier_id` came from a later ALTER; the legacy `carrier` text
 *   column is still the display fallback when no courier row is joined.
 * - `shipment_status` is a DIFFERENT enum from `order_status`: valid values are
 *   pending | picked_up | in_transit | out_for_delivery | delivered | failed.
 *   'shipped' exists only on `order_status`, so a new shipment is written as
 *   `in_transit` (exactly what the mobile screen does, with the same comment).
 * - The order itself is advanced to `shipped` through the
 *   `update_order_status_from_shipment` RPC, which is not in the generated
 *   `Database['public']['Functions']` map yet — hence the narrow cast below.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, Truck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/cn';
import { Button, Input, Modal } from '@/components/ui';
import { useToast } from '@/providers/ToastProvider';
import type { Courier, ShipmentStatus } from '@/types/database';

export type ShipmentCourier = Pick<Courier, 'id' | 'name' | 'code' | 'tracking_url_format'>;

export type SupplierShipment = {
  id: string;
  courier_id: string | null;
  tracking_number: string | null;
  carrier: string | null;
  status: ShipmentStatus | null;
  couriers: { name: string; code: string; tracking_url_format: string | null } | null;
};

/** shipment_status -> status token palette (same mapping as OrderDetailView). */
const SHIPMENT_TONE: Record<string, string> = {
  pending: 'bg-status-pending',
  picked_up: 'bg-status-processing',
  in_transit: 'bg-status-shipped',
  out_for_delivery: 'bg-status-shipped',
  delivered: 'bg-status-delivered',
  failed: 'bg-status-cancelled',
};

function trackingUrl(format: string | null | undefined, trackingNumber: string | null) {
  if (!format || !trackingNumber) return null;

  const url = format
    .replace('{tracking_number}', trackingNumber)
    .replace('{tracking}', trackingNumber)
    .replace('%s', trackingNumber);

  return url === format ? null : url;
}

export function ShipmentForm({
  orderId,
  supplierId,
  orderStatus,
  couriers,
  shipment,
}: {
  orderId: string;
  supplierId: string;
  orderStatus: string;
  couriers: ShipmentCourier[];
  shipment: SupplierShipment | null;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [courierId, setCourierId] = useState(shipment?.courier_id ?? '');
  const [trackingNumber, setTrackingNumber] = useState(shipment?.tracking_number ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const courierName = shipment?.couriers?.name ?? shipment?.carrier ?? 'Courier';
  const link = trackingUrl(shipment?.couriers?.tracking_url_format, shipment?.tracking_number ?? null);
  const canSubmit = Boolean(courierId) && trackingNumber.trim().length > 0;

  const openDialog = () => {
    setCourierId(shipment?.courier_id ?? '');
    setTrackingNumber(shipment?.tracking_number ?? '');
    setError(null);
    setOpen(true);
  };

  const save = async () => {
    if (!canSubmit) {
      setError('Please select a courier and enter a tracking number.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();

      const payload = {
        order_id: orderId,
        supplier_id: supplierId,
        courier_id: courierId,
        tracking_number: trackingNumber.trim(),
        // 'shipped' is not in the shipment_status enum — mobile uses in_transit.
        status: 'in_transit' as ShipmentStatus,
        shipped_at: new Date().toISOString(),
      };

      const { error: writeError } = shipment?.id
        ? await supabase.from('shipments').update(payload).eq('id', shipment.id)
        : await supabase.from('shipments').insert(payload);

      if (writeError) throw new Error(writeError.message);

      // Advance the order itself only while it is still pre-fulfilment.
      if (orderStatus === 'pending' || orderStatus === 'processing') {
        // `update_order_status_from_shipment` is not in the generated Functions
        // map in @/types/database (shared file — cannot be edited here).
        const rpcClient = supabase as unknown as {
          rpc: (
            fn: string,
            args: Record<string, unknown>
          ) => Promise<{ error: { message: string } | null }>;
        };
        const { error: rpcError } = await rpcClient.rpc('update_order_status_from_shipment', {
          p_order_id: orderId,
          p_status: 'shipped',
        });
        if (rpcError) {
          // Mobile only warns here: the shipment write already succeeded.
          console.warn('Order status update failed:', rpcError.message);
        }
      }

      setOpen(false);
      toast({
        title: 'Tracking saved',
        message: `${trackingNumber.trim()} is now on order.`,
        kind: 'success',
      });
      router.refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'An error occurred while saving.';
      setError(message);
      toast({ title: 'Could not save tracking', message, kind: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-edge bg-surface p-4">
      <div className="mb-3.5 flex items-center gap-2">
        <Truck size={18} className="text-primary" />
        <h2 className="text-lg font-bold text-content-primary">Shipment &amp; Tracking</h2>
      </div>

      {shipment ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center rounded-3xl bg-surface-tint px-3 py-1.5 text-base font-bold text-primary">
              {courierName}
            </span>
            {shipment.status && (
              <span
                className={cn(
                  'inline-flex items-center rounded-3xl px-2.5 py-1 text-xxs font-extrabold uppercase tracking-[0.5px] text-white',
                  SHIPMENT_TONE[shipment.status] ?? 'bg-content-tertiary'
                )}
              >
                {shipment.status.replace(/_/g, ' ')}
              </span>
            )}
          </div>

          <div className="rounded-md border border-edge bg-surface-tint p-3">
            <p className="text-xs font-bold uppercase tracking-[0.5px] text-content-tertiary">
              Tracking Number
            </p>
            <p className="mt-1 text-xl font-extrabold tracking-[1px] text-content-primary">
              {shipment.tracking_number ?? '—'}
            </p>
            {link && (
              <a
                href={link}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-base font-bold text-primary hover:underline"
              >
                Track shipment
                <ExternalLink size={14} />
              </a>
            )}
          </div>

          <Button variant="outline" fullWidth onClick={openDialog}>
            Update Tracking
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2.5 py-5">
          <Truck size={32} className="text-edge-dark" />
          <p className="text-md text-content-tertiary">No tracking info yet</p>
          <Button onClick={openDialog}>+ Add Tracking Details</Button>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add / Update Tracking">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-md font-bold text-content-primary">Courier Company</p>
            {couriers.length === 0 ? (
              <p className="text-base text-content-tertiary">
                No active couriers are configured yet — ask an administrator to add one.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {couriers.map((c) => {
                  const active = c.id === courierId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCourierId(c.id)}
                      className={cn(
                        'rounded-3xl border px-4 py-2.5 text-md font-bold transition-colors',
                        active
                          ? 'border-primary bg-primary text-white'
                          : 'border-edge bg-surface text-content-primary hover:bg-surface-page'
                      )}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            )}
            {!courierId && couriers.length > 0 && (
              <p className="text-sm text-content-tertiary">Select a courier from the list above</p>
            )}
          </div>

          <Input
            label="Tracking Number"
            placeholder="e.g. 1234567890"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
            autoCapitalize="characters"
            autoComplete="off"
          />

          {error && <p className="text-base font-bold text-error">{error}</p>}

          <Button fullWidth size="lg" loading={saving} disabled={!canSubmit} onClick={save}>
            Save Tracking Info
          </Button>
        </div>
      </Modal>
    </section>
  );
}
