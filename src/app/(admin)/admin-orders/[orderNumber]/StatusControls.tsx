"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus, DeliveryMethod } from "@/types";
import {
  approveReceipt,
  rejectReceipt,
  sendQuote,
  confirmAvailability,
  markShipped,
  markReadyForPickup,
  markDelivered,
  cancelByAdmin,
} from "../actions";

type Props = {
  orderId: string;
  currentStatus: OrderStatus;
  deliveryMethod: DeliveryMethod;
  hasReceipt: boolean;
  receiptReviewed: boolean;
};

const btnPrimary =
  "px-4 py-2 text-xs font-bold uppercase tracking-wider bg-gray-900 text-white hover:bg-red-600 transition-colors disabled:opacity-50";
const btnApprove =
  "px-4 py-2 text-xs font-bold uppercase tracking-wider bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50";
const btnDanger =
  "px-4 py-2 text-xs font-bold uppercase tracking-wider border border-red-300 text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50";
const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 bg-white";

export function StatusControls({
  orderId,
  currentStatus,
  deliveryMethod,
  hasReceipt,
  receiptReviewed,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [shippingCost, setShippingCost] = useState("");

  const run = (fn: () => Promise<{ ok: true } | { error: string }>) => {
    startTransition(async () => {
      setError(null);
      const r = await fn();
      if ("error" in r) setError(r.error);
      else router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {currentStatus === "pending_review" && deliveryMethod === "shipping" && (
        <div className="space-y-2">
          <label className="block text-xs text-gray-600 font-bold uppercase tracking-wider">
            Costo de envío (MXN)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={shippingCost}
            onChange={(e) => setShippingCost(e.target.value)}
            placeholder="0.00"
            className={inputClass}
          />
          <button
            type="button"
            disabled={pending || shippingCost === ""}
            onClick={() => run(() => sendQuote(orderId, parseFloat(shippingCost)))}
            className={`${btnPrimary} w-full`}
          >
            Enviar cotización
          </button>
        </div>
      )}

      {currentStatus === "pending_review" && deliveryMethod === "pickup" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => confirmAvailability(orderId))}
          className={`${btnPrimary} w-full`}
        >
          Confirmar disponibilidad
        </button>
      )}

      {currentStatus === "quote_sent" && (
        <p className="text-sm text-gray-700">
          Esperando que el cliente acepte la cotización o cambie a recolección.
        </p>
      )}

      {currentStatus === "awaiting_payment" && !hasReceipt && (
        <p className="text-sm text-gray-700">
          Esperando que el cliente suba el comprobante de pago.
        </p>
      )}

      {currentStatus === "payment_review" && hasReceipt && !receiptReviewed && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => run(() => approveReceipt(orderId))}
            disabled={pending}
            className={`${btnApprove} flex-1`}
          >
            Aprobar comprobante
          </button>
          <button
            type="button"
            onClick={() => run(() => rejectReceipt(orderId))}
            disabled={pending}
            className={`${btnDanger} flex-1`}
          >
            Rechazar
          </button>
        </div>
      )}

      {currentStatus === "confirmed" && deliveryMethod === "shipping" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => markShipped(orderId))}
          className={`${btnPrimary} w-full`}
        >
          Marcar como enviado
        </button>
      )}

      {currentStatus === "confirmed" && deliveryMethod === "pickup" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => markReadyForPickup(orderId))}
          className={`${btnPrimary} w-full`}
        >
          Marcar como listo para recoger
        </button>
      )}

      {(currentStatus === "shipped" || currentStatus === "ready_for_pickup") && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => markDelivered(orderId))}
          className={`${btnPrimary} w-full`}
        >
          Marcar como entregado
        </button>
      )}

      {!["delivered", "cancelled"].includes(currentStatus) && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm("¿Cancelar este pedido?")) run(() => cancelByAdmin(orderId));
          }}
          className={`${btnDanger} w-full`}
        >
          Cancelar pedido
        </button>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
