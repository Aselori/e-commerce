"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";
import type { Product } from "@/types";

export function AddToCartButton({ product }: { product: Product }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const outOfStock = product.stock === 0;
  const noPrice = product.price == null;
  const disabled = outOfStock || noPrice;

  const handleAdd = () => {
    if (disabled || product.price == null) return;
    add({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] ?? null,
      type: product.type,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  };

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={disabled}
      className="mt-auto w-full py-2 text-xs font-bold uppercase tracking-wider border border-gray-900 text-gray-900 bg-white hover:bg-gray-900 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {outOfStock
        ? "Sin existencias"
        : noPrice
          ? "Consultar precio"
          : added
            ? "Agregado ✓"
            : "Agregar al carrito"}
    </button>
  );
}
