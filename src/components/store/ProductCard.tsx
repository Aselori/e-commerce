import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";
import type { Product } from "@/types";

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(price);
}

export function ProductCard({ product }: { product: Product }) {
  const imageUrl = product.images?.[0] ?? null;
  const outOfStock = product.stock === 0;

  return (
    <div className="group flex flex-col bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Image */}
      <Link href={`/products/${product.id}`} className="block relative">
        <div className="aspect-square bg-gray-100 relative overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-300">
              <Package className="h-16 w-16" />
            </div>
          )}

          {/* Type badge */}
          {product.type === "kit" && (
            <div className="absolute top-2 left-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-amber-900 px-2 py-0.5">
                Kit técnico
              </span>
            </div>
          )}

          {outOfStock && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="text-xs font-bold uppercase tracking-wider text-red-600 border border-red-300 bg-white px-3 py-1">
                Sin existencias
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex flex-col gap-2.5 p-4 flex-1">
        {/* REF + Price row */}
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
            REF. {product.id.slice(0, 8).toUpperCase()}
          </span>
          <span className="font-bold text-gray-900 text-base shrink-0">
            {product.price != null
              ? formatPrice(product.price)
              : <span className="text-sm font-normal text-gray-400">Consultar</span>}
          </span>
        </div>

        {/* Name */}
        <Link href={`/products/${product.id}`}>
          <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-red-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Description */}
        {product.description && (
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        )}

        {/* CTA */}
        <button
          disabled={outOfStock}
          className="mt-auto w-full py-2 text-xs font-bold uppercase tracking-wider border border-gray-900 text-gray-900 bg-white hover:bg-gray-900 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {outOfStock ? "Sin existencias" : "Agregar al carrito"}
        </button>
      </div>
    </div>
  );
}
