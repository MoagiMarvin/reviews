const fs = require('fs');
const path = require('path');

// Manually load .env
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      process.env[key] = val;
    }
  });
}

const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log('--- Inspecting requests table schema ---');
  const { data: requests, error: reqError } = await supabaseAdmin.from('requests').select('*').limit(1);
  if (reqError) {
    console.error('Failed to query requests:', reqError);
  } else {
    console.log('Requests sample row:', requests);
  }

  console.log('--- Inspecting reviews table schema ---');
  const { data: reviews, error: revError } = await supabaseAdmin.from('reviews').select('*').limit(1);
  if (revError) {
    console.error('Failed to query reviews:', revError);
  } else {
    console.log('Reviews sample row:', reviews);
  }
}

run();
