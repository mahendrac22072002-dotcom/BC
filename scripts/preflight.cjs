const { createClient } = require('@supabase/supabase-js');

async function main() {
  console.log("=== Phase 0: Preflight Validation ===");

  const OLD_URL = process.env.OLD_SUPABASE_URL;
  const OLD_KEY = process.env.OLD_SUPABASE_SERVICE_ROLE_KEY;
  const NEW_URL = process.env.NEW_SUPABASE_URL;
  const NEW_KEY = process.env.NEW_SUPABASE_SERVICE_ROLE_KEY;

  if (!OLD_URL || !OLD_KEY || !NEW_URL || !NEW_KEY) {
    console.error("🚨 PREFLIGHT FAILED: Missing Administrative Credentials.");
    process.exit(1);
  }

  const oldClient = createClient(OLD_URL, OLD_KEY);
  const newClient = createClient(NEW_URL, NEW_KEY);

  try {
    const { error: oldErr } = await oldClient.from('profiles').select('id').limit(1);
    if (oldErr && oldErr.code !== 'PGRST116') throw oldErr;
    console.log("✅ Preflight: Old Project Reachable via Service Role");

    const { error: newErr } = await newClient.from('profiles').select('id').limit(1);
    if (newErr && newErr.code !== 'PGRST116' && newErr.code !== '42P01') throw newErr; 
    console.log("✅ Preflight: New Project Reachable via Service Role");
  } catch (e) {
    console.error("🚨 PREFLIGHT FAILED: Connection error.", e.message);
    process.exit(1);
  }
}
main();
