import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import type { Role } from "@/lib/constants";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const role = (user.user_metadata?.role as Role) || "board_member";
  const userName = user.user_metadata?.full_name as string | null;
  const userEmail = user.email || null;

  // Fetch active event for header display
  const { data: event } = await supabase
    .from("events")
    .select("name")
    .eq("is_active", true)
    .single();

  return (
    <div className="min-h-svh bg-[#f4f5f7]">
      <Sidebar role={role} userName={userName} userEmail={userEmail} />
      <div className="lg:pl-[240px]">
        <Header role={role} eventName={event?.name || null} />
        <main className="px-4 sm:px-5 lg:px-8 py-6 pb-[max(1.5rem,var(--safe-bottom))] max-w-5xl">
          {children}
        </main>
      </div>
    </div>
  );
}
