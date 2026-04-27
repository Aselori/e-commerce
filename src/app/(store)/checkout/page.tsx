import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { CheckoutForm } from "./CheckoutForm";

export default async function CheckoutPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/checkout");
  }

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Finalizar compra</h1>
      <CheckoutForm />
    </div>
  );
}
