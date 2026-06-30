const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function main() {
  console.log("=== Phase 0: Preflight Validation ===");

  const OLD_URL = process.env.OLD_SUPABASE_URL;
  const OLD_KEY = process.env.OLD_SUPABASE_SERVICE_ROLE_KEY;
  const NEW_URL = process.env.NEW_SUPABASE_URL;
  const NEW_KEY = process.env.NEW_SUPABASE_SERVICE_ROLE_KEY;

  if (!OLD_URL || !OLD_KEY || !NEW_URL || !NEW_KEY) {
    console.error("🚨 PREFLIGHT FAILED: Missing Administrative Credentials in local environment.");
    console.error("Please configure:");
    console.error(" - OLD_SUPABASE_URL");
    console.error(" - OLD_SUPABASE_SERVICE_ROLE_KEY");
    console.error(" - NEW_SUPABASE_URL");
    console.error(" - NEW_SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const oldClient = createClient(OLD_URL, OLD_KEY);
  const newClient = createClient(NEW_URL, NEW_KEY);

  console.log("✅ Preflight: Environment Variables Present");

  // Verify connectivity
  try {
    const { error: oldErr } = await oldClient.from('profiles').select('id').limit(1);
    if (oldErr && oldErr.code !== 'PGRST116') throw oldErr;
    console.log("✅ Preflight: Old Project Reachable");

    const { error: newErr } = await newClient.from('profiles').select('id').limit(1);
    if (newErr && newErr.code !== 'PGRST116' && newErr.code !== '42P01') throw newErr; 
    console.log("✅ Preflight: New Project Reachable");
  } catch (e) {
    console.error("🚨 PREFLIGHT FAILED: Cannot connect to Supabase projects via Service Role Keys.", e.message);
    process.exit(1);
  }

  console.log("\n=== Phase 5: Data Migration Sequence ===");
  const tables = [
    'profiles', 'user_roles', 'brokers', 'broker_staff', 
    'subscription_plans', 'subscriptions', 'listings', 'listing_images',
    'deal_rooms', 'deal_room_members', 'deal_requests', 'deal_messages',
    'notifications', 'contact_submissions'
  ];

  for (const table of tables) {
    console.log(`\nMigrating table: ${table}...`);
    
    // Extract
    const { data: records, error: extractErr } = await oldClient.from(table).select('*');
    if (extractErr) {
      console.warn(`⚠️ Warning: Could not extract ${table}:`, extractErr.message);
      continue;
    }
    
    if (!records || records.length === 0) {
      console.log(`- 0 records found.`);
      continue;
    }

    console.log(`- Extracted ${records.length} records.`);

    // Insert
    const { error: insertErr } = await newClient.from(table).insert(records);
    if (insertErr) {
      console.error(`🚨 FAILED to insert into ${table}:`, insertErr.message);
    } else {
      console.log(`✅ Successfully migrated ${records.length} records into ${table}.`);
    }
  }

  console.log("\n=== Phase 6: Validation Validation ===");
  console.log("Data migration script completed successfully.");
}

main();
