"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptQuote, switchToPickup, cancelOrder } from "../actions";

type Props = {
  orderNumber: string;
  status: string;
  deliveryMethod: "shipping" | "pickup";
};

const btnPrimary =
  "px-4 py-2 text-xs font-bold uppercase tracking-wider bg-gray-900 text-white hover:bg-red-600 transition-colors disabled:opacity-50";
const btnSecondary =
  "px-4 py-2 text-xs font-bold uppercase tracking-wider border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50";
const btnDanger =
  "px-4 py-2 text-xs font-bold uppercase tracking-wider border border-red-300 text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50";

export function OrderActions({ orderNumber, status, deliveryMethod }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<"pickup" | "cancel" | null>(null);

  const run = (fn: () => Promise<{ ok: true } | { error: string }>) => {
    startTransition(async () => {
      setError(null);
      const r = await fn();
      if ("error" in r) setError(r.error);
      else {
        setConfirm(null);
        router.refresh();
      }
    });
  };

  const cancellable = ["pending_review", "quote_sent", "awaiting_payment"].includes(status);
  const canSwitchToPickup =
    deliveryMethod === "shipping" && ["pending_review", "quote_sent"].includes(status);

  return (
    <div className="space-y-3">
      {status === "quote_sent" && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => acceptQuote(orderNumber))}
            className={btnPrimary}
          >
            Aceptar cotización
          </button>
          {canSwitchToPickup && (
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirm("pickup")}
              className={btnSecondary}
            >
              Cambiar a recoger en sucursal
            </button>
          )}
        </div>
      )}

      {cancellable && (
        <div>
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirm("cancel")}
            className={btnDanger}
          >
            Cancelar pedido
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {confirm === "pickup" && (
        <div className="rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 space-y-3">
          <p className="font-bold">¿Cambiar a recoger en sucursal?</p>
          <p>
            Esta acción es <strong>irreversible</strong>. Perderás la cotización de
            envío y deberás recoger tu pedido en la sucursal. Pasarás directamente
            a esperar el pago.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => switchToPickup(orderNumber))}
              className={btnPrimary}
            >
              Sí, cambiar a recoger
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirm(null)}
              className={btnSecondary}
            >
              Volver
            </button>
          </div>
        </div>
      )}

      {confirm === "cancel" && (
        <div className="rounded border border-red-300 bg-red-50 p-4 text-sm text-red-900 space-y-3">
          <p className="font-bold">¿Cancelar este pedido?</p>
          <p>Esta acción no se puede deshacer.</p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => cancelOrder(orderNumber))}
              className={btnDanger}
            >
              Sí, cancelar
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirm(null)}
              className={btnSecondary}
            >
              Volver
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
