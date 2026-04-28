"use server";

import { createServerSupabaseClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import {
  notifyAdminReceipt,
  notifyCustomerCancelled,
} from "@/lib/email";
import { isCancellable } from "@/lib/orders";
import type { OrderStatus } from "@/types";

export type ActionResult = { ok: true } | { error: string };

type LoadedOrder = {
  ok: true;
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
  user: { id: string; email?: string | undefined };
  order: {
    id: string;
    user_id: string;
    status: string;
    total: number;
    delivery_method: string;
    quote_amount: number | null;
    shipping_cost: number | null;
  };
};

async function loadOrderForUser(
  orderNumber: string
): Promise<LoadedOrder | { ok: false; error: string }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión expirada." };

  const { data: order, error } = await supabase
    .from("orders")
    .select("id, user_id, status, total, delivery_method, quote_amount, shipping_cost")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (error || !order) return { ok: false, error: "Orden no encontrada." };
  if (order.user_id !== user.id) return { ok: false, error: "No autorizado." };

  return { ok: true, supabase, user, order };
}

export async function submitReceipt(
  orderNumber: string,
  storagePath: string
): Promise<ActionResult> {
  const ctx = await loadOrderForUser(orderNumber);
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, order } = ctx;

  if (order.status !== "awaiting_payment") {
    return { error: "Esta orden no está en espera de comprobante." };
  }

  const { error: rErr } = await supabase.from("payment_receipts").insert({
    order_id: order.id,
    image_url: storagePath,
    reviewed: false,
  });
  if (rErr) return { error: rErr.message };

  const { error: uErr } = await supabase
    .from("orders")
    .update({ status: "payment_review" })
    .eq("id", order.id);
  if (uErr) return { error: uErr.message };

  await notifyAdminReceipt({
    orderNumber,
    customerEmail: user.email ?? null,
    total: Number(order.total) || 0,
    uploadedAt: new Date(),
  });

  revalidatePath(`/orders/${orderNumber}`);
  revalidatePath("/orders");
  return { ok: true };
}

export async function acceptQuote(orderNumber: string): Promise<ActionResult> {
  const ctx = await loadOrderForUser(orderNumber);
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, order } = ctx;

  if (order.status !== "quote_sent") {
    return { error: "Esta orden no tiene cotización pendiente." };
  }

  const { error } = await supabase
    .from("orders")
    .update({
      status: "awaiting_payment",
      decision_at: new Date().toISOString(),
    })
    .eq("id", order.id);
  if (error) return { error: error.message };

  revalidatePath(`/orders/${orderNumber}`);
  revalidatePath("/orders");
  return { ok: true };
}

export async function switchToPickup(orderNumber: string): Promise<ActionResult> {
  const ctx = await loadOrderForUser(orderNumber);
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, order } = ctx;

  if (order.delivery_method !== "shipping") {
    return { error: "Solo aplica a pedidos con envío." };
  }
  const allowed: OrderStatus[] = ["pending_review", "quote_sent"];
  if (!allowed.includes(order.status as OrderStatus)) {
    return { error: "Ya no es posible cambiar el método de entrega." };
  }

  const subtotalQuery = await supabase
    .from("order_items")
    .select("quantity, unit_price")
    .eq("order_id", order.id);
  const subtotal = (subtotalQuery.data ?? []).reduce(
    (n, r) => n + Number(r.unit_price) * Number(r.quantity),
    0
  );

  const { error } = await supabase
    .from("orders")
    .update({
      delivery_method: "pickup",
      shipping_address: null,
      postal_code: null,
      shipping_cost: null,
      quote_amount: null,
      quote_sent_at: null,
      total: subtotal,
      status: "awaiting_payment",
      decision_at: new Date().toISOString(),
    })
    .eq("id", order.id);
  if (error) return { error: error.message };

  revalidatePath(`/orders/${orderNumber}`);
  revalidatePath("/orders");
  return { ok: true };
}

export async function cancelOrder(orderNumber: string): Promise<ActionResult> {
  const ctx = await loadOrderForUser(orderNumber);
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, order } = ctx;

  if (!isCancellable(order.status as OrderStatus)) {
    return { error: "Esta orden ya no se puede cancelar." };
  }

  const { error } = await supabase
    .from("orders")
    .update({
      status: "cancelled",
      decision_at: new Date().toISOString(),
    })
    .eq("id", order.id);
  if (error) return { error: error.message };

  await notifyCustomerCancelled({
    to: user.email ?? null,
    orderNumber,
    reason: "Cancelado por el cliente.",
  });

  revalidatePath(`/orders/${orderNumber}`);
  revalidatePath("/orders");
  return { ok: true };
}
