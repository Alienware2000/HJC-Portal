"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const createEventSchema = z.object({
  year: z
    .number()
    .int("Year must be a whole number")
    .min(2024, "Year is too far in the past")
    .max(2100, "Year is too far in the future"),
  name: z.string().trim().min(1, "Name is required").max(200),
});

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return { user, admin };
}

export async function createEvent(input: { year: number; name: string }) {
  const parsed = createEventSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  let admin;
  try {
    ({ admin } = await requireAdmin());
  } catch {
    return { error: "Unauthorized" };
  }

  const { year, name } = parsed.data;

  // Deactivate any current active event so the one-active invariant holds.
  // This is a separate statement; if the second insert fails, we accept the
  // brief window where no event is active (which is fine — the failure is
  // surfaced to the caller and they retry).
  const { error: deactivateError } = await admin
    .from("events")
    .update({ is_active: false })
    .eq("is_active", true);

  if (deactivateError) {
    return { error: `Failed to deactivate current event: ${deactivateError.message}` };
  }

  const { data, error } = await admin
    .from("events")
    .insert({ year, name, is_active: true })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      // unique violation on year — re-activate the existing row instead.
      const { data: existing, error: reactivateError } = await admin
        .from("events")
        .update({ is_active: true, name })
        .eq("year", year)
        .select()
        .single();
      if (reactivateError || !existing) {
        return { error: `An event for ${year} already exists but could not be activated.` };
      }
      revalidatePath("/admin");
      revalidatePath("/admin/imports");
      return { data: existing };
    }
    return { error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/imports");
  return { data };
}
