"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, Package } from "lucide-react";
import { useCart, formatMXN } from "@/lib/cart";

export default function CartPage() {
  const { items, subtotal, setQuantity, remove, hydrated } = useCart();

  if (!hydrated) {
    return (
      <div className="max-w-screen-xl mx-auto px-6 py-12">
        <div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-screen-xl mx-auto px-6 py-20 flex flex-col items-center text-center gap-4">
        <Package className="h-16 w-16 text-gray-300" />
        <h1 className="text-2xl font-bold text-gray-900">Tu carrito está vacío</h1>
        <p className="text-gray-500">
          Agrega productos desde el catálogo para continuar.
        </p>
        <Link
          href="/"
          className="mt-2 px-5 py-2 text-xs font-bold uppercase tracking-wider border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-colors"
        >
          Ir al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tu carrito</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <ul className="divide-y divide-gray-200 bg-white rounded-lg shadow-sm">
          {items.map((item) => (
            <li key={item.productId} className="p-4 flex gap-4">
              <div className="relative w-20 h-20 bg-gray-100 rounded shrink-0 overflow-hidden">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                    <Package className="h-8 w-8" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                  REF. {item.productId.slice(0, 8).toUpperCase()}
                </p>
                <p className="text-sm font-bold text-gray-900 line-clamp-2">
                  {item.name}
                </p>
                <p className="text-sm text-gray-700">{formatMXN(item.price)}</p>
              </div>

              <div className="flex flex-col items-end justify-between">
                <button
                  type="button"
                  onClick={() => remove(item.productId)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                  aria-label="Eliminar del carrito"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <div className="flex items-center border border-gray-300 rounded text-gray-900">
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity(item.productId, item.quantity - 1)
                    }
                    className="p-1.5 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    aria-label="Disminuir cantidad"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="px-3 text-sm font-medium w-8 text-center text-gray-900">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity(item.productId, item.quantity + 1)
                    }
                    className="p-1.5 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    aria-label="Aumentar cantidad"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                <p className="text-sm font-bold text-gray-900">
                  {formatMXN(item.price * item.quantity)}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <aside className="bg-white rounded-lg shadow-sm p-6 h-fit">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-4">
            Resumen
          </h2>
          <div className="flex items-center justify-between text-sm text-gray-700 mb-2">
            <span>Subtotal</span>
            <span>{formatMXN(subtotal)}</span>
          </div>
          <p className="text-xs text-gray-400 mb-4">
            El envío se calcula en el siguiente paso.
          </p>
          <Link
            href="/checkout"
            className="block w-full text-center py-3 text-xs font-bold uppercase tracking-wider bg-gray-900 text-white hover:bg-red-600 transition-colors"
          >
            Proceder al pago
          </Link>
          <Link
            href="/"
            className="block w-full text-center mt-3 text-xs text-gray-500 hover:text-gray-900"
          >
            Seguir comprando
          </Link>
        </aside>
      </div>
    </div>
  );
}
