import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase";
import { formatMXN } from "@/lib/format";
import {
  ORDER_STATUS_COLORS,
  statusLabelFor,
} from "@/lib/orders";
import { ReceiptUpload } from "./ReceiptUpload";
import { OrderActions } from "./OrderActions";
import type { BillingInfo, DeliveryMethod, OrderStatus } from "@/types";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/orders/${orderNumber}`);

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, delivery_method, shipping_address, postal_code, shipping_cost, total, notes, billing_required, billing_info, quote_amount, quote_sent_at, decision_at, created_at"
    )
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (!order) notFound();

  const status = order.status as OrderStatus;
  const method = order.delivery_method as DeliveryMethod;

  const { data: items } = await supabase
    .from("order_items")
    .select("id, quantity, unit_price, product:products(name, images)")
    .eq("order_id", order.id);

  const { data: receipt } = await supabase
    .from("payment_receipts")
    .select("id, uploaded_at, reviewed")
    .eq("order_id", order.id)
    .maybeSingle();

  const subtotal = (items ?? []).reduce(
    (n, it) => n + it.unit_price * it.quantity,
    0
  );

  const billing = order.billing_info as BillingInfo | null;

  const showReceiptUpload = status === "awaiting_payment" && !receipt;

  return (
    <div className="max-w-screen-lg mx-auto px-6 py-10 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Link href="/orders" className="text-xs text-gray-500 hover:text-gray-900">
            ← Mis pedidos
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            Pedido {order.order_number}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Creado el {new Date(order.created_at).toLocaleString("es-MX")}
          </p>
        </div>
        <span
          className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${ORDER_STATUS_COLORS[status]}`}
        >
          {statusLabelFor(status, method)}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-4">
            Productos
          </h2>
          <ul className="divide-y divide-gray-100">
            {(items ?? []).map((it) => {
              const product = Array.isArray(it.product) ? it.product[0] : it.product;
              return (
                <li key={it.id} className="py-3 flex justify-between gap-2 text-sm">
                  <span className="flex-1 min-w-0 truncate text-gray-700">
                    {product?.name ?? "Producto"} × {it.quantity}
                  </span>
                  <span className="text-gray-900 font-medium">
                    {formatMXN(it.unit_price * it.quantity)}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-gray-200 mt-4 pt-4 space-y-1 text-sm">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal</span>
              <span>{formatMXN(subtotal)}</span>
            </div>
            {method === "shipping" && (
              <div className="flex justify-between text-gray-700">
                <span>Envío</span>
                <span>
                  {order.shipping_cost == null
                    ? "Por cotizar"
                    : formatMXN(order.shipping_cost)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-gray-900 font-bold text-base pt-1">
              <span>Total</span>
              <span>{formatMXN(order.total)}</span>
            </div>
          </div>

          {method === "shipping" && order.shipping_address && (
            <div className="mt-6 text-sm">
              <p className="font-bold text-gray-900 mb-1">Dirección de envío</p>
              <p className="text-gray-700">
                {(order.shipping_address as Record<string, string>).street},{" "}
                {(order.shipping_address as Record<string, string>).city},{" "}
                {(order.shipping_address as Record<string, string>).state},{" "}
                CP {order.postal_code}
              </p>
            </div>
          )}
          {method === "pickup" && (
            <div className="mt-6 text-sm">
              <p className="font-bold text-gray-900 mb-1">Entrega</p>
              <p className="text-gray-700">Recoger en sucursal.</p>
            </div>
          )}

          {order.billing_required && billing && (
            <div className="mt-6 text-sm">
              <p className="font-bold text-gray-900 mb-1">Datos de facturación</p>
              <div className="text-gray-700 space-y-0.5">
                <p>{billing.razon_social}</p>
                <p>RFC: {billing.rfc}</p>
                <p>
                  Régimen: {billing.regimen_fiscal} · Uso CFDI: {billing.uso_cfdi}
                </p>
                <p>{billing.email}</p>
              </div>
            </div>
          )}

          {order.notes && (
            <div className="mt-6 text-sm">
              <p className="font-bold text-gray-900 mb-1">Notas</p>
              <p className="text-gray-700">{order.notes}</p>
            </div>
          )}
        </section>

        <aside className="bg-white rounded-lg shadow-sm p-6 h-fit space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900">
            Estado
          </h2>

          {status === "pending_review" && (
            <p className="text-sm text-gray-700">
              {method === "shipping"
                ? "Estamos preparando tu cotización de envío. Te avisaremos por correo cuando esté lista."
                : "Estamos confirmando la disponibilidad de tu pedido. Te avisaremos por correo cuando esté listo para pagar."}
            </p>
          )}

          {status === "quote_sent" && (
            <div className="text-sm text-gray-700 space-y-2">
              <p>Tu cotización está lista.</p>
              {order.shipping_cost != null && (
                <p>
                  Costo de envío: <strong>{formatMXN(order.shipping_cost)}</strong>
                </p>
              )}
              <p>
                Total a pagar: <strong>{formatMXN(order.total)}</strong>
              </p>
            </div>
          )}

          {status === "awaiting_payment" && (
            <div className="text-sm text-gray-700 space-y-3">
              <p>
                Realiza tu transferencia por{" "}
                <strong>{formatMXN(order.total)}</strong> y sube el comprobante.
              </p>
              <div className="text-xs text-gray-500 bg-gray-50 rounded p-3 space-y-1">
                <p>
                  <span className="font-bold text-gray-700">Banco:</span> (pendiente
                  de configurar)
                </p>
                <p>
                  <span className="font-bold text-gray-700">CLABE:</span> (pendiente)
                </p>
                <p>
                  <span className="font-bold text-gray-700">Concepto:</span>{" "}
                  {order.order_number}
                </p>
              </div>
            </div>
          )}

          {status === "payment_review" && (
            <p className="text-sm text-gray-700">
              Recibimos tu comprobante. Lo estamos revisando.
            </p>
          )}

          {status === "confirmed" && (
            <p className="text-sm text-gray-700">
              Tu pago fue confirmado. Te avisaremos cuando tu pedido esté{" "}
              {method === "shipping" ? "en camino" : "listo para recoger"}.
            </p>
          )}

          {status === "shipped" && (
            <p className="text-sm text-gray-700">Tu pedido va en camino.</p>
          )}

          {status === "ready_for_pickup" && (
            <p className="text-sm text-gray-700">
              Tu pedido está listo. Pasa a recogerlo en sucursal.
            </p>
          )}

          {status === "delivered" && (
            <p className="text-sm text-gray-700">
              Pedido entregado. ¡Gracias por tu compra!
            </p>
          )}

          {status === "cancelled" && (
            <p className="text-sm text-gray-700">
              Este pedido fue cancelado.
            </p>
          )}

          {receipt && status !== "awaiting_payment" && (
            <p className="text-xs text-gray-500">
              Comprobante subido el{" "}
              {new Date(receipt.uploaded_at).toLocaleString("es-MX")}.
            </p>
          )}

          {showReceiptUpload && (
            <ReceiptUpload orderNumber={order.order_number} userId={user.id} />
          )}

          <OrderActions
            orderNumber={order.order_number}
            status={status}
            deliveryMethod={method}
          />
        </aside>
      </div>
    </div>
  );
}
