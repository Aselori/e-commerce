#!/usr/bin/env node
// Seed generic admin + dummy customer accounts.
// Usage: pnpm seed:users
//
// Reads .env.local for SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
// Idempotent: skips users that already exist, promotes the admin if needed.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const envPath = join(process.cwd(), ".env.local");
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const idx = line.indexOf("=");
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
    })
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const users = [
  { email: "admin@fimetienda.com", password: "Admin!2026", role: "admin" },
  { email: "cliente@fimetienda.com", password: "Cliente!2026", role: "customer" },
];

async function findUserByEmail(email) {
  // auth.admin.listUsers paginates; 100 is plenty for a seed script.
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (error) throw error;
  return data.users.find((u) => u.email === email) ?? null;
}

async function upsert(user) {
  let existing = await findUserByEmail(user.email);
  if (existing) {
    console.log(`• ${user.email} already exists (${existing.id})`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
    });
    if (error) throw error;
    existing = data.user;
    console.log(`✓ Created ${user.email} (${existing.id})`);
  }

  const { error: roleError } = await supabase
    .from("profiles")
    .upsert({ id: existing.id, role: user.role }, { onConflict: "id" });
  if (roleError) throw roleError;
  console.log(`  role=${user.role}`);
}

for (const u of users) {
  await upsert(u);
}

console.log("\nDone. Credentials:");
for (const u of users) {
  console.log(`  ${u.role.padEnd(8)} ${u.email}  /  ${u.password}`);
}
