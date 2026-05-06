import { createServerSupabaseClient } from "@/lib/supabase";
import { AdminTopNav } from "@/components/admin/AdminTopNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const sessionClient = await createServerSupabaseClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
      <AdminTopNav userEmail={user?.email ?? null} />

      <div className="flex flex-1 min-h-0 max-w-screen-xl w-full mx-auto">
        <main className="flex-1 min-w-0 p-8 bg-white">{children}</main>
      </div>
    </div>
  );
}
