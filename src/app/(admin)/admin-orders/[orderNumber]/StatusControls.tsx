"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@/types";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/orders";
import {
  approveReceipt,
  rejectReceipt,
  updateStatus,
} from "../actions";

type Props = {
  orderId: string;
  currentStatus: OrderStatus;
  hasReceipt: boolean;
  receiptReviewed: boolean;
};

export function StatusControls({
  orderId,
  currentStatus,
  hasReceipt,
  receiptReviewed,
}: Props) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const onApprove = () =>
    startTransition(async () => {
      await approveReceipt(orderId);
      router.refresh();
    });

  const onReject = () =>
    startTransition(async () => {
      await rejectReceipt(orderId);
      router.refresh();
    });

  const onChangeStatus = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as OrderStatus;
    if (next === currentStatus) return;
    startTransition(async () => {
      await updateStatus(orderId, next);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {hasReceipt && !receiptReviewed && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onApprove}
            disabled={pending}
            className="flex-1 py-2 text-xs font-bold uppercase tracking-wider bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            Aprobar comprobante
          </button>
          <button
            type="button"
            onClick={onReject}
            disabled={pending}
            className="flex-1 py-2 text-xs font-bold uppercase tracking-wider border border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
          >
            Rechazar
          </button>
        </div>
      )}

      <div>
        <label className="block text-xs text-gray-600 mb-1 font-bold uppercase tracking-wider">
          Cambiar estado
        </label>
        <select
          value={currentStatus}
          onChange={onChangeStatus}
          disabled={pending}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm disabled:opacity-50"
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
