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
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('--- Checking connection with Admin Client ---');
  const { data: users, error: usersErr } = await supabaseAdmin.auth.admin.listUsers();
  if (usersErr) {
    console.error('Failed to list users:', usersErr);
  } else {
    console.log(`Found ${users.users.length} users:`);
    users.users.forEach(u => {
      console.log(`- ID: ${u.id}, Email: ${u.email}, Metadata:`, u.user_metadata);
    });
  }

  const { data: businesses, error: bizErr } = await supabaseAdmin.from('businesses').select('*');
  if (bizErr) {
    console.error('Failed to fetch businesses (admin):', bizErr);
  } else {
    console.log(`Found ${businesses.length} businesses (admin):`, businesses);
  }

  console.log('\n--- Checking with Anon Client (anonymous) ---');
  const { data: anonBiz, error: anonBizErr } = await supabaseAnon.from('businesses').select('*');
  if (anonBizErr) {
    console.error('Failed to fetch businesses (anon):', anonBizErr.message);
  } else {
    console.log(`Found ${anonBiz?.length || 0} businesses (anon):`, anonBiz);
  }
}

run();
