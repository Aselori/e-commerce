"use server";

import { createAdminClient, createServerSupabaseClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@/types";
import { ORDER_STATUSES } from "@/lib/orders";
import {
  notifyCustomerQuoteReady,
  notifyCustomerAwaitingPayment,
  notifyCustomerPaymentConfirmed,
  notifyCustomerShipped,
  notifyCustomerReadyForPickup,
  notifyCustomerDelivered,
  notifyCustomerCancelled,
} from "@/lib/email";

async function assertAdmin() {
  const session = await createServerSupabaseClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) throw new Error("No autorizado.");
  const { data: profile } = await session
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") throw new Error("No autorizado.");
}

async function loadOrderWithEmail(orderId: string) {
  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, delivery_method, shipping_cost, total, user_id"
    )
    .eq("id", orderId)
    .maybeSingle();
  if (!order) throw new Error("Pedido no encontrado.");

  const { data: authData } = await supabase.auth.admin.getUserById(order.user_id);
  return { supabase, order, customerEmail: authData?.user?.email ?? null };
}

function revalidate(orderId: string) {
  revalidatePath("/admin-orders");
  revalidatePath(`/admin-orders/${orderId}`);
  revalidatePath("/orders");
}

export type AdminActionResult = { ok: true } | { error: string };

export async function sendQuote(
  orderId: string,
  shippingCost: number
): Promise<AdminActionResult> {
  await assertAdmin();
  if (!Number.isFinite(shippingCost) || shippingCost < 0) {
    return { error: "El costo de envío debe ser un número válido." };
  }

  const { supabase, order, customerEmail } = await loadOrderWithEmail(orderId);
  if (order.status !== "pending_review") {
    return { error: "Este pedido no está en revisión." };
  }
  if (order.delivery_method !== "shipping") {
    return { error: "Solo aplica a pedidos con envío." };
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("quantity, unit_price")
    .eq("order_id", order.id);
  const subtotal = (items ?? []).reduce(
    (n, r) => n + Number(r.unit_price) * Number(r.quantity),
    0
  );
  const total = subtotal + shippingCost;

  const { error } = await supabase
    .from("orders")
    .update({
      status: "quote_sent",
      shipping_cost: shippingCost,
      quote_amount: total,
      quote_sent_at: new Date().toISOString(),
      total,
    })
    .eq("id", order.id);
  if (error) return { error: error.message };

  await notifyCustomerQuoteReady({
    to: customerEmail,
    orderNumber: order.order_number,
    shippingCost,
    total,
  });

  revalidate(orderId);
  return { ok: true };
}

export async function confirmAvailability(orderId: string): Promise<AdminActionResult> {
  await assertAdmin();
  const { supabase, order, customerEmail } = await loadOrderWithEmail(orderId);
  if (order.status !== "pending_review" || order.delivery_method !== "pickup") {
    return { error: "Solo aplica a pedidos de recolección en revisión." };
  }

  const { error } = await supabase
    .from("orders")
    .update({ status: "awaiting_payment" })
    .eq("id", order.id);
  if (error) return { error: error.message };

  await notifyCustomerAwaitingPayment({
    to: customerEmail,
    orderNumber: order.order_number,
    total: Number(order.total) || 0,
  });

  revalidate(orderId);
  return { ok: true };
}

export async function approveReceipt(orderId: string): Promise<AdminActionResult> {
  await assertAdmin();
  const { supabase, order, customerEmail } = await loadOrderWithEmail(orderId);

  await supabase
    .from("payment_receipts")
    .update({ reviewed: true })
    .eq("order_id", orderId);
  const { error } = await supabase
    .from("orders")
    .update({ status: "confirmed" })
    .eq("id", orderId);
  if (error) return { error: error.message };

  await notifyCustomerPaymentConfirmed({
    to: customerEmail,
    orderNumber: order.order_number,
  });

  revalidate(orderId);
  return { ok: true };
}

export async function rejectReceipt(orderId: string): Promise<AdminActionResult> {
  await assertAdmin();
  const supabase = createAdminClient();
  await supabase.from("payment_receipts").delete().eq("order_id", orderId);
  const { error } = await supabase
    .from("orders")
    .update({ status: "awaiting_payment" })
    .eq("id", orderId);
  if (error) return { error: error.message };
  revalidate(orderId);
  return { ok: true };
}

export async function markShipped(orderId: string): Promise<AdminActionResult> {
  await assertAdmin();
  const { supabase, order, customerEmail } = await loadOrderWithEmail(orderId);
  if (order.status !== "confirmed" || order.delivery_method !== "shipping") {
    return { error: "Solo aplica a pedidos confirmados con envío." };
  }
  const { error } = await supabase
    .from("orders")
    .update({ status: "shipped" })
    .eq("id", orderId);
  if (error) return { error: error.message };

  await notifyCustomerShipped({
    to: customerEmail,
    orderNumber: order.order_number,
  });
  revalidate(orderId);
  return { ok: true };
}

export async function markReadyForPickup(orderId: string): Promise<AdminActionResult> {
  await assertAdmin();
  const { supabase, order, customerEmail } = await loadOrderWithEmail(orderId);
  if (order.status !== "confirmed" || order.delivery_method !== "pickup") {
    return { error: "Solo aplica a pedidos confirmados de recolección." };
  }
  const { error } = await supabase
    .from("orders")
    .update({ status: "ready_for_pickup" })
    .eq("id", orderId);
  if (error) return { error: error.message };

  await notifyCustomerReadyForPickup({
    to: customerEmail,
    orderNumber: order.order_number,
  });
  revalidate(orderId);
  return { ok: true };
}

export async function markDelivered(orderId: string): Promise<AdminActionResult> {
  await assertAdmin();
  const { supabase, order, customerEmail } = await loadOrderWithEmail(orderId);
  if (!["shipped", "ready_for_pickup"].includes(order.status)) {
    return { error: "El pedido no está listo para marcarse entregado." };
  }
  const { error } = await supabase
    .from("orders")
    .update({ status: "delivered" })
    .eq("id", orderId);
  if (error) return { error: error.message };

  await notifyCustomerDelivered({
    to: customerEmail,
    orderNumber: order.order_number,
  });
  revalidate(orderId);
  return { ok: true };
}

export async function cancelByAdmin(orderId: string): Promise<AdminActionResult> {
  await assertAdmin();
  const { supabase, order, customerEmail } = await loadOrderWithEmail(orderId);
  if (["delivered", "cancelled"].includes(order.status)) {
    return { error: "Este pedido ya no se puede cancelar." };
  }
  const { error } = await supabase
    .from("orders")
    .update({
      status: "cancelled",
      decision_at: new Date().toISOString(),
    })
    .eq("id", orderId);
  if (error) return { error: error.message };

  await notifyCustomerCancelled({
    to: customerEmail,
    orderNumber: order.order_number,
    reason: "Cancelado por el administrador.",
  });
  revalidate(orderId);
  return { ok: true };
}

export async function updateStatus(orderId: string, newStatus: OrderStatus) {
  await assertAdmin();
  if (!ORDER_STATUSES.includes(newStatus)) throw new Error("Estado inválido.");
  const supabase = createAdminClient();
  await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
  revalidate(orderId);
}
