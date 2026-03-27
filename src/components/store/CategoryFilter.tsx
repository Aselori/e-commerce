"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";
import {
  Cable,
  Cpu,
  Headphones,
  Zap,
  Monitor,
  Box,
  type LucideIcon,
} from "lucide-react";

function getCategoryIcon(name: string): LucideIcon {
  const l = name.toLowerCase();
  if (l.includes("cable") || l.includes("conector")) return Cable;
  if (
    l.includes("micro") ||
    l.includes("sensor") ||
    l.includes("módulo") ||
    l.includes("modulo") ||
    l.includes("component")
  )
    return Cpu;
  if (l.includes("accesorio") || l.includes("kit") || l.includes("educativ"))
    return Headphones;
  if (l.includes("fuente") || l.includes("alimenta")) return Zap;
  if (l.includes("pantalla") || l.includes("display")) return Monitor;
  return Box;
}

interface CategoryFilterProps {
  categories: Category[];
  activeSlug: string | null;
}

export function CategoryFilter({ categories, activeSlug }: CategoryFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const inStockOnly = searchParams.get("inStock") === "1";

  function handleCategory(slug: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug && slug !== activeSlug) {
      params.set("category", slug);
    } else {
      params.delete("category");
    }
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  }

  function handleInStock(checked: boolean) {
    const params = new URLSearchParams(searchParams.toString());
    if (checked) params.set("inStock", "1");
    else params.delete("inStock");
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  }

  return (
    <div className="space-y-8">
      {/* Categories */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">
          Categorías
        </p>
        <p className="text-xs text-gray-400 mb-4">Inventario técnico</p>
        <nav className="flex flex-col gap-0.5">
          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat.name);
            const active = activeSlug === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategory(cat.slug)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors w-full text-left",
                  active
                    ? "bg-red-50 text-red-600"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon
                  className={cn("h-4 w-4 shrink-0", active ? "text-red-500" : "text-gray-400")}
                />
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  {cat.name}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Filtering */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">
          Filtros
        </p>
        <p className="text-xs text-gray-400 mb-4">Disponibilidad</p>
        <label className="flex items-center gap-2.5 cursor-pointer text-sm text-gray-700 hover:text-gray-900">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => handleInStock(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-gray-300 accent-red-600 cursor-pointer"
          />
          En stock
        </label>
      </div>
    </div>
  );
}
