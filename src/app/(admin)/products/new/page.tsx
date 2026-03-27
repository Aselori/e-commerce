import { createAdminClient } from "@/lib/supabase";
import { ProductForm } from "@/components/admin/ProductForm";
import { createProduct } from "@/app/(admin)/products/actions";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Category } from "@/types";

export default async function NewProductPage() {
  const supabase = createAdminClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name")
    .returns<Category[]>();

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
        <h1 className="text-2xl font-bold text-zinc-100">Nuevo producto</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Completa los campos para agregar un producto al catálogo.
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <ProductForm categories={categories ?? []} action={createProduct} />
      </div>
    </div>
  );
}
