import type { OrderStatus } from "@/types";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendiente de pago",
  payment_review: "Comprobante en revisión",
  confirmed: "Confirmada",
  shipped: "Enviada",
  ready_for_pickup: "Lista para recoger",
  delivered: "Entregada",
  cancelled: "Cancelada",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  payment_review: "bg-blue-100 text-blue-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  shipped: "bg-indigo-100 text-indigo-800",
  ready_for_pickup: "bg-indigo-100 text-indigo-800",
  delivered: "bg-gray-200 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "payment_review",
  "confirmed",
  "shipped",
  "ready_for_pickup",
  "delivered",
  "cancelled",
];
