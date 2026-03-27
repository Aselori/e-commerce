"use server";

import { createAdminClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ProductFormState = {
  error?: string;
} | null;

function parseProductFormData(formData: FormData) {
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const description = (formData.get("description") as string | null)?.trim() || null;
  const priceRaw = (formData.get("price") as string | null)?.trim();
  const price = priceRaw ? parseFloat(priceRaw) : null;
  const stockRaw = (formData.get("stock") as string | null)?.trim();
  const stock = stockRaw ? parseInt(stockRaw, 10) : 0;
  const category_id = (formData.get("category_id") as string | null)?.trim() || null;
  const type = (formData.get("type") as string | null)?.trim() ?? "";
  const imagesRaw = (formData.get("images") as string | null)?.trim() ?? "";
  const images = imagesRaw
    ? imagesRaw.split("\n").map((s) => s.trim()).filter(Boolean)
    : null;
  const active = formData.get("active") === "on";

  return { name, description, price, stock, category_id, type, images, active };
}

export async function createProduct(
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const data = parseProductFormData(formData);

  if (!data.name) return { error: "El nombre es requerido." };
  if (!data.type || !["individual", "kit"].includes(data.type)) {
    return { error: "El tipo es requerido." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("products").insert(data);

  if (error) return { error: error.message };

  revalidatePath("/products");
  revalidatePath("/");
  redirect("/products");
}

export async function updateProduct(
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const id = (formData.get("id") as string | null)?.trim();
  if (!id) return { error: "ID de producto no encontrado." };

  const data = parseProductFormData(formData);

  if (!data.name) return { error: "El nombre es requerido." };
  if (!data.type || !["individual", "kit"].includes(data.type)) {
    return { error: "El tipo es requerido." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("products").update(data).eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/products");
  revalidatePath("/");
  revalidatePath(`/products/${id}`);
  redirect("/products");
}

export async function deleteProduct(id: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("products").delete().eq("id", id);

  revalidatePath("/products");
  revalidatePath("/");
}
