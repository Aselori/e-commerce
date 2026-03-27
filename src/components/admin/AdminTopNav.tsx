"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, User, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/products", label: "Panel" },
  { href: "/products", label: "Inventario" },
  { href: "/orders", label: "Pedidos" },
];

export function AdminTopNav() {
  const pathname = usePathname();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center gap-8">
        {/* Brand */}
        <Link href="/products" className="font-bold text-gray-900 text-lg shrink-0">
          FimeTienda
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-6">
          {navLinks.map(({ href, label }) => {
            const active = pathname === href && label === "Dashboard";
            return (
              <Link
                key={label}
                href={href}
                className={cn(
                  "text-sm font-medium pb-0.5 transition-colors",
                  active
                    ? "text-red-600 border-b-2 border-red-600"
                    : "text-gray-600 hover:text-gray-900 border-b-2 border-transparent"
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-3">
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              placeholder="Búsqueda global..."
              className="pl-8 pr-4 h-8 text-xs border border-gray-200 rounded bg-gray-50 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 w-52"
            />
          </div>
          <button className="p-1.5 text-gray-500 hover:text-gray-900 transition-colors" aria-label="Carrito">
            <ShoppingCart className="h-4.5 w-4.5" />
          </button>
          <button className="p-1.5 text-gray-500 hover:text-gray-900 transition-colors" aria-label="Cuenta">
            <User className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
