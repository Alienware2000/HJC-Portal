// Bootstrap an admin account in the local Supabase instance.
// Run with: node scripts/create-admin.mjs
//
// Usage notes:
// - Uses SUPABASE_SERVICE_ROLE_KEY (server-only) to bypass RLS.
// - Idempotent: skips creation if the email already exists.
// - The on_auth_user_created trigger creates the profile row from
//   user_metadata.role automatically.

import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const ENV_PATH = "/home/alienware2000/dev/healing-jesus-project/.env.local";

function loadEnv() {
  const env = {};
  const raw = fs.readFileSync(ENV_PATH, "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@local.test";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin1234";
const ADMIN_NAME = process.env.ADMIN_NAME || "Local Admin";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Check if admin already exists.
const { data: list } = await supabase.auth.admin.listUsers({ perPage: 200 });
const existing = list?.users?.find((u) => u.email === ADMIN_EMAIL);

if (existing) {
  // Make sure the profile is admin role (in case it drifted).
  const { error: updateErr } = await supabase
    .from("profiles")
    .update({ role: "admin", full_name: ADMIN_NAME })
    .eq("id", existing.id);
  if (updateErr) {
    console.error("Failed to ensure admin role:", updateErr.message);
    process.exit(1);
  }
  console.log(`✓ Admin already exists: ${ADMIN_EMAIL} (role re-asserted)`);
} else {
  const { data, error } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { role: "admin", full_name: ADMIN_NAME },
  });
  if (error) {
    console.error("Failed to create admin:", error.message);
    process.exit(1);
  }
  console.log(`✓ Created admin: ${ADMIN_EMAIL}`);
  console.log(`  user_id: ${data.user.id}`);
}

console.log("");
console.log("Log in at:  http://localhost:3000/admin-login");
console.log(`Email:      ${ADMIN_EMAIL}`);
console.log(`Password:   ${ADMIN_PASSWORD}`);
