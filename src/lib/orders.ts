import type { DeliveryMethod, OrderStatus } from "@/types";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_review: "Esperando revisión",
  quote_sent: "Cotización lista",
  awaiting_payment: "Esperando comprobante",
  payment_review: "Comprobante en revisión",
  confirmed: "Pago confirmado",
  shipped: "Enviado",
  ready_for_pickup: "Listo para recoger",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending_review: "bg-amber-100 text-amber-800",
  quote_sent: "bg-yellow-100 text-yellow-800",
  awaiting_payment: "bg-amber-100 text-amber-800",
  payment_review: "bg-blue-100 text-blue-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  shipped: "bg-indigo-100 text-indigo-800",
  ready_for_pickup: "bg-indigo-100 text-indigo-800",
  delivered: "bg-gray-200 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

export const ORDER_STATUSES: OrderStatus[] = [
  "pending_review",
  "quote_sent",
  "awaiting_payment",
  "payment_review",
  "confirmed",
  "shipped",
  "ready_for_pickup",
  "delivered",
  "cancelled",
];

export function statusLabelFor(status: OrderStatus, method: DeliveryMethod): string {
  if (status === "pending_review") {
    return method === "shipping" ? "Esperando cotización" : "Esperando confirmación";
  }
  return ORDER_STATUS_LABELS[status];
}

export const CANCELLABLE_STATUSES: OrderStatus[] = [
  "pending_review",
  "quote_sent",
  "awaiting_payment",
];

export function isCancellable(status: OrderStatus): boolean {
  return (CANCELLABLE_STATUSES as string[]).includes(status);
}
