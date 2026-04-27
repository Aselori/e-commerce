"use server";

import { createAdminClient, createServerSupabaseClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@/types";
import { ORDER_STATUSES } from "@/lib/orders";

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

export async function approveReceipt(orderId: string) {
  await assertAdmin();
  const supabase = createAdminClient();
  await supabase
    .from("payment_receipts")
    .update({ reviewed: true })
    .eq("order_id", orderId);
  await supabase
    .from("orders")
    .update({ status: "confirmed" })
    .eq("id", orderId);
  revalidatePath("/admin-orders");
  revalidatePath(`/admin-orders/${orderId}`);
}

export async function rejectReceipt(orderId: string) {
  await assertAdmin();
  const supabase = createAdminClient();
  await supabase
    .from("payment_receipts")
    .delete()
    .eq("order_id", orderId);
  await supabase
    .from("orders")
    .update({ status: "pending" })
    .eq("id", orderId);
  revalidatePath("/admin-orders");
  revalidatePath(`/admin-orders/${orderId}`);
}

export async function updateStatus(orderId: string, newStatus: OrderStatus) {
  await assertAdmin();
  if (!ORDER_STATUSES.includes(newStatus)) throw new Error("Estado inválido.");
  const supabase = createAdminClient();
  await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
  revalidatePath("/admin-orders");
  revalidatePath(`/admin-orders/${orderId}`);
}
