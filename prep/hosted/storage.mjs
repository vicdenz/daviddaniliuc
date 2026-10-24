import { createClient } from "@supabase/supabase-js";

let client;
export function getDb() {
  if (!process.env.PREP_SUPABASE_URL || !process.env.PREP_SUPABASE_SECRET_KEY)
    throw Object.assign(new Error("Prep storage is not configured."), {
      status: 503,
    });
  return (client ??= createClient(
    process.env.PREP_SUPABASE_URL,
    process.env.PREP_SUPABASE_SECRET_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  ));
}
