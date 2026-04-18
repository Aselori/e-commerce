#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(join(process.cwd(), ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

console.log("=== auth.users ===");
const { data: users, error: uErr } = await supabase.auth.admin.listUsers({
  perPage: 200,
});
if (uErr) console.error(uErr);
else
  users.users.forEach((u) =>
    console.log(
      `  ${u.email}  confirmed=${!!u.email_confirmed_at}  id=${u.id}`
    )
  );

console.log("\n=== public.profiles ===");
const { data: profiles, error: pErr } = await supabase
  .from("profiles")
  .select("id, role, created_at");
if (pErr) console.error(pErr);
else profiles.forEach((p) => console.log(`  ${p.id}  role=${p.role}`));
