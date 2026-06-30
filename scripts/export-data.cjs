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
  console.log("=== Phase 5a: Export Data ===");
  const OLD_URL = process.env.OLD_SUPABASE_URL;
  const OLD_KEY = process.env.OLD_SUPABASE_SERVICE_ROLE_KEY;
  const oldClient = createClient(OLD_URL, OLD_KEY);

  const dumpDir = path.join(__dirname, '..', 'supabase', 'dump');
  if (!fs.existsSync(dumpDir)) fs.mkdirSync(dumpDir, { recursive: true });

  for (const table of TABLES) {
    console.log(`Extracting ${table}...`);
    const { data, error } = await oldClient.from(table).select('*');
    if (error) {
      console.warn(`⚠️ Failed to extract ${table}:`, error.message);
      continue;
    }
    fs.writeFileSync(path.join(dumpDir, `${table}.json`), JSON.stringify(data, null, 2));
    console.log(`✅ ${table}: Extracted ${data.length} rows.`);
  }
}
main();
