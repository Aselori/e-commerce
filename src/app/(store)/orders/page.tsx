import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { formatMXN } from "@/lib/format";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@/lib/orders";
import type { OrderStatus } from "@/types";

export default async function OrdersListPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/orders");

  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, status, total, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-screen-lg mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mis pedidos</h1>

      {(!orders || orders.length === 0) && (
        <div className="bg-white rounded-lg shadow-sm p-10 text-center">
          <p className="text-gray-500 mb-4">Aún no has realizado pedidos.</p>
          <Link
            href="/"
            className="inline-block px-5 py-2 text-xs font-bold uppercase tracking-wider border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-colors"
          >
            Ir al catálogo
          </Link>
        </div>
      )}

      {orders && orders.length > 0 && (
        <ul className="bg-white rounded-lg shadow-sm divide-y divide-gray-100">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/orders/${o.order_number}`}
                className="flex items-center justify-between gap-4 p-4 hover:bg-gray-50"
              >
                <div className="min-w-0">
                  <p className="font-mono text-xs text-gray-400 uppercase tracking-wider">
                    {o.order_number}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    {new Date(o.created_at).toLocaleString("es-MX")}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${ORDER_STATUS_COLORS[o.status as OrderStatus]}`}
                  >
                    {ORDER_STATUS_LABELS[o.status as OrderStatus]}
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatMXN(o.total)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
