const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = "https://idwhziowauusuyxwetis.supabase.co";
const SUPABASE_KEY = "sb_publishable_GZmx-Hg2P0QZGgO2ibgNcQ_d3g2SVim";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runDiagnostics() {
  console.log("--- Starting Application Diagnostics ---");

  // 1. Authenticate as our test user
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'test@brokersconnect.com',
    password: 'password123'
  });

  if (authError) {
    console.error("Auth Error:", authError);
    return;
  }
  const user = authData.user;
  console.log("Authenticated as:", user.id);

  // 1. Listings/Marketplace Fetch
  console.log("\n[TEST 1] Marketplace Listings Fetch...");
  try {
    const { data: listings, error: listError } = await supabase
      .from("listings")
      .select("*, broker:broker_id(full_name, firm, kyc_status)")
      .eq("status", "active")
      .neq("broker_id", user.id)
      .limit(10);
    
    if (listError) {
      console.error("PostgREST Error:", listError);
    } else {
      console.log(`Fetched ${listings.length} listings. HTTP 200 OK.`);
      // Check for potential frontend crash (null broker)
      for (const l of listings) {
        if (!l.broker) {
          console.error(`RUNTIME CRASH DETECTED: Listing ${l.id} has null broker relationship.`);
        }
      }
    }
  } catch (e) {
    console.error("JS Exception:", e);
  }

  // 2. Profile Update (Settings)
  console.log("\n[TEST 2] Profile Update...");
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ city: "Mumbai" })
    .eq("id", user.id);
  if (profileError) {
    console.error("PostgREST Error:", profileError);
  } else {
    console.log("Profile updated successfully. HTTP 200 OK.");
  }

  // 3. Support Ticket Creation
  console.log("\n[TEST 3] Support Ticket Creation...");
  const { data: threadData, error: threadError } = await supabase
    .from("support_threads")
    .insert({
      opener_id: user.id,
      subject: "Test Ticket",
      status: "open",
    });
  if (threadError) {
    console.error("PostgREST Error:", threadError);
  } else {
    console.log("Support thread created successfully. HTTP 201 Created.");
  }

  // 4. KYC Storage Upload
  console.log("\n[TEST 4] KYC Storage Upload...");
  const mockFile = new Blob(["test"], { type: 'text/plain' });
  const kycPath = `${user.id}/test-${Date.now()}.txt`;
  const { data: upData, error: upError } = await supabase.storage
    .from("kyc")
    .upload(kycPath, mockFile, { upsert: false });
  if (upError) {
    console.error("Storage Error:", upError);
  } else {
    console.log("KYC file uploaded successfully.");
    const { error: kycError } = await supabase
      .from("kyc_documents")
      .insert({
        broker_id: user.id,
        doc_type: "aadhar",
        file_path: kycPath,
        status: "uploaded"
      });
    if (kycError) {
      console.error("KYC DB Insert Error:", kycError);
    } else {
      console.log("KYC document inserted successfully.");
    }
  }
}

runDiagnostics().catch(console.error);
