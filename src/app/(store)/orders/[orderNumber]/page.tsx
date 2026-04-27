import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase";
import { formatMXN } from "@/lib/format";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@/lib/orders";
import { ReceiptUpload } from "./ReceiptUpload";
import type { OrderStatus } from "@/types";

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
    .select("id, order_number, status, delivery_method, shipping_address, postal_code, shipping_cost, total, notes, created_at")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (!order) notFound();

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

  return (
    <div className="max-w-screen-lg mx-auto px-6 py-10 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Link href="/orders" className="text-xs text-gray-500 hover:text-gray-900">
            ← Mis pedidos
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            Orden {order.order_number}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Creada el {new Date(order.created_at).toLocaleString("es-MX")}
          </p>
        </div>
        <span
          className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${ORDER_STATUS_COLORS[order.status as OrderStatus]}`}
        >
          {ORDER_STATUS_LABELS[order.status as OrderStatus]}
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
            <div className="flex justify-between text-gray-700">
              <span>Envío</span>
              <span>{formatMXN(order.shipping_cost ?? 0)}</span>
            </div>
            <div className="flex justify-between text-gray-900 font-bold text-base pt-1">
              <span>Total</span>
              <span>{formatMXN(order.total)}</span>
            </div>
          </div>

          {order.delivery_method === "shipping" && order.shipping_address && (
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
          {order.delivery_method === "pickup" && (
            <div className="mt-6 text-sm">
              <p className="font-bold text-gray-900 mb-1">Entrega</p>
              <p className="text-gray-700">Recoger en sucursal.</p>
            </div>
          )}

          {order.notes && (
            <div className="mt-6 text-sm">
              <p className="font-bold text-gray-900 mb-1">Notas</p>
              <p className="text-gray-700">{order.notes}</p>
            </div>
          )}
        </section>

        <aside className="bg-white rounded-lg shadow-sm p-6 h-fit">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-4">
            Pago
          </h2>
          {order.status === "pending" && !receipt && (
            <>
              <p className="text-sm text-gray-700 mb-3">
                Realiza el depósito o transferencia por{" "}
                <strong>{formatMXN(order.total)}</strong> a la cuenta del negocio
                y sube el comprobante para que lo revisemos.
              </p>
              <div className="text-xs text-gray-500 bg-gray-50 rounded p-3 mb-4 space-y-1">
                <p>
                  <span className="font-bold text-gray-700">Banco:</span> {/* TODO */}
                  (pendiente de configurar)
                </p>
                <p>
                  <span className="font-bold text-gray-700">CLABE:</span> (pendiente)
                </p>
                <p>
                  <span className="font-bold text-gray-700">Concepto:</span>{" "}
                  {order.order_number}
                </p>
              </div>
              <ReceiptUpload orderNumber={order.order_number} userId={user.id} />
            </>
          )}
          {receipt && (
            <div className="text-sm text-gray-700 space-y-2">
              <p>
                Comprobante recibido el{" "}
                {new Date(receipt.uploaded_at).toLocaleString("es-MX")}.
              </p>
              <p className="text-xs text-gray-500">
                {receipt.reviewed
                  ? "Revisado por el administrador."
                  : "En espera de revisión."}
              </p>
            </div>
          )}
          {!receipt && order.status !== "pending" && (
            <p className="text-sm text-gray-500">
              Esta orden ya no admite nuevos comprobantes.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
