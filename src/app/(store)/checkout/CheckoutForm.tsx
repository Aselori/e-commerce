"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart, formatMXN } from "@/lib/cart";
import { placeOrder, type PlaceOrderState } from "./actions";

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 placeholder:text-gray-400 bg-white";

export function CheckoutForm() {
  const { items, subtotal, hydrated, clear } = useCart();
  const [state, formAction, pending] = useActionState<PlaceOrderState, FormData>(
    placeOrder,
    null
  );
  const [method, setMethod] = useState<"shipping" | "pickup">("shipping");
  const [address, setAddress] = useState({
    street: "",
    interior: "",
    municipality: "",
    city: "",
    state: "",
    postalCode: "",
  });
  const router = useRouter();

  useEffect(() => {
    if (hydrated && items.length === 0 && !pending && !state) {
      router.replace("/cart");
    }
  }, [hydrated, items.length, pending, state, router]);

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      clear();
    }
  }, [state, clear]);

  const addressComplete =
    address.street.trim() &&
    address.municipality.trim() &&
    address.state.trim() &&
    address.postalCode.trim();

  const disabled =
    pending ||
    items.length === 0 ||
    (method === "shipping" && !addressComplete);

  if (!hydrated) {
    return <div className="h-40 bg-gray-100 rounded animate-pulse" />;
  }

  return (
    <form action={formAction} className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(
          items.map(({ productId, quantity }) => ({ productId, quantity }))
        )}
      />

      <div className="space-y-8">
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-4">
            Método de entrega
          </h2>
          <div className="space-y-2">
            <label className="flex items-start gap-3 p-3 border border-gray-200 rounded cursor-pointer hover:border-gray-400">
              <input
                type="radio"
                name="delivery_method"
                value="shipping"
                checked={method === "shipping"}
                onChange={() => setMethod("shipping")}
                className="mt-1"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">Envío a domicilio</p>
                <p className="text-xs text-gray-500">
                  El costo de envío te será cotizado por el vendedor después de
                  recibir tu pedido.
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 p-3 border border-gray-200 rounded cursor-pointer hover:border-gray-400">
              <input
                type="radio"
                name="delivery_method"
                value="pickup"
                checked={method === "pickup"}
                onChange={() => setMethod("pickup")}
                className="mt-1"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">Recoger en sucursal</p>
                <p className="text-xs text-gray-500">Sin costo de envío.</p>
              </div>
            </label>
          </div>
        </section>

        {method === "shipping" && (
          <section className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900">
              Dirección de envío
            </h2>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Calle y número</label>
              <input
                name="street"
                value={address.street}
                onChange={(e) => setAddress({ ...address, street: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Municipio</label>
                <input
                  name="municipality"
                  value={address.municipality}
                  onChange={(e) =>
                    setAddress({ ...address, municipality: e.target.value })
                  }
                  placeholder="Monterrey, Guadalupe, etc."
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Colonia / ciudad</label>
                <input
                  name="city"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Estado</label>
                <input
                  name="state"
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  placeholder="Nuevo León"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Código postal</label>
                <input
                  name="postal_code"
                  value={address.postalCode}
                  onChange={(e) =>
                    setAddress({ ...address, postalCode: e.target.value })
                  }
                  inputMode="numeric"
                  pattern="[0-9]{5}"
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Interior, departamento o referencia (opcional)
              </label>
              <input
                name="interior"
                value={address.interior}
                onChange={(e) =>
                  setAddress({ ...address, interior: e.target.value })
                }
                className={inputClass}
              />
            </div>
          </section>
        )}

        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-4">
            Notas (opcional)
          </h2>
          <textarea
            name="notes"
            rows={3}
            placeholder="Instrucciones para el vendedor"
            className={inputClass}
          />
        </section>
      </div>

      <aside className="bg-white rounded-lg shadow-sm p-6 h-fit">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-4">
          Resumen
        </h2>
        <ul className="divide-y divide-gray-100 mb-4">
          {items.map((item) => (
            <li key={item.productId} className="py-2 flex justify-between gap-2 text-sm">
              <span className="flex-1 min-w-0 truncate text-gray-700">
                {item.name} × {item.quantity}
              </span>
              <span className="text-gray-900 font-medium">
                {formatMXN(item.price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="space-y-1 text-sm border-t border-gray-200 pt-3">
          <div className="flex justify-between text-gray-700">
            <span>Subtotal</span>
            <span>{formatMXN(subtotal)}</span>
          </div>
          {method === "shipping" && (
            <div className="flex justify-between text-gray-500 text-xs">
              <span>Envío</span>
              <span>Por cotizar</span>
            </div>
          )}
          <div className="flex justify-between text-gray-900 font-bold text-base pt-2">
            <span>{method === "shipping" ? "Subtotal" : "Total"}</span>
            <span>{formatMXN(subtotal)}</span>
          </div>
        </div>

        {state && "error" in state && (
          <p className="mt-4 text-sm text-red-600">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={disabled}
          className="mt-6 w-full py-3 text-xs font-bold uppercase tracking-wider bg-gray-900 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
        >
          {pending ? "Procesando..." : "Confirmar pedido"}
        </button>
        <Link
          href="/cart"
          className="block w-full text-center mt-3 text-xs text-gray-500 hover:text-gray-900"
        >
          Volver al carrito
        </Link>
      </aside>
    </form>
  );
}
