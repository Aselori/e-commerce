"use server";

import { createServerSupabaseClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { notifyAdminReceipt } from "@/lib/email";

export type SubmitReceiptResult = { ok: true } | { error: string };

export async function submitReceipt(
  orderNumber: string,
  storagePath: string
): Promise<SubmitReceiptResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada." };

  const { data: order, error: oErr } = await supabase
    .from("orders")
    .select("id, user_id, status, total")
    .eq("order_number", orderNumber)
    .single();

  if (oErr || !order) return { error: "Orden no encontrada." };
  if (order.user_id !== user.id) return { error: "No autorizado." };
  if (order.status !== "pending") {
    return { error: "Esta orden ya no admite nuevos comprobantes." };
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
