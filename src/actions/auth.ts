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

  if (codeError || !accessCode || !accessCode.events?.is_active) {
    return { error: "Invalid access code. Please check and try again." };
  }

  // 2. Build synthetic email and attempt sign-in
  const syntheticEmail = toSyntheticEmail(normalizedCode);
  const password = normalizedCode; // Code itself serves as password

  // Try to sign in first (returning user)
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: syntheticEmail,
    password,
  });

  let userId: string;

  if (signInError) {
    // New user — create account
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

    userId = newUser.user.id;
  } else {
    // Returning user — get their ID
    const { data: { user: existingUser } } = await supabase.auth.getUser();
    if (!existingUser) return { error: "Authentication failed." };
    userId = existingUser.id;
  }

  // Check if provisioning is complete (handles both new users and partial failure recovery)
  const { data: existingBm } = await admin
    .from("board_members")
    .select("id, party_members(id, itineraries(id))")
    .eq("user_id", userId)
    .eq("event_id", accessCode.event_id)
    .single();

  if (!existingBm) {
    // Provision board_member, party_member (self), and itinerary
    const { data: boardMember, error: bmError } = await admin
      .from("board_members")
      .insert({
        event_id: accessCode.event_id,
        user_id: userId,
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
  } else {
    // Board member exists — check if party member and itinerary exist
    const partyMembers = Array.isArray(existingBm.party_members) ? existingBm.party_members : [];
    if (partyMembers.length === 0) {
      const { data: partyMember, error: pmError } = await admin
        .from("party_members")
        .insert({
          board_member_id: existingBm.id,
          name: accessCode.board_member_name,
          relationship: "self",
        })
        .select()
        .single();

      if (pmError || !partyMember) {
        return { error: "Failed to recover party member. Please contact admin." };
      }

      const { error: itRecoverError } = await admin.from("itineraries").insert({
        party_member_id: partyMember.id,
        board_member_id: existingBm.id,
        event_id: accessCode.event_id,
      });

      if (itRecoverError) {
        return { error: "Failed to recover itinerary. Please contact admin." };
      }
    } else {
      // Check if itinerary exists for the self party member
      const selfPm = partyMembers[0];
      const itineraries = Array.isArray(selfPm.itineraries) ? selfPm.itineraries : selfPm.itineraries ? [selfPm.itineraries] : [];
      if (itineraries.length === 0) {
        const { error: itFixError } = await admin.from("itineraries").insert({
          party_member_id: selfPm.id,
          board_member_id: existingBm.id,
          event_id: accessCode.event_id,
        });

        if (itFixError) {
          return { error: "Failed to recover itinerary. Please contact admin." };
        }
      }
    }
  }

  // Sign in if we created a new user (wasn't signed in yet)
  if (signInError) {
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

  // Use profiles table as authoritative role source (matches JWT hook)
  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = profile?.role as Role | undefined;

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
