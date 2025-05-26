const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkProperty() {
  console.log('🔍 Checking property and user data...');
  
  // Check if property exists
  const { data: property, error: propError } = await supabase
    .from('properties')
    .select('*')
    .eq('id', 'd2a69e47-b372-4b98-bb1e-717315e4001c')
    .single();
    
  if (propError) {
    console.error('❌ Property error:', propError);
  } else {
    console.log('✅ Property found:', property.address);
    console.log('   User ID:', property.user_id);
    console.log('   Property Code:', property.property_code);
  }
  
  // Check if user exists
  if (property?.user_id) {
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(property.user_id);
    
    if (userError) {
      console.error('❌ User error:', userError);
    } else {
      console.log('✅ User found:', user.user?.email || 'No email');
    }
  }
  
  // Check what users exist in auth.users
  console.log('\n🔍 Checking existing users...');
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError) {
    console.error('❌ Users error:', usersError);
  } else {
    console.log(`✅ Found ${users.users.length} users:`);
    users.users.forEach(user => {
      console.log(`   - ${user.id}: ${user.email || 'No email'}`);
    });
  }
}

checkProperty(); 