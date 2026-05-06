export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button-variants";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";
import { AdminSearchBar } from "@/components/admin/AdminSearchBar";
import { cn } from "@/lib/utils";
import { Pencil, Plus, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types";

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(price);
}

function formatValue(value: number) {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${value.toFixed(0)}`;
}

function StatusBadge({ product }: { product: Product }) {
  if (!product.active) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
        <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
        Archivado
      </span>
    );
  }
  if (product.stock === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-50 px-2.5 py-1 rounded-full">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Sin existencias
      </span>
    );
  }
  if (product.stock <= 5) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-50 px-2.5 py-1 rounded-full">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Stock bajo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      En stock
    </span>
  );
}

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

type StockFilter = "all" | "in_stock" | "low_stock";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; stock?: string }>;
}) {
  const { search, stock } = await searchParams;
  const stockFilter = (stock === "in_stock" || stock === "low_stock" ? stock : "all") as StockFilter;
  const supabase = createAdminClient();

  const { data: allProducts } = await supabase
    .from("products")
    .select("*, category:categories(name)")
    .order("created_at", { ascending: false })
    .returns<Product[]>();

  const baseProducts = allProducts ?? [];

  const totalSKU = baseProducts.length;
  const activeListings = baseProducts.filter((p) => p.active).length;
  const outOfStock = baseProducts.filter((p) => p.stock === 0).length;
  const inventoryValue = baseProducts.reduce((sum, p) => {
    if (p.active && p.price != null) return sum + p.price * p.stock;
    return sum;
  }, 0);

  let products = baseProducts;

  if (search) {
    const term = normalize(search);
    products = products.filter((p) => normalize(p.name).includes(term));
  }

  if (stockFilter === "in_stock") {
    products = products.filter((p) => p.active && p.stock > 5);
  } else if (stockFilter === "low_stock") {
    products = products.filter((p) => p.active && p.stock > 0 && p.stock <= 5);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-red-600 mb-2 flex items-center gap-2">
            <span className="h-px w-6 bg-red-600 inline-block" />
            Portal de administración
          </p>
          <h1 className="text-3xl font-bold text-gray-900">Panel de control</h1>
          <p className="text-sm text-gray-500 mt-1.5">
            Monitorea tu inventario técnico y gestiona el catálogo de productos.
          </p>
        </div>
        <Link
          href="/products/new"
          className={cn(
            buttonVariants(),
            "bg-red-600 hover:bg-red-700 text-white border-0 gap-2 shrink-0"
          )}
        >
          <Plus className="h-4 w-4" />
          Agregar producto
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white shadow-sm rounded-sm p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Total SKU</p>
          <p className="text-3xl font-bold text-gray-900">{totalSKU.toLocaleString()}</p>
        </div>
        <div className="bg-white shadow-sm rounded-sm p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Activos</p>
          <p className="text-3xl font-bold text-gray-900">{activeListings.toLocaleString()}</p>
        </div>
        <div className="bg-white shadow-sm rounded-sm p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Sin existencias</p>
          <p className="text-3xl font-bold text-red-600">{outOfStock}</p>
        </div>
        <div className="bg-white shadow-sm rounded-sm p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Valor del inventario</p>
          <p className="text-3xl font-bold text-amber-600">{formatValue(inventoryValue)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm rounded-sm overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-4 py-2.5 bg-white">
          <div className="w-64">
            <Suspense fallback={null}>
              <AdminSearchBar placeholder="Buscar producto..." />
            </Suspense>
          </div>
          <div className="flex gap-1">
            {([
              { key: "all", label: "Todos" },
              { key: "in_stock", label: "En stock" },
              { key: "low_stock", label: "Stock bajo" },
            ] as const).map(({ key, label }) => {
              const params = new URLSearchParams();
              if (key !== "all") params.set("stock", key);
              if (search) params.set("search", search);
              const href = params.toString() ? `/products?${params}` : "/products";
              return (
                <Link
                  key={key}
                  href={href}
                  className={cn(
                    "px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-colors",
                    stockFilter === key
                      ? "bg-gray-900 text-white"
                      : "text-gray-500 hover:text-gray-900"
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-gray-200 hover:bg-transparent bg-gray-50">
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-gray-400 w-16">
                Imagen
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Producto
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Categoría
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Precio
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Estado
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length > 0 ? (
              products.map((product) => {
                const imageUrl = product.images?.[0] ?? null;
                return (
                  <TableRow
                    key={product.id}
                    className="border-gray-100 hover:bg-gray-50"
                  >
                    {/* Thumbnail */}
                    <TableCell>
                      <div className="h-10 w-10 bg-gray-100 rounded overflow-hidden relative shrink-0">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={product.name}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                            <Package className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Name + SKU */}
                    <TableCell>
                      <p className="font-medium text-sm text-gray-900 line-clamp-1">
                        {product.name}
                      </p>
                      <p className="text-[10px] font-mono text-gray-400 mt-0.5 uppercase">
                        SKU-{product.id.slice(0, 8).toUpperCase()}
                      </p>
                    </TableCell>

                    {/* Category */}
                    <TableCell>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        {product.category?.name ?? (
                          <span className="text-gray-300 italic normal-case font-normal tracking-normal">—</span>
                        )}
                      </span>
                    </TableCell>

                    {/* Price */}
                    <TableCell className="text-sm font-medium text-gray-900">
                      {product.price != null
                        ? formatPrice(product.price)
                        : <span className="text-gray-400">—</span>}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <StatusBadge product={product} />
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/products/${product.id}/edit`}
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "sm" }),
                            "text-gray-400 hover:text-gray-900 hover:bg-gray-100 h-8 w-8 p-0"
                          )}
                          aria-label="Editar producto"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                        <DeleteProductButton id={product.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-gray-400 text-sm">
                  Aún no hay productos.{" "}
                  <Link href="/products/new" className="text-red-500 hover:underline">
                    Agrega el primero
                  </Link>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
