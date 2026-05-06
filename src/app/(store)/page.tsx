import { Suspense } from "react";
import { createServerSupabaseClient } from "@/lib/supabase";
import { CategoryFilter } from "@/components/store/CategoryFilter";
import { ProductCard } from "@/components/store/ProductCard";
import type { Category, Product } from "@/types";

export default async function StorePage(props: PageProps<"/">) {
  const params = await props.searchParams;
  const category = Array.isArray(params.category) ? params.category[0] : params.category;
  const search = Array.isArray(params.search) ? params.search[0] : params.search;
  const inStock = params.inStock === "1";

  const supabase = await createServerSupabaseClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name")
    .returns<Category[]>();

  const matchedCategory = categories?.find((c) => c.slug === category) ?? null;

  let query = supabase
    .from("products")
    .select("*, category:categories(*)")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (matchedCategory) query = query.eq("category_id", matchedCategory.id);
  if (inStock) query = query.gt("stock", 0);

  const { data: allProducts } = await query.returns<Product[]>();

  const normalize = (s: string) =>
    s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  const products = search
    ? (allProducts ?? []).filter((p) => normalize(p.name).includes(normalize(search)))
    : (allProducts ?? []);
  const total = products.length;

  return (
    <div className="max-w-screen-xl mx-auto w-full px-6 py-8 flex gap-10">
      {/* Sidebar */}
      <aside className="hidden md:block w-44 shrink-0">
        <Suspense fallback={<div className="h-64 animate-pulse bg-gray-100 rounded" />}>
          <CategoryFilter
            categories={categories ?? []}
            activeSlug={category ?? null}
          />
        </Suspense>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        {/* Section header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
              Inventario del sistema
            </p>
            <h1 className="text-3xl font-bold text-gray-900">Catálogo de productos</h1>
          </div>
          <p className="text-xs text-gray-400 pb-1">
            Mostrando {total} artículo{total !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Grid */}
        {total > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Load more — visual placeholder */}
            <div className="flex justify-center mt-12">
              <button className="px-8 py-3 text-xs font-bold uppercase tracking-widest border border-gray-300 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors">
                Cargar más
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="text-gray-500 text-lg font-medium">No se encontraron productos</p>
            <p className="text-gray-400 text-sm mt-1">
              Intenta ajustar tus filtros o términos de búsqueda
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
