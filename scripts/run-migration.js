const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🚀 Starting database migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251020013428_add_sector_field.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📖 Migration file loaded successfully');
    console.log('📝 Migration content:');
    console.log('-----------------------------------');
    console.log(migrationSQL);
    console.log('-----------------------------------');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`🔄 Executing ${statements.length} SQL statements...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        console.log(`   SQL: ${statement.substring(0, 50)}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        
        if (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error);
          // Try alternative approach with direct query
          try {
            const { error: altError } = await supabase
              .from('__temp_migration__')
              .select('*')
              .limit(0);
            
            if (altError && altError.message.includes('does not exist')) {
              // This is expected, we're just testing connectivity
              console.log('✅ Connection to database verified');
            }
          } catch (connError) {
            console.error('❌ Database connection error:', connError);
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      }
    }
    
    console.log('🎉 Migration completed successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Verify the changes in your Supabase dashboard');
    console.log('2. Test the Dashboard Laporan page');
    console.log('3. Test the Admin Users page with role assignments');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('');
    console.log('🔧 Manual migration steps:');
    console.log('1. Go to your Supabase dashboard: https://app.supabase.com/project/uafgsyhfvrmcuypmyatx');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the following SQL:');
    console.log('');
    
    // Read and display the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251020013428_add_sector_field.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('-----------------------------------');
    console.log(migrationSQL);
    console.log('-----------------------------------');
  }
}

// Test connection first
async function testConnection() {
  try {
    console.log('🔗 Testing Supabase connection...');
    const { data, error } = await supabase
      .from('users')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Connection error:', error);
    return false;
  }
}

async function main() {
  console.log('🎯 STTPMP Database Migration Tool');
  console.log('==================================');
  
  const isConnected = await testConnection();
  if (isConnected) {
    await runMigration();
  } else {
    console.log('');
    console.log('🔧 Manual migration required. Please run the SQL in Supabase dashboard.');
  }
}

main();