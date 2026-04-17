import { Suspense } from "react";
import Link from "next/link";
import { SearchBar } from "@/components/store/SearchBar";
import { ShoppingCart, User } from "lucide-react";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-screen-xl mx-auto px-6 h-16 flex items-center gap-6">
          {/* Brand */}
          <Link href="/" className="font-bold text-lg text-gray-900 shrink-0">
            FimeTienda
          </Link>

          {/* Search — centred */}
          <div className="flex-1 max-w-lg mx-auto">
            <Suspense
              fallback={
                <div className="h-9 w-full rounded-lg bg-gray-100 animate-pulse" />
              }
            >
              <SearchBar />
            </Suspense>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              className="relative p-2 text-gray-500 hover:text-gray-900 transition-colors"
              aria-label="Carrito"
            >
              <ShoppingCart className="h-5 w-5" />
            </button>
            <button
              className="p-2 text-gray-500 hover:text-gray-900 transition-colors"
              aria-label="Cuenta"
            >
              <User className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-white py-8 mt-16">
        <div className="max-w-screen-xl mx-auto px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm">
          <div>
            <p className="font-bold text-gray-900">FimeTienda</p>
            <p className="text-xs text-gray-400 mt-0.5">
              © {new Date().getFullYear()} FimeTienda. Ingeniería de precisión.
            </p>
          </div>
          <nav className="flex flex-wrap gap-5 text-gray-500 text-xs">
            <a href="#" className="hover:text-gray-900 transition-colors">Términos de servicio</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Política de privacidad</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Soporte técnico</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Contacto</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
