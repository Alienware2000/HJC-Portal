import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLE_DASHBOARDS, type Role } from "@/lib/constants";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const role = (user.user_metadata?.role as Role) || "board_member";
    redirect(ROLE_DASHBOARDS[role]);
  }

  redirect("/login");
}
