"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart";

export function CartIcon() {
  const { itemCount, hydrated } = useCart();

  return (
    <Link
      href="/cart"
      className="relative p-2 text-gray-500 hover:text-gray-900 transition-colors"
      aria-label="Carrito"
    >
      <ShoppingCart className="h-5 w-5" />
      {hydrated && itemCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </Link>
  );
}
