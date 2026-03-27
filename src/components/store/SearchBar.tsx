"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";

export function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const currentSearch = searchParams.get("search") ?? "";

  function handleSearch(term: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (term) params.set("search", term);
    else params.delete("search");
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="relative w-full">
      {isPending ? (
        <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500 animate-spin" />
      ) : (
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      )}
      <Input
        defaultValue={currentSearch}
        placeholder="Buscar en el inventario..."
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-9 h-9 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus-visible:ring-red-500 rounded-lg"
      />
    </div>
  );
}
