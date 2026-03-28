"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ROLES,
  ROLE_DASHBOARDS,
  SYNTHETIC_EMAIL_DOMAIN,
  toSyntheticEmail,
  type Role,
} from "@/lib/constants";

export async function loginWithAccessCode(code: string) {
  const normalizedCode = code.trim().toUpperCase();
  const supabase = await createClient();
  const admin = createAdminClient();

  // 1. Verify the access code exists and belongs to an active event
  const { data: accessCode, error: codeError } = await admin
    .from("access_codes")
    .select("*, events!inner(is_active)")
    .eq("code", normalizedCode)
    .single();

  if (codeError || !accessCode) {
    return { error: "Invalid access code. Please check and try again." };
  }

  if (!accessCode.events?.is_active) {
    return { error: "This access code belongs to an inactive event." };
  }

  // 2. Build synthetic email and attempt sign-in
  const syntheticEmail = toSyntheticEmail(normalizedCode);
  const password = normalizedCode; // Code itself serves as password

  // Try to sign in first (returning user)
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: syntheticEmail,
    password,
  });

  if (signInError) {
    // New user — create account and provision records
    const { data: newUser, error: createError } =
      await admin.auth.admin.createUser({
        email: syntheticEmail,
        password,
        email_confirm: true,
        user_metadata: {
          role: ROLES.BOARD_MEMBER,
          full_name: accessCode.board_member_name,
        },
      });

    if (createError || !newUser.user) {
      return { error: "Failed to create account. Please try again." };
    }

    // Provision board_member, party_member (self), and itinerary
    const { data: boardMember, error: bmError } = await admin
      .from("board_members")
      .insert({
        event_id: accessCode.event_id,
        user_id: newUser.user.id,
        access_code_id: accessCode.id,
        name: accessCode.board_member_name,
        email: syntheticEmail,
      })
      .select()
      .single();

    if (bmError || !boardMember) {
      return { error: "Failed to set up your profile. Please contact admin." };
    }

    // Link access code to board member
    const { error: linkError } = await admin
      .from("access_codes")
      .update({ board_member_id: boardMember.id, is_used: true })
      .eq("id", accessCode.id);

    if (linkError) {
      return { error: "Failed to link access code. Please contact admin." };
    }

    // Create self party member
    const { data: partyMember, error: pmError } = await admin
      .from("party_members")
      .insert({
        board_member_id: boardMember.id,
        name: accessCode.board_member_name,
        relationship: "self",
      })
      .select()
      .single();

    if (pmError || !partyMember) {
      return { error: "Failed to create party member. Please contact admin." };
    }

    // Create itinerary for self
    const { error: itError } = await admin.from("itineraries").insert({
      party_member_id: partyMember.id,
      board_member_id: boardMember.id,
      event_id: accessCode.event_id,
    });

    if (itError) {
      return { error: "Failed to create itinerary. Please contact admin." };
    }

    // Now sign in with the newly created account
    const { error: newSignInError } = await supabase.auth.signInWithPassword({
      email: syntheticEmail,
      password,
    });

    if (newSignInError) {
      return { error: "Account created but sign-in failed. Please try again." };
    }
  }

  redirect(ROLE_DASHBOARDS[ROLES.BOARD_MEMBER]);
}

export async function loginWithEmail(email: string, password: string, role: Role) {
  const supabase = await createClient();

  // Prevent board member emails from logging in through email form
  if (email.endsWith(`@${SYNTHETIC_EMAIL_DOMAIN}`)) {
    return { error: "Please use the access code login instead." };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Invalid email or password." };
  }

  // Verify user has the correct role
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication failed." };
  }

  const userRole = user.user_metadata?.role as Role | undefined;

  if (!userRole || userRole !== role) {
    await supabase.auth.signOut();
    return { error: `This account does not have ${role} access.` };
  }

  redirect(ROLE_DASHBOARDS[role]);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
