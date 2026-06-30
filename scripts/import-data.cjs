const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const TABLES = [
  'profiles', 'user_roles', 'brokers', 'broker_staff', 
  'subscription_plans', 'subscriptions', 'listings', 'listing_images',
  'deal_rooms', 'deal_room_members', 'deal_requests', 'deal_messages',
  'notifications', 'contact_submissions', 'kyc_documents'
];

async function main() {
  console.log("=== Phase 5b: Import Data ===");
  const NEW_URL = process.env.NEW_SUPABASE_URL;
  const NEW_KEY = process.env.NEW_SUPABASE_SERVICE_ROLE_KEY;
  const newClient = createClient(NEW_URL, NEW_KEY);

  const dumpDir = path.join(__dirname, '..', 'supabase', 'dump');

  for (const table of TABLES) {
    const filePath = path.join(dumpDir, `${table}.json`);
    if (!fs.existsSync(filePath)) {
      console.log(`Skipping ${table}, no dump found.`);
      continue;
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (data.length === 0) continue;

    console.log(`Inserting ${data.length} rows into ${table}...`);
    // Insert in batches if large, assuming small enough for array insert
    const { error } = await newClient.from(table).insert(data);
    if (error) {
      console.error(`🚨 FAILED to insert into ${table}:`, error.message);
    } else {
      console.log(`✅ ${table}: Successfully migrated.`);
    }
  }
}
main();
