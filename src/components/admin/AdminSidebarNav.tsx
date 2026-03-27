"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Cable,
  Cpu,
  Headphones,
  Zap,
  Monitor,
  Box,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import type { Category } from "@/types";

function getCategoryIcon(name: string): LucideIcon {
  const l = name.toLowerCase();
  if (l.includes("cable") || l.includes("conector")) return Cable;
  if (l.includes("micro") || l.includes("sensor") || l.includes("módulo") || l.includes("modulo"))
    return Cpu;
  if (l.includes("accesorio") || l.includes("kit") || l.includes("educativ")) return Headphones;
  if (l.includes("fuente") || l.includes("alimenta")) return Zap;
  if (l.includes("pantalla") || l.includes("display")) return Monitor;
  return Box;
}

interface AdminSidebarNavProps {
  categories: Category[];
  lowStockCount: number;
}

export function AdminSidebarNav({ categories, lowStockCount }: AdminSidebarNavProps) {
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category");

  return (
    <aside className="hidden md:flex w-52 shrink-0 flex-col bg-gray-50 min-h-0">
      {/* Categories */}
      <div className="p-5 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">
          Inventario técnico
        </p>
        <nav className="flex flex-col gap-0.5">
          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat.name);
            const active = activeCategory === cat.slug;
            return (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-left",
                  active
                    ? "bg-red-600 text-white"
                    : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-gray-400")} />
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* System Alerts */}
      {lowStockCount > 0 && (
        <div className="p-4 border-t border-gray-200">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
            Alertas del sistema
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
            <div className="flex items-center gap-2 mb-1">
              <TriangleAlert className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                Aviso de stock
              </span>
            </div>
            <p className="text-xs text-amber-700 leading-relaxed">
              {lowStockCount} componente{lowStockCount !== 1 ? "s" : ""} por debajo del umbral mínimo.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
