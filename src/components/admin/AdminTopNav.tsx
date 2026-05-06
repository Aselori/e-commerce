"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/store/UserMenu";

const navLinks = [
  { href: "/products", label: "Inventario" },
  { href: "/admin-orders", label: "Pedidos" },
];

export function AdminTopNav({ userEmail }: { userEmail: string | null }) {
  const pathname = usePathname();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center gap-8">
        <Link href="/products" className="font-bold text-gray-900 text-lg shrink-0">
          FimeTienda
        </Link>

        <nav className="flex items-center gap-6">
          {navLinks.map(({ href, label }) => {
            const active = pathname.startsWith(href);
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

        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 text-gray-500 hover:text-gray-900 transition-colors"
            aria-label="Ir a la tienda"
          >
            <Home className="h-4 w-4" />
          </Link>
          <UserMenu email={userEmail} role="admin" />
        </div>
      </div>
    </header>
  );
}
