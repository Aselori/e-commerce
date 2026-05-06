import { Suspense } from "react";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase";
import { formatMXN } from "@/lib/format";
import {
  ORDER_STATUSES,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
} from "@/lib/orders";
import { AdminSearchBar } from "@/components/admin/AdminSearchBar";
import type { OrderStatus } from "@/types";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const { status, search } = await searchParams;
  const supabase = createAdminClient();

  const validStatus = ORDER_STATUSES.find((s) => s === status) as
    | OrderStatus
    | undefined;

  let query = supabase
    .from("orders")
    .select("id, order_number, status, delivery_method, total, created_at, user_id")
    .order("created_at", { ascending: false });
  if (validStatus) query = query.eq("status", validStatus);
  if (search) {
    const escaped = search.replace(/[\\%_]/g, (c) => `\\${c}`);
    query = query.ilike("order_number", `%${escaped}%`);
  }

  const { data: orders } = await query;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
        <p className="text-sm text-gray-500">
          Gestión de pedidos de clientes y revisión de comprobantes.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={search ? `/admin-orders?search=${search}` : "/admin-orders"}
          className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${!validStatus ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
        >
          Todas
        </Link>
        {ORDER_STATUSES.map((s) => {
          const params = new URLSearchParams();
          params.set("status", s);
          if (search) params.set("search", search);
          return (
            <Link
              key={s}
              href={`/admin-orders?${params}`}
              className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${validStatus === s ? "bg-gray-900 text-white" : `${ORDER_STATUS_COLORS[s]} hover:opacity-80`}`}
            >
              {ORDER_STATUS_LABELS[s]}
            </Link>
          );
        })}
      </div>

      <div className="max-w-sm">
        <Suspense fallback={null}>
          <AdminSearchBar paramName="search" placeholder="Buscar por número de pedido..." />
        </Suspense>
      </div>

      {(!orders || orders.length === 0) ? (
        <div className="bg-white border border-gray-200 rounded-lg p-10 text-center text-gray-500">
          No hay pedidos para este filtro.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr className="text-xs uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">Pedido</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Entrega</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin-orders/${o.order_number}`}
                      className="font-mono text-xs text-gray-900 hover:text-red-600"
                    >
                      {o.order_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {new Date(o.created_at).toLocaleString("es-MX")}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {o.delivery_method === "shipping" ? "Envío" : "Recolección"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${ORDER_STATUS_COLORS[o.status as OrderStatus]}`}
                    >
                      {ORDER_STATUS_LABELS[o.status as OrderStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">
                    {formatMXN(o.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
