import { createServerSupabaseClient } from "@/lib/supabase";
import { Package, ShoppingCart, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Product } from "@/types";

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(price);
}

export default async function ProductDetailPage(
  props: PageProps<"/products/[id]">
) {
  const { id } = await props.params;
  const supabase = await createServerSupabaseClient();

  const { data: product } = await supabase
    .from("products")
    .select("*, category:categories(*)")
    .eq("id", id)
    .eq("active", true)
    .single<Product>();

  if (!product) notFound();

  const images = product.images ?? [];
  const mainImage = images[0] ?? null;
  const outOfStock = product.stock === 0;
  const lowStock = !outOfStock && product.stock <= 5;

  const specRows = [
    product.category ? { label: "Categoría", value: product.category.name } : null,
    { label: "Tipo", value: product.type === "kit" ? "Kit técnico" : "Unidad individual" },
    {
      label: "Disponibilidad",
      value: outOfStock ? "Sin existencias" : lowStock ? `Stock bajo (${product.stock} restantes)` : "En stock",
    },
    { label: "Stock", value: `${product.stock} unidades` },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-8">
        <Link href="/" className="hover:text-gray-600 transition-colors">
          Inventario técnico
        </Link>
        {product.category && (
          <>
            <span>/</span>
            <Link href={`/?category=${product.category.slug}`} className="hover:text-gray-600 transition-colors">
              {product.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-gray-600">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Left — Images */}
        <div className="space-y-3">
          {/* Main image */}
          <div className="aspect-square bg-gray-100 relative overflow-hidden rounded-sm">
            {product.type === "kit" && (
              <div className="absolute top-4 left-4 z-10">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-amber-900 px-2 py-1">
                  Kit técnico
                </span>
              </div>
            )}
            {mainImage ? (
              <Image
                src={mainImage}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                <Package className="h-24 w-24" />
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.slice(0, 4).map((img, i) => (
                <div
                  key={i}
                  className={`aspect-square bg-gray-100 relative overflow-hidden rounded-sm border-2 transition-colors ${
                    i === 0 ? "border-gray-900" : "border-transparent hover:border-gray-400"
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} — view ${i + 1}`}
                    fill
                    sizes="15vw"
                    className="object-cover"
                  />
                </div>
              ))}
              {images.length > 4 && (
                <div className="aspect-square bg-gray-100 flex items-center justify-center rounded-sm border border-gray-200 text-xs text-gray-400 font-medium">
                  +{images.length - 4} más
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right — Product info */}
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">
              {product.name}
            </h1>
            <p className="text-xs text-gray-400 mt-2 font-mono uppercase">
              SKU: {product.id}
            </p>
          </div>

          {product.description && (
            <p className="text-sm text-gray-600 leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Price box */}
          <div className="bg-gray-50 border border-gray-200 rounded-sm p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                Precio
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {product.price != null
                  ? formatPrice(product.price)
                  : <span className="text-lg font-normal text-gray-400">Consultar precio</span>}
              </p>
            </div>
            {!outOfStock && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-amber-900 px-3 py-1.5">
                Listo para enviar
              </span>
            )}
          </div>

          {/* Configuration — kits only */}
          {product.type === "kit" && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                Configuración
              </p>
              <div className="flex gap-2">
                <button className="flex-1 py-2.5 text-xs font-bold uppercase tracking-wider bg-gray-900 text-white border border-gray-900">
                  Kit completo
                </button>
                <button className="flex-1 py-2.5 text-xs font-bold uppercase tracking-wider bg-white text-gray-700 border border-gray-300 hover:border-gray-900 transition-colors">
                  Unidad individual
                </button>
              </div>
            </div>
          )}

          {/* CTAs */}
          <div className="flex gap-3">
            <button
              disabled={outOfStock}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold uppercase tracking-wider bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="h-4 w-4" />
              {outOfStock ? "Sin existencias" : "Agregar al carrito"}
            </button>
            <button className="px-4 py-3 border border-gray-300 text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-colors">
              <Heart className="h-4 w-4" />
            </button>
          </div>

          {/* Technical Specifications */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">
              Especificaciones técnicas
            </p>
            <div className="divide-y divide-gray-100">
              {specRows.map(({ label, value }) => (
                <div key={label} className="flex justify-between py-3 text-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {label}
                  </span>
                  <span className="text-gray-900 font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
