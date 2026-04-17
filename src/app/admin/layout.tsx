import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase";
import { AdminTopNav } from "@/components/admin/AdminTopNav";
import { AdminSidebarNav } from "@/components/admin/AdminSidebarNav";
import type { Category } from "@/types";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createAdminClient();

  const [{ data: categories }, { count: lowStockCount }] = await Promise.all([
    supabase.from("categories").select("*").order("name").returns<Category[]>(),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .lte("stock", 5)
      .gt("stock", 0)
      .eq("active", true),
  ]);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
      <AdminTopNav />

      <div className="flex flex-1 min-h-0 max-w-screen-xl w-full mx-auto">
        <Suspense fallback={<aside className="hidden md:block w-52 shrink-0 bg-gray-50" />}>
          <AdminSidebarNav
            categories={categories ?? []}
            lowStockCount={lowStockCount ?? 0}
          />
        </Suspense>

        <main className="flex-1 min-w-0 p-8 bg-white">{children}</main>
      </div>
    </div>
  );
}
