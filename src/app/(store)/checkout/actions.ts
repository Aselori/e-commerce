"use server";

import { createServerSupabaseClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { notifyAdminNewOrder, notifyCustomerOrderReceived } from "@/lib/email";
import type { BillingInfo } from "@/types";

type CheckoutItemInput = {
  productId: string;
  quantity: number;
};

export type PlaceOrderState =
  | { error: string }
  | { ok: true; orderNumber: string }
  | null;

function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `FT-${ts}-${rand}`;
}

function parseItems(raw: FormDataEntryValue | null): CheckoutItemInput[] {
  if (typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((x) => ({
        productId: typeof x?.productId === "string" ? x.productId : "",
        quantity: Number.isFinite(x?.quantity) ? Math.max(1, Math.floor(x.quantity)) : 0,
      }))
      .filter((x) => x.productId && x.quantity > 0);
  } catch {
    return [];
  }
}

function str(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function placeOrder(
  _prev: PlaceOrderState,
  formData: FormData
): Promise<PlaceOrderState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Debes iniciar sesión para continuar." };

  const items = parseItems(formData.get("items"));
  if (items.length === 0) return { error: "Tu carrito está vacío." };

  const deliveryMethod = formData.get("delivery_method");
  if (deliveryMethod !== "shipping" && deliveryMethod !== "pickup") {
    return { error: "Selecciona un método de entrega." };
  }

  const notes = str(formData, "notes") || null;

  const billingRequired = formData.get("billing_required") === "on";
  let billingInfo: BillingInfo | null = null;
  if (billingRequired) {
    const rfc = str(formData, "rfc").toUpperCase();
    const razon_social = str(formData, "razon_social");
    const regimen_fiscal = str(formData, "regimen_fiscal");
    const uso_cfdi = str(formData, "uso_cfdi");
    const email = str(formData, "billing_email");
    if (!rfc || !razon_social || !regimen_fiscal || !uso_cfdi || !email) {
      return { error: "Completa los datos de facturación." };
    }
    billingInfo = { rfc, razon_social, regimen_fiscal, uso_cfdi, email };
  }

  let shippingAddress: Record<string, unknown> | null = null;
  let postalCode: string | null = null;

  if (deliveryMethod === "shipping") {
    const street = str(formData, "street");
    const municipality = str(formData, "municipality");
    const city = str(formData, "city");
    const state = str(formData, "state");
    const pc = str(formData, "postal_code");
    const interior = str(formData, "interior");

    if (!street || !municipality || !state || !pc) {
      return { error: "Completa la dirección de envío." };
    }

    shippingAddress = {
      street,
      city: city || municipality,
      municipality,
      state,
      postal_code: pc,
      country: "MX",
      interior: interior || null,
    };
    postalCode = pc;
  }

  const { data: products, error: pErr } = await supabase
    .from("products")
    .select("id, name, price, stock, active")
    .in(
      "id",
      items.map((i) => i.productId)
    );

  if (pErr) return { error: pErr.message };
  if (!products || products.length !== items.length) {
    return { error: "Algunos productos ya no están disponibles." };
  }

  const priceMap = new Map(products.map((p) => [p.id, p]));
  let subtotal = 0;
  for (const it of items) {
    const p = priceMap.get(it.productId);
    if (!p || !p.active) return { error: `${p?.name ?? "Un producto"} ya no está disponible.` };
    if (p.price == null) return { error: `El precio de ${p.name} no está definido.` };
    if (p.stock < it.quantity) return { error: `No hay suficiente existencia de ${p.name}.` };
    subtotal += p.price * it.quantity;
  }

  const orderNumber = generateOrderNumber();

  const { data: order, error: oErr } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      user_id: user.id,
      status: "pending_review",
      delivery_method: deliveryMethod,
      shipping_address: shippingAddress,
      postal_code: postalCode,
      shipping_cost: null,
      total: subtotal,
      notes,
      billing_required: billingRequired,
      billing_info: billingInfo,
    })
    .select("id")
    .single();

  if (oErr || !order) return { error: oErr?.message ?? "No se pudo crear el pedido." };

  const rows = items.map((it) => {
    const p = priceMap.get(it.productId)!;
    return {
      order_id: order.id,
      product_id: it.productId,
      quantity: it.quantity,
      unit_price: p.price!,
    };
  });

  const { error: iErr } = await supabase.from("order_items").insert(rows);
  if (iErr) {
    await supabase.from("orders").delete().eq("id", order.id);
    return { error: iErr.message };
  }

  await notifyAdminNewOrder({
    orderNumber,
    customerEmail: user.email ?? null,
    deliveryMethod,
    subtotal,
    billingRequired,
  });
  await notifyCustomerOrderReceived({
    to: user.email ?? null,
    orderNumber,
    deliveryMethod,
  });

  revalidatePath("/orders");
  return { ok: true as const, orderNumber };
}
