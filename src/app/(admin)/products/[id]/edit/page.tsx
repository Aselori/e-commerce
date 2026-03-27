export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase";
import { ProductForm } from "@/components/admin/ProductForm";
import { updateProduct } from "@/app/(admin)/products/actions";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Category, Product } from "@/types";

export default async function EditProductPage(
  props: PageProps<"/products/[id]/edit">
) {
  const { id } = await props.params;
  const supabase = createAdminClient();

  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single<Product>(),
    supabase
      .from("categories")
      .select("*")
      .order("name")
      .returns<Category[]>(),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-100 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a productos
        </Link>
        <h1 className="text-2xl font-bold text-zinc-100">Editar producto</h1>
        <p className="text-sm text-zinc-500 mt-1 line-clamp-1">
          {product.name}
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <ProductForm
          product={product}
          categories={categories ?? []}
          action={updateProduct}
        />
      </div>
    </div>
  );
}
