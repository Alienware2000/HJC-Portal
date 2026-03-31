"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SYNTHETIC_EMAIL_DOMAIN } from "@/lib/constants";
import {
  createTeamMemberSchema,
  updateRoleSchema,
  resetPasswordSchema,
  changeOwnPasswordSchema,
} from "@/lib/validations/team";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function getTeamMembers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .in("role", ["admin", "staff"])
    .order("created_at", { ascending: false });

  if (error) return { data: [] };
  return { data: data || [] };
}

export async function createTeamMember(input: {
  email: string;
  password: string;
  fullName: string;
  role: "admin" | "staff";
}) {
  const parsed = createTeamMemberSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  await requireAdmin();
  const { email, password, fullName, role } = parsed.data;

  if (email.endsWith(`@${SYNTHETIC_EMAIL_DOMAIN}`)) {
    return { error: "This email domain is reserved for board member accounts." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role, full_name: fullName },
  });

  if (error) {
    if (error.message?.includes("already been registered")) {
      return { error: "A user with this email already exists." };
    }
    return { error: error.message };
  }

  revalidatePath("/admin/team");
  return { data: data.user };
}

export async function updateTeamMemberRole(input: {
  userId: string;
  newRole: "admin" | "staff";
}) {
  const parsed = updateRoleSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const caller = await requireAdmin();
  const { userId, newRole } = parsed.data;

  const admin = createAdminClient();

  // If demoting an admin, check they're not the last one
  if (newRole === "staff") {
    const { count } = await admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");

    if ((count ?? 0) <= 1) {
      return { error: "Cannot demote the last admin account." };
    }
  }

  // Update auth metadata
  const { error: authError } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: { role: newRole },
  });
  if (authError) return { error: authError.message };

  // Update profiles table (used by JWT hook)
  const { error: profileError } = await admin
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);

  if (profileError) {
    // Rollback auth metadata
    const currentRole = newRole === "admin" ? "staff" : "admin";
    await admin.auth.admin.updateUserById(userId, {
      user_metadata: { role: currentRole },
    });
    return { error: profileError.message };
  }

  revalidatePath("/admin/team");
  return { success: true };
}

export async function deleteTeamMember(userId: string) {
  const caller = await requireAdmin();

  if (caller.id === userId) {
    return { error: "You cannot delete your own account." };
  }

  const admin = createAdminClient();

  // If deleting an admin, check they're not the last one
  const { data: target } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (!target) return { error: "User not found." };

  if (target.role === "admin") {
    const { count } = await admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");

    if ((count ?? 0) <= 1) {
      return { error: "Cannot delete the last admin account." };
    }
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };

  revalidatePath("/admin/team");
  return { success: true };
}

export async function resetTeamMemberPassword(input: {
  userId: string;
  newPassword: string;
}) {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  await requireAdmin();
  const { userId, newPassword } = parsed.data;

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function changeOwnPassword(input: {
  newPassword: string;
  confirmPassword: string;
}) {
  const parsed = changeOwnPasswordSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });

  if (error) return { error: error.message };
  return { success: true };
}
