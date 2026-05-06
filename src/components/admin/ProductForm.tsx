"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { Product, Category } from "@/types";
import type { ProductFormState } from "@/app/(admin)/products/actions";

interface ProductFormProps {
  product?: Product;
  categories: Category[];
  action: (
    prevState: ProductFormState,
    formData: FormData
  ) => Promise<ProductFormState>;
}

export function ProductForm({ product, categories, action }: ProductFormProps) {
  const [state, formAction, isPending] = useActionState(action, null);

  const fieldClass =
    "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus-visible:ring-red-500";

  return (
    <form action={formAction} className="space-y-6 max-w-2xl">
      {/* Hidden id for edit mode */}
      {product && <input type="hidden" name="id" value={product.id} />}

      {/* Error banner */}
      {state?.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {state.error}
        </div>
      )}

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-gray-700">
          Nombre <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={product?.name}
          placeholder="Ej. Arduino Uno R3"
          className={fieldClass}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-gray-700">
          Descripción
        </Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={product?.description ?? ""}
          placeholder="Descripción del producto..."
          className={fieldClass}
        />
      </div>

      {/* Price + Stock row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price" className="text-gray-700">
            Precio (MXN)
          </Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={product?.price ?? ""}
            placeholder="0.00"
            className={fieldClass}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stock" className="text-gray-700">
            Stock <span className="text-red-500">*</span>
          </Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            min="0"
            required
            defaultValue={product?.stock ?? 0}
            className={fieldClass}
          />
        </div>
      </div>

      {/* Category + Type row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-gray-700">Categoría</Label>
          <Select name="category_id" defaultValue={product?.category_id ?? ""}>
            <SelectTrigger className={fieldClass}>
              <SelectValue placeholder="Sin categoría" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200 text-gray-900">
              <SelectItem value="" className="focus:bg-gray-100">
                Sin categoría
              </SelectItem>
              {categories.map((cat) => (
                <SelectItem
                  key={cat.id}
                  value={cat.id}
                  className="focus:bg-gray-100"
                >
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-700">
            Tipo <span className="text-red-500">*</span>
          </Label>
          <Select
            name="type"
            required
            defaultValue={product?.type ?? "individual"}
          >
            <SelectTrigger className={fieldClass}>
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200 text-gray-900">
              <SelectItem value="individual" className="focus:bg-gray-100">
                Individual
              </SelectItem>
              <SelectItem value="kit" className="focus:bg-gray-100">
                Kit
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Images */}
      <div className="space-y-2">
        <Label htmlFor="images" className="text-gray-700">
          Imágenes{" "}
          <span className="text-gray-500 font-normal">(una URL por línea)</span>
        </Label>
        <Textarea
          id="images"
          name="images"
          rows={3}
          defaultValue={product?.images?.join("\n") ?? ""}
          placeholder="https://example.com/imagen1.jpg&#10;https://example.com/imagen2.jpg"
          className={`${fieldClass} font-mono text-xs`}
        />
      </div>

      {/* Active */}
      <div className="flex items-center gap-3">
        <input
          id="active"
          name="active"
          type="checkbox"
          defaultChecked={product?.active ?? true}
          className="h-4 w-4 rounded border-gray-300 bg-white accent-red-500"
        />
        <Label htmlFor="active" className="text-gray-700 cursor-pointer">
          Producto activo (visible en la tienda)
        </Label>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-red-600 hover:bg-red-700 text-white border-0"
        >
          {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {product ? "Guardar cambios" : "Crear producto"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="text-gray-500 hover:text-gray-900"
          onClick={() => history.back()}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
