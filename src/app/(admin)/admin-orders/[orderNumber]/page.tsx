import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase";
import { formatMXN } from "@/lib/format";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@/lib/orders";
import { StatusControls } from "./StatusControls";
import type { OrderStatus } from "@/types";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, status, delivery_method, shipping_address, postal_code, shipping_cost, total, notes, created_at, user_id")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (!order) notFound();

  const [{ data: items }, { data: receipt }, { data: authUser }] =
    await Promise.all([
      supabase
        .from("order_items")
        .select("id, quantity, unit_price, product:products(name)")
        .eq("order_id", order.id),
      supabase
        .from("payment_receipts")
        .select("id, image_url, uploaded_at, reviewed")
        .eq("order_id", order.id)
        .maybeSingle(),
      supabase.auth.admin.getUserById(order.user_id),
    ]);

  let signedUrl: string | null = null;
  if (receipt?.image_url) {
    const { data } = await supabase.storage
      .from("receipts")
      .createSignedUrl(receipt.image_url, 60 * 10);
    signedUrl = data?.signedUrl ?? null;
  }

  const subtotal = (items ?? []).reduce(
    (n, it) => n + it.unit_price * it.quantity,
    0
  );
  const customerEmail = authUser?.user?.email ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link href="/admin-orders" className="text-xs text-gray-500 hover:text-gray-900">
            ← Órdenes
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
        <div className="space-y-6">
          <section className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-4">
              Cliente
            </h2>
            <p className="text-sm text-gray-700">
              {customerEmail ?? <span className="text-gray-400">Desconocido</span>}
            </p>
            <p className="text-xs text-gray-400 mt-1 font-mono">{order.user_id}</p>
          </section>

          <section className="bg-white border border-gray-200 rounded-lg p-6">
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
                <p className="font-bold text-gray-900 mb-1">Notas del cliente</p>
                <p className="text-gray-700">{order.notes}</p>
              </div>
            )}
          </section>

          <section className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-4">
              Comprobante de pago
            </h2>
            {!receipt && (
              <p className="text-sm text-gray-500">
                El cliente aún no ha subido un comprobante.
              </p>
            )}
            {receipt && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">
                  Subido el {new Date(receipt.uploaded_at).toLocaleString("es-MX")}
                  {receipt.reviewed && " · revisado"}
                </p>
                {signedUrl ? (
                  receipt.image_url.toLowerCase().endsWith(".pdf") ? (
                    <div className="space-y-2">
                      <iframe
                        src={signedUrl}
                        className="w-full max-w-md h-[480px] bg-gray-100 rounded border border-gray-200"
                        title="Comprobante PDF"
                      />
                      <a
                        href={signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-xs text-gray-700 underline hover:text-red-600"
                      >
                        Abrir PDF en nueva pestaña
                      </a>
                    </div>
                  ) : (
                    <div className="relative w-full max-w-md aspect-[3/4] bg-gray-100 rounded overflow-hidden">
                      <Image
                        src={signedUrl}
                        alt="Comprobante"
                        fill
                        sizes="(max-width: 768px) 100vw, 400px"
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  )
                ) : (
                  <p className="text-sm text-red-600">
                    No se pudo generar la URL firmada.
                  </p>
                )}
              </div>
            )}
          </section>
        </div>

        <aside className="bg-white border border-gray-200 rounded-lg p-6 h-fit">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-4">
            Acciones
          </h2>
          <StatusControls
            orderId={order.id}
            currentStatus={order.status as OrderStatus}
            hasReceipt={!!receipt}
            receiptReviewed={!!receipt?.reviewed}
          />
        </aside>
      </div>
    </div>
  );
}
